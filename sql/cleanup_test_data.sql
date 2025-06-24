-- Clean up incorrectly created orders and subscriptions
-- Only run this if you need to clean up test data created before the payment fix

-- 1. Delete subscription records that were created without successful payment
DELETE FROM subscription_deliveries 
WHERE subscription_id IN (
  SELECT s.id 
  FROM user_subscriptions s
  LEFT JOIN orders o ON o.user_id = s.user_id 
    AND o.order_type = 'subscription' 
    AND o.status = 'payment_success'
    AND o.created_at BETWEEN s.created_at - INTERVAL '1 hour' AND s.created_at + INTERVAL '1 hour'
  WHERE o.id IS NULL
);

DELETE FROM user_subscriptions 
WHERE id IN (
  SELECT s.id 
  FROM user_subscriptions s
  LEFT JOIN orders o ON o.user_id = s.user_id 
    AND o.order_type = 'subscription' 
    AND o.status = 'payment_success'
    AND o.created_at BETWEEN s.created_at - INTERVAL '1 hour' AND s.created_at + INTERVAL '1 hour'
  WHERE o.id IS NULL
);

-- 2. Delete orders that don't have successful payment status and are older than 1 hour
-- (Keep recent pending orders in case payment is still processing)
DELETE FROM orders 
WHERE status IN ('payment_pending', 'payment_failed') 
  AND created_at < NOW() - INTERVAL '1 hour';

-- 3. Show remaining orders and subscriptions for verification
SELECT 
  'orders' as table_name,
  COUNT(*) as count,
  status
FROM orders 
GROUP BY status
UNION ALL
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as count,
  status
FROM user_subscriptions 
GROUP BY status
ORDER BY table_name, status;

COMMENT ON TABLE orders IS 'Orders now only show in UI when payment is successful';
COMMENT ON TABLE user_subscriptions IS 'Subscriptions are only created after successful payment';
