// pages/api/sync-stripe.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { spaceId } = req.body;

  try {
    // Appel à votre fonction Edge
    const response = await fetch(
      `${process.env.SUPABASE_URL}/functions/v1/stripe-sync-queue`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({ spaceId })
      }
    );

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Erreur Stripe: ${response.status} - ${errorData}`);
    }

    res.status(200).json(await response.json());
  } catch (error) {
    console.error('Erreur API sync-stripe:', error);
    res.status(500).json({ error: error.message });
  }
}
