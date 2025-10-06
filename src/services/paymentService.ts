import { apiClient } from "@/lib/api-client";
import { logger } from '@/utils/logger';

export interface StripePayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  customer?: {
    id: string;
    email?: string;
    name?: string;
  };
  charges?: {
    data: Array<{
      id: string;
      amount: number;
      currency: string;
      status: string;
      created: number;
      receipt_url?: string;
    }>;
  };
  created: number;
  description?: string;
  metadata?: {
    booking_id?: string;
    space_name?: string;
  };
}

export async function fetchStripePayments(): Promise<StripePayment[]> {
  try {
    logger.debug("💳 Récupération des paiements Stripe...");
    
    const response = await apiClient.get('/stripe/payments');
    
    if (!response.success) {
      logger.error("❌ Erreur lors de la récupération des paiements:", response.error);
      throw new Error(response.error || "Erreur lors de la récupération des paiements");
    }

    const payments = response.data || [];
    logger.debug(`✅ ${payments.length} paiements récupérés`);
    
    return payments;
  } catch (error) {
    logger.error("❌ Erreur lors de la récupération des paiements:", error);
    throw error;
  }
}

export function formatPaymentAmount(amount: number, currency: string = 'eur'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

export function formatPaymentDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getPaymentStatusColor(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'text-green-600 bg-green-50';
    case 'pending':
      return 'text-yellow-600 bg-yellow-50';
    case 'failed':
    case 'canceled':
      return 'text-red-600 bg-red-50';
    default:
      return 'text-gray-600 bg-gray-50';
  }
}

export function getPaymentStatusText(status: string): string {
  switch (status) {
    case 'succeeded':
      return 'Réussi';
    case 'pending':
      return 'En attente';
    case 'failed':
      return 'Échoué';
    case 'canceled':
      return 'Annulé';
    default:
      return status;
  }
}

export async function refundStripePayment(paymentId: string, amount?: number, reason?: string): Promise<boolean> {
  try {
    logger.debug(`💰 Remboursement du paiement: ${paymentId}`);
    
    const response = await apiClient.post(`/stripe/payments/${paymentId}/refund`, {
      amount,
      reason: reason || 'requested_by_customer'
    });
    
    if (!response.success) {
      logger.error("❌ Erreur lors du remboursement:", response.error);
      throw new Error(response.error || "Erreur lors du remboursement");
    }

    logger.debug(`✅ Remboursement réussi: ${response.data.refund_id}`);
    return true;
  } catch (error) {
    logger.error("❌ Erreur lors du remboursement:", error);
    throw error;
  }
}
