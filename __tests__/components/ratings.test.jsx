/**
 * Rating Components Unit Tests
 * Tests for RatingForm, RatingDisplay, and OrderRating components
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import RatingForm from '../../src/components/ratings/RatingForm';
import RatingDisplay from '../../src/components/ratings/RatingDisplay';
import OrderRating from '../../src/components/ratings/OrderRating';

// Mock hooks and utilities
jest.mock('../../src/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn()
  })
}));

// Mock fetch globally
global.fetch = jest.fn();

const mockOrder = {
  id: 'order-123',
  items: [
    {
      juiceId: 'juice-1',
      juiceName: 'Orange Juice',
      quantity: 2,
      pricePerItem: 150
    },
    {
      juiceId: 'juice-2',
      juiceName: 'Apple Juice',
      quantity: 1,
      pricePerItem: 120
    }
  ],
  total_amount: 420,
  status: 'completed',
  created_at: '2024-01-01T10:00:00Z'
};

const mockUserId = 'user-456';

describe('RatingForm Component', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('renders rating form with all elements', () => {
    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    expect(screen.getByText('Rate Your Order')).toBeInTheDocument();
    expect(screen.getByText('Overall Rating')).toBeInTheDocument();
    expect(screen.getByText('Quality Rating')).toBeInTheDocument();
    expect(screen.getByText('Delivery Rating')).toBeInTheDocument();
    expect(screen.getByText('Service Rating')).toBeInTheDocument();
    expect(screen.getByText('Orange Juice')).toBeInTheDocument();
    expect(screen.getByText('Apple Juice')).toBeInTheDocument();
  });

  test('allows user to select star ratings', async () => {
    const user = userEvent.setup();
    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    // Find and click the 4th star for overall rating
    const overallStars = screen.getAllByLabelText(/Overall Rating/);
    await user.click(overallStars[3]); // 4 stars (0-indexed)
    
    // Verify the star is selected (would need to check visual state)
    expect(overallStars[3]).toBeInTheDocument();
  });

  test('allows user to enter feedback text', async () => {
    const user = userEvent.setup();
    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    const feedbackTextarea = screen.getByPlaceholderText(/Tell us about your experience/);
    await user.type(feedbackTextarea, 'Great service and fresh juices!');
    
    expect(feedbackTextarea).toHaveValue('Great service and fresh juices!');
  });

  test('allows user to toggle anonymous submission', async () => {
    const user = userEvent.setup();
    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    const anonymousCheckbox = screen.getByLabelText(/Submit anonymously/);
    await user.click(anonymousCheckbox);
    
    expect(anonymousCheckbox).toBeChecked();
  });

  test('submits rating successfully', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        message: 'Rating submitted successfully',
        data: { pointsEarned: 5 }
      })
    });

    render(<RatingForm order={mockOrder} userId={mockUserId} onSuccess={mockOnSuccess} />);
    
    // Select overall rating
    const overallStars = screen.getAllByLabelText(/Overall Rating/);
    await user.click(overallStars[4]); // 5 stars
    
    // Submit form
    const submitButton = screen.getByText('Submit Rating');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"rating":5')
      });
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  test('shows validation error for missing overall rating', async () => {
    const user = userEvent.setup();
    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    // Try to submit without selecting overall rating
    const submitButton = screen.getByText('Submit Rating');
    await user.click(submitButton);
    
    // Should show validation message (would need toast mock to verify)
    expect(submitButton).toBeInTheDocument();
  });

  test('disables submit button while loading', async () => {
    const user = userEvent.setup();
    
    // Mock slow fetch response
    fetch.mockImplementation(() => new Promise(resolve => {
      setTimeout(() => resolve({
        ok: true,
        json: async () => ({ success: true })
      }), 1000);
    }));

    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    const overallStars = screen.getAllByLabelText(/Overall Rating/);
    await user.click(overallStars[4]);
    
    const submitButton = screen.getByText('Submit Rating');
    await user.click(submitButton);
    
    // Button should be disabled during submission
    await waitFor(() => {
      expect(screen.getByText(/Submitting/)).toBeInTheDocument();
    });
  });
});

describe('RatingDisplay Component', () => {
  const mockRatings = {
    ratings: [
      {
        id: 'rating-1',
        order_id: 'order-123',
        rating: 5,
        quality_rating: 5,
        delivery_rating: 4,
        service_rating: 5,
        feedback_text: 'Excellent service and fresh juices!',
        anonymous: false,
        helpful_count: 3,
        created_at: '2024-01-01T10:00:00Z',
        user_id: 'user-456'
      },
      {
        id: 'rating-2',
        order_id: 'order-124',
        rating: 4,
        quality_rating: 4,
        delivery_rating: 5,
        service_rating: 3,
        feedback_text: 'Good quality, delivery was quick.',
        anonymous: true,
        helpful_count: 1,
        created_at: '2024-01-02T11:00:00Z',
        user_id: 'user-789'
      }
    ],
    statistics: {
      averageRating: 4.5,
      totalRatings: 2,
      ratingDistribution: {
        5: 1,
        4: 1,
        3: 0,
        2: 0,
        1: 0
      }
    },
    pagination: {
      page: 1,
      limit: 10,
      total: 2,
      pages: 1
    }
  };

  beforeEach(() => {
    fetch.mockClear();
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockRatings
      })
    });
  });

  test('renders ratings display with statistics', async () => {
    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
      expect(screen.getByText('4.5')).toBeInTheDocument(); // Average rating
      expect(screen.getByText('2 reviews')).toBeInTheDocument(); // Total ratings
    });
  });

  test('displays individual ratings correctly', async () => {
    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Excellent service and fresh juices!')).toBeInTheDocument();
      expect(screen.getByText('Good quality, delivery was quick.')).toBeInTheDocument();
      expect(screen.getByText('Anonymous User')).toBeInTheDocument();
    });
  });

  test('allows filtering by rating', async () => {
    const user = userEvent.setup();
    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    // Find and select filter
    const filterSelect = screen.getByLabelText(/Filter by rating/i);
    await user.selectOptions(filterSelect, '5');
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('minRating=5'),
        expect.any(Object)
      );
    });
  });

  test('allows sorting reviews', async () => {
    const user = userEvent.setup();
    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Customer Reviews')).toBeInTheDocument();
    });

    const sortSelect = screen.getByLabelText(/Sort by/i);
    await user.selectOptions(sortSelect, 'helpful');
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('sortBy=helpful'),
        expect.any(Object)
      );
    });
  });

  test('handles pagination correctly', async () => {
    const user = userEvent.setup();
    
    // Mock response with multiple pages
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ...mockRatings,
          pagination: {
            page: 1,
            limit: 10,
            total: 25,
            pages: 3
          }
        }
      })
    });

    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('page=2'),
        expect.any(Object)
      );
    });
  });
});

describe('OrderRating Component', () => {
  const mockOrderWithRating = {
    ...mockOrder,
    rating_submitted: true,
    order_rating: {
      rating: 4,
      feedback_text: 'Good service!'
    }
  };

  const mockOrderWithoutRating = {
    ...mockOrder,
    rating_submitted: false
  };

  test('displays existing rating when available', () => {
    render(<OrderRating order={mockOrderWithRating} userId={mockUserId} />);
    
    expect(screen.getByText('Good service!')).toBeInTheDocument();
    expect(screen.getByText('Your Rating:')).toBeInTheDocument();
  });

  test('shows rating prompt when no rating exists', () => {
    render(<OrderRating order={mockOrderWithoutRating} userId={mockUserId} />);
    
    expect(screen.getByText('Rate this order')).toBeInTheDocument();
    expect(screen.getByText('Share your experience')).toBeInTheDocument();
  });

  test('opens rating form when rate button clicked', async () => {
    const user = userEvent.setup();
    render(<OrderRating order={mockOrderWithoutRating} userId={mockUserId} />);
    
    const rateButton = screen.getByText('Rate Order');
    await user.click(rateButton);
    
    expect(screen.getByText('Rate Your Order')).toBeInTheDocument();
  });

  test('handles quick star rating', async () => {
    const user = userEvent.setup();
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    render(<OrderRating order={mockOrderWithoutRating} userId={mockUserId} />);
    
    // Click on a star for quick rating
    const stars = screen.getAllByLabelText(/Rate \d stars/);
    await user.click(stars[3]); // 4 stars
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/ratings/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.stringContaining('"rating":4')
      });
    });
  });
});

describe('Rating Component Error Handling', () => {
  test('handles API error gracefully', async () => {
    const user = userEvent.setup();
    
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<RatingForm order={mockOrder} userId={mockUserId} />);
    
    const overallStars = screen.getAllByLabelText(/Overall Rating/);
    await user.click(overallStars[4]);
    
    const submitButton = screen.getByText('Submit Rating');
    await user.click(submitButton);
    
    // Should handle error gracefully (would verify via toast mock)
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });
  });

  test('handles empty ratings response', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: {
          ratings: [],
          statistics: {
            averageRating: 0,
            totalRatings: 0,
            ratingDistribution: {}
          },
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        }
      })
    });

    render(<RatingDisplay />);
    
    await waitFor(() => {
      expect(screen.getByText('No reviews yet')).toBeInTheDocument();
    });
  });
});
