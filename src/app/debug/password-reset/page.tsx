"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function PasswordResetDebugPage() {
  const [email, setEmail] = useState('');
  const [testToken, setTestToken] = useState('');
  const [resetLink, setResetLink] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (step: string, result: any) => {
    setResults(prev => [...prev, { step, result, timestamp: new Date().toISOString() }]);
  };

  const createTestToken = async () => {
    if (!email) {
      alert('Please enter an email address');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/debug/password-reset-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();
      addResult('Create Test Token', result);

      if (result.success) {
        setTestToken(result.token);
        setResetLink(result.resetLink);
      }
    } catch (error) {
      addResult('Create Test Token Error', { error: (error as Error).message });
    }
    setLoading(false);
  };

  const testResetPassword = async () => {
    if (!testToken || !newPassword) {
      alert('Please create a test token and enter a new password');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password-with-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          token: testToken, 
          newPassword: newPassword 
        }),
      });

      const result = await response.json();
      addResult('Reset Password with Token', { 
        status: response.status, 
        statusText: response.statusText,
        result 
      });
    } catch (error) {
      addResult('Reset Password Error', { error: (error as Error).message });
    }
    setLoading(false);
  };

  const listTokens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug/password-reset-tokens');
      const result = await response.json();
      addResult('List All Tokens', result);
    } catch (error) {
      addResult('List Tokens Error', { error: (error as Error).message });
    }
    setLoading(false);
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Password Reset Debug Tool</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Create Test Token</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="Email address (must exist in your Supabase auth.users)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button 
              onClick={createTestToken} 
              disabled={loading}
              className="w-full"
            >
              Create Test Token
            </Button>
            {testToken && (
              <div className="p-3 bg-green-50 rounded border">
                <p className="text-sm font-mono text-green-800">
                  Token: {testToken.substring(0, 20)}...
                </p>
                {resetLink && (
                  <a 
                    href={resetLink} 
                    className="text-blue-600 underline text-sm"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Test Reset Link →
                  </a>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2: Test Password Reset</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="New password (for testing)"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button 
              onClick={testResetPassword} 
              disabled={loading || !testToken}
              className="w-full"
            >
              Test Reset Password
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Debug Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button onClick={listTokens} variant="outline" disabled={loading}>
              List All Tokens
            </Button>
            <Button onClick={clearResults} variant="outline">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Debug Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-sm">{result.step}</span>
                    <span className="text-xs text-gray-500">{result.timestamp}</span>
                  </div>
                  <pre className="text-xs overflow-x-auto bg-gray-100 p-2 rounded">
                    {JSON.stringify(result.result, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
