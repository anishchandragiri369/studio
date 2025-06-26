-- Create admins table for managing admin users
-- This table stores admin email addresses that have admin privileges

CREATE TABLE IF NOT EXISTS public.admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admins_email ON public.admins(email);
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Only authenticated users can read admin table (for admin checks)
CREATE POLICY "Users can read admins table for admin checks" ON public.admins
  FOR SELECT TO authenticated
  USING (true);

-- Only existing admins can insert/update/delete admin records
CREATE POLICY "Only admins can manage admins table" ON public.admins
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE email = auth.jwt() ->> 'email'
    )
  );

-- Insert initial admin users (replace with your actual admin emails)
INSERT INTO public.admins (email, notes) VALUES 
  ('admin@elixr.com', 'Primary admin account'),
  ('anishchandragiri@gmail.com', 'Admin user'),
  ('keerthy.chandragiri@gmail.com', 'Admin user'),
  ('tejaswiniparipelli@gmail.com', 'Admin user')
ON CONFLICT (email) DO NOTHING;

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_admins_updated_at
    BEFORE UPDATE ON public.admins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Create a view for easier admin management
CREATE OR REPLACE VIEW admin_users AS
SELECT 
  a.id,
  a.email,
  a.user_id,
  u.created_at as user_created_at,
  a.created_at as admin_created_at,
  a.updated_at,
  a.notes,
  CASE 
    WHEN u.id IS NOT NULL THEN 'Active'
    ELSE 'Email Only'
  END as status
FROM public.admins a
LEFT JOIN auth.users u ON a.email = u.email;

COMMENT ON TABLE public.admins IS 'Stores admin user email addresses for authorization checks';
COMMENT ON COLUMN public.admins.email IS 'Admin email address - must be unique';
COMMENT ON COLUMN public.admins.user_id IS 'Optional reference to auth.users table';
COMMENT ON COLUMN public.admins.notes IS 'Optional notes about this admin user';
