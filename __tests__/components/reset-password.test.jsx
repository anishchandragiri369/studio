/**
 * Unit tests for the Reset Password component
 */

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import ResetPasswordPage from '@/app/reset-password/page';

// Mock Next.js hooks
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

const mockSearchParams = {
  get: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => mockSearchParams,
}));

// Mock Supabase client
jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      signOut: jest.fn(),
      setSession: jest.fn(),
      exchangeCodeForSession: jest.fn(),
      updateUser: jest.fn(),
    }
  }
}));

describe('Reset Password Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mock implementations
    mockRouter.push.mockReset();
    mockRouter.replace.mockReset();
    mockRouter.back.mockReset();
    mockSearchParams.get.mockReset();
    
    // Mock window.location
    delete window.location;
    window.location = {
      hash: '',
      pathname: '/reset-password',
      search: '',
      href: 'http://localhost:9002/reset-password',
    };
    
    // Mock window.history
    window.history = {
      replaceState: jest.fn(),
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Token Extraction', () => {
    it('should extract token from query parameters', async () => {
      mockSearchParams.get.mockImplementation((key) => {
        const params = {
          'token': 'test-recovery-token',
          'type': 'recovery'
        };
        return params[key] || null;
      });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Recovery Token: Present/)).toBeInTheDocument();
        expect(screen.getByText(/Type: recovery/)).toBeInTheDocument();
      });
    });

    it('should extract access token from URL hash', async () => {
      window.location.hash = '#access_token=test-access-token&refresh_token=test-refresh-token&type=recovery';
      
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Access Token: Present/)).toBeInTheDocument();
        expect(screen.getByText(/Refresh Token: Present/)).toBeInTheDocument();
      });
    });

    it('should prioritize hash parameters over query parameters', async () => {
      window.location.hash = '#access_token=hash-token&type=recovery';
      mockSearchParams.get.mockImplementation((key) => {
        const params = {
          'token': 'query-token',
          'type': 'recovery'
        };
        return params[key] || null;
      });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Access Token: Present/)).toBeInTheDocument();
        expect(screen.getByText(/Recovery Token: Present/)).toBeInTheDocument();
      });
    });
  });

  describe('Session Handling', () => {
    it('should sign out existing session on mount', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'existing-session' } }
      });
      supabase.auth.signOut.mockResolvedValue({ error: null });

      mockSearchParams.get.mockImplementation((key) => {
        const params = {
          'token': 'test-recovery-token',
          'type': 'recovery'
        };
        return params[key] || null;
      });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(supabase.auth.signOut).toHaveBeenCalledWith({ scope: 'local' });
      });
    });

    it('should set sessionReady to true when valid tokens are present', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      mockSearchParams.get.mockImplementation((key) => {
        const params = {
          'token': 'test-recovery-token',
          'type': 'recovery'
        };
        return params[key] || null;
      });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Session Ready: Yes/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Reset Password/ })).not.toBeDisabled();
      });
    });

    it('should show error when no valid tokens are present', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      mockSearchParams.get.mockReturnValue(null);

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid reset link/)).toBeInTheDocument();
      });
    });
  });

  describe('Password Reset Form', () => {
    beforeEach(() => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: null }
      });

      mockSearchParams.get.mockImplementation((key) => {
        const params = {
          'token': 'test-recovery-token',
          'type': 'recovery'
        };
        return params[key] || null;
      });
    });

    it('should validate password length', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/ })).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/New Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Reset Password/ });

      fireEvent.change(passwordInput, { target: { value: '12345' } });
      fireEvent.change(confirmPasswordInput, { target: { value: '12345' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password must be at least 6 characters/)).toBeInTheDocument();
      });
    });

    it('should validate password confirmation match', async () => {
      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/ })).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/New Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Reset Password/ });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/)).toBeInTheDocument();
      });
    });

    it('should successfully reset password with valid inputs', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'new-session' } },
        error: null
      });
      supabase.auth.updateUser.mockResolvedValue({ error: null });
      supabase.auth.signOut.mockResolvedValue({ error: null });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/ })).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/New Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Reset Password/ });

      fireEvent.change(passwordInput, { target: { value: 'newpassword123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'newpassword123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('test-recovery-token');
        expect(supabase.auth.updateUser).toHaveBeenCalledWith({ password: 'newpassword123' });
      });

      await waitFor(() => {
        expect(screen.getByText(/Password Reset Successfully/)).toBeInTheDocument();
      });

      // Should redirect to login after success
      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/login?message=password-reset-success');
      }, { timeout: 3000 });
    });

    it('should handle password update errors gracefully', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.exchangeCodeForSession.mockResolvedValue({
        data: { session: { access_token: 'new-session' } },
        error: null
      });
      supabase.auth.updateUser.mockResolvedValue({ 
        error: { message: 'Password too weak' } 
      });

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Reset Password/ })).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/New Password/);
      const confirmPasswordInput = screen.getByLabelText(/Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Reset Password/ });

      fireEvent.change(passwordInput, { target: { value: 'weakpass' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'weakpass' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Password too weak/)).toBeInTheDocument();
      });
    });
  });

  describe('URL Hash Cleanup', () => {
    it('should clean URL hash after extracting tokens', async () => {
      const { supabase } = require('@/lib/supabaseClient');
      supabase.auth.getSession.mockResolvedValue({
        data: { session: { access_token: 'session-from-supabase' } }
      });
      supabase.auth.signOut.mockResolvedValue({ error: null });

      window.location.hash = '#access_token=test-token&refresh_token=test-refresh&type=recovery';

      render(<ResetPasswordPage />);
      
      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });
  });
});
