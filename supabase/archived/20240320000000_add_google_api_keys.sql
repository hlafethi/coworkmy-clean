-- Create table for Google API keys
CREATE TABLE IF NOT EXISTS google_api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key TEXT NOT NULL,
    place_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE google_api_keys ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read keys
CREATE POLICY "Authenticated users can read Google API keys"
    ON google_api_keys
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy for service role to manage keys
CREATE POLICY "Service role can manage Google API keys"
    ON google_api_keys
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_google_api_keys_updated_at
    BEFORE UPDATE ON google_api_keys
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 