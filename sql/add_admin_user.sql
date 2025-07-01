-- Add admin user script
-- Replace 'your-email@example.com' with your actual email address

-- First check if the email already exists
DO $$
DECLARE
    admin_email TEXT := 'your-email@example.com'; -- CHANGE THIS TO YOUR EMAIL
    existing_admin_count INTEGER;
BEGIN
    -- Check if admin already exists
    SELECT COUNT(*) INTO existing_admin_count 
    FROM admins 
    WHERE email = admin_email;
    
    IF existing_admin_count > 0 THEN
        RAISE NOTICE 'Admin with email % already exists', admin_email;
    ELSE
        -- Insert the admin
        INSERT INTO admins (email, created_at)
        VALUES (admin_email, NOW());
        
        RAISE NOTICE 'Successfully added admin: %', admin_email;
    END IF;
END
$$;

-- Verify the admin was added
SELECT 
    email,
    created_at,
    'Admin successfully added' as status
FROM admins 
ORDER BY created_at DESC;
