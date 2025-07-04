// Order caching utility to improve page load performance
// and prevent blank screens when returning to the app

const ORDER_CACHE_KEY = 'elixr_cached_orders';
const ORDER_CACHE_TIMESTAMP = 'elixr_orders_timestamp';
const CACHE_VALIDITY_MS = 60 * 60 * 1000; // 60 minutes - increased for better user experience

/**
 * Save orders to local cache
 * @param {Array} orders - Array of order objects
 * @param {string} userId - User ID for cache isolation
 */
export function cacheOrders(orders, userId) {
  if (!orders || !Array.isArray(orders) || !userId) return;
  
  try {
    // Store orders with timestamp
    localStorage.setItem(`${ORDER_CACHE_KEY}_${userId}`, JSON.stringify(orders));
    localStorage.setItem(`${ORDER_CACHE_TIMESTAMP}_${userId}`, Date.now().toString());
    
    console.log(`Cached ${orders.length} orders for user ${userId}`);
  } catch (error) {
    console.error('Error caching orders:', error);
  }
}

/**
 * Get cached orders if they exist and are still valid
 * @param {string} userId - User ID for cache isolation
 * @returns {Array|null} Array of orders if valid cache exists, null otherwise
 */
export function getCachedOrders(userId) {
  if (!userId) return null;
  
  try {
    // Check if we have a cache and timestamp
    const cachedOrdersString = localStorage.getItem(`${ORDER_CACHE_KEY}_${userId}`);
    const timestampString = localStorage.getItem(`${ORDER_CACHE_TIMESTAMP}_${userId}`);
    
    if (!cachedOrdersString || !timestampString) return null;
    
    // Check if cache is still valid
    const timestamp = parseInt(timestampString);
    const now = Date.now();
    
    if (isNaN(timestamp) || now - timestamp > CACHE_VALIDITY_MS) {
      console.log('Cached orders expired');
      return null;
    }
    
    // Parse and return cached orders
    const orders = JSON.parse(cachedOrdersString);
    console.log(`Retrieved ${orders.length} cached orders for user ${userId}`);
    return orders;
  } catch (error) {
    console.error('Error retrieving cached orders:', error);
    return null;
  }
}

/**
 * Clear cached orders for a user
 * @param {string} userId - User ID for cache isolation 
 */
export function clearOrderCache(userId) {
  if (!userId) return;
  
  try {
    localStorage.removeItem(`${ORDER_CACHE_KEY}_${userId}`);
    localStorage.removeItem(`${ORDER_CACHE_TIMESTAMP}_${userId}`);
    console.log(`Cleared order cache for user ${userId}`);
  } catch (error) {
    console.error('Error clearing order cache:', error);
  }
}
