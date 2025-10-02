-- Créer le profil pour user@heleam.com
INSERT INTO profiles (
  id, 
  email, 
  full_name, 
  first_name, 
  last_name,
  is_admin,
  created_at,
  updated_at
) VALUES (
  2,
  'user@heleam.com',
  'Utilisateur Test',
  'Utilisateur',
  'Test',
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  is_admin = EXCLUDED.is_admin,
  updated_at = NOW();

-- Vérifier que le profil a été créé
SELECT id, email, full_name, is_admin, created_at FROM profiles WHERE email = 'user@heleam.com';
