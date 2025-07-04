// Helper functions for working with ratings across the app

/**
 * Checks if an order has a rating in the database
 * 
 * @param orderId The ID of the order to check
 * @param userId The ID of the user
 * @returns Promise<boolean> True if the order has a rating
 */
export async function checkOrderRating(orderId: string, userId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/ratings/submit?orderId=${orderId}&userId=${userId}`);
    const result = await response.json();
    
    return response.ok && !!result.data.orderRating;
  } catch (error) {
    console.error('Error checking order rating:', error);
    return false;
  }
}

/**
 * Updates the rating_submitted flag on an order object
 * 
 * @param order The order object to update
 * @param hasRating Whether the order has a rating
 */
export function updateOrderRatingStatus(order: any, hasRating: boolean): void {
  if (order && typeof order === 'object') {
    order.rating_submitted = hasRating;
  }
}

/**
 * Batch checks multiple orders for ratings and updates their status
 * 
 * @param orders Array of order objects
 * @param userId The ID of the user
 */
export async function batchCheckOrderRatings(orders: any[], userId: string): Promise<void> {
  if (!orders?.length || !userId) return;
  
  try {
    // Create a map of orderIds to their array index
    const orderMap = new Map();
    orders.forEach((order, index) => {
      orderMap.set(order.id, index);
    });
    
    // Get all order IDs
    const orderIds = orders.map(order => order.id);
    
    // Batch fetch ratings for all orders
    const response = await fetch(`/api/ratings/batch?userId=${userId}&orderIds=${orderIds.join(',')}`);
    const result = await response.json();
    
    if (response.ok && result.data?.ratings) {
      // Update each order with its rating status
      result.data.ratings.forEach((rating: any) => {
        if (rating.order_id && orderMap.has(rating.order_id)) {
          const index = orderMap.get(rating.order_id);
          orders[index].rating_submitted = true;
        }
      });
    }
  } catch (error) {
    console.error('Error batch checking order ratings:', error);
  }
}
