-- KYC table
CREATE TABLE IF NOT EXISTS kyc (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT '',
  id_type TEXT NOT NULL DEFAULT 'cnic' CHECK (id_type IN ('cnic', 'passport', 'national_id')),
  id_number TEXT NOT NULL DEFAULT '',
  id_front_url TEXT DEFAULT '',
  id_back_url TEXT DEFAULT '',
  selfie_url TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT DEFAULT '',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

-- Add kyc_status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT NOT NULL DEFAULT 'none' CHECK (kyc_status IN ('none', 'pending', 'verified', 'rejected'));

-- Storage bucket for KYC docs
INSERT INTO storage.buckets (id, name, public) VALUES ('kyc-docs', 'kyc-docs', false)
ON CONFLICT DO NOTHING;

-- KYC storage policies
CREATE POLICY "Users can upload own kyc docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'kyc-docs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view kyc docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'kyc-docs');
