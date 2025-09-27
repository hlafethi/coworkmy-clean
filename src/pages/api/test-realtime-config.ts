import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ 
        error: 'Configuration Supabase manquante',
        details: 'Variables d\'environnement non configurées'
      });
    }

    // Appeler la fonction Edge Supabase
    const response = await fetch(`${supabaseUrl}/functions/v1/check-realtime-config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Erreur fonction Edge:', result);
      return res.status(500).json({
        error: 'Erreur lors de la vérification',
        details: result.error || 'Erreur inconnue'
      });
    }

    return res.status(200).json(result);

  } catch (error) {
    console.error('Erreur API test-realtime-config:', error);
    return res.status(500).json({
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Erreur inconnue'
    });
  }
} 