-- Create user_activation_tokens table for custom email activation
CREATE TABLE IF NOT EXISTS user_activation_tokens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT FALSE,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_token ON user_activation_tokens(token);
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_email ON user_activation_tokens(email);
CREATE INDEX IF NOT EXISTS idx_user_activation_tokens_user_id ON user_activation_tokens(user_id);

-- Add RLS policy (Row Level Security)
ALTER TABLE user_activation_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow service role to manage all activation tokens
CREATE POLICY "Service role can manage activation tokens" ON user_activation_tokens
    FOR ALL USING (true);
