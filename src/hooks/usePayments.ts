import { useState, useEffect } from 'react';
import { fetchStripePayments, type StripePayment } from '@/services/paymentService';
import { logger } from '@/utils/logger';

export function usePayments() {
  const [payments, setPayments] = useState<StripePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      logger.debug('💳 Chargement des paiements...');
      
      const paymentsData = await fetchStripePayments();
      setPayments(paymentsData);
      
      logger.debug(`✅ ${paymentsData.length} paiements chargés`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      logger.error('❌ Erreur chargement paiements:', errorMessage);
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