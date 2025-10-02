import { useState, useEffect } from 'react';
import { fetchStripePayments, type StripePayment } from '@/services/paymentService';

export function usePayments() {
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('💳 Chargement des paiements...');
      
      const paymentsData = await fetchStripePayments();
      setPayments(paymentsData);
      
      console.log(`✅ ${paymentsData.length} paiements chargés`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      console.error('❌ Erreur chargement paiements:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const refreshPayments = () => {
    loadPayments();
  };

  useEffect(() => {
    loadPayments();
  }, []);

  return {
    payments,
    loading,
    error,
    refreshPayments
  };
}