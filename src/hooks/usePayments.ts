import { useState, useEffect } from "react";
import { isValidPayment } from "@/utils/typeGuards";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Payment, UserDetails } from "@/types/database";

export type PaymentStatus = 'pending' | 'succeeded' | 'failed' | 'refunded';

export interface PaymentWithStatus extends Payment {
  status: PaymentStatus;
}

type PaymentInsert = Omit<Payment, 'id' | 'created_at' | 'updated_at'>;
type PaymentUpdate = Partial<PaymentInsert>;

export function usePayments() {
  const [payments, setPayments] = useState<PaymentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const validPayments = data.map(payment => ({
        ...payment,
        status: payment.status as PaymentStatus
      }));

      setPayments(validPayments);
    } catch (error) {
      console.error('Erreur lors de la récupération des paiements:', error);
      setError(error instanceof Error ? error.message : 'Une erreur est survenue');
      toast.error("Erreur lors de la récupération des paiements");
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (payment: PaymentInsert) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(payment)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidPayment(data)) {
        throw new Error("Erreur lors de la création du paiement");
      }

      setPayments(prev => [data as PaymentWithStatus, ...prev]);
      toast.success("Paiement créé avec succès");
      return data;
    } catch (error) {
      console.error('Erreur création paiement:', error);
      toast.error("Erreur lors de la création du paiement");
      throw error;
    }
  };

  const updatePayment = async (id: string, update: PaymentUpdate) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(update)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (!data || !isValidPayment(data)) {
        throw new Error("Erreur lors de la mise à jour du paiement");
      }

      setPayments(prev => 
        prev.map(payment => 
          payment.id === id ? (data as PaymentWithStatus) : payment
        )
      );
      toast.success("Paiement mis à jour avec succès");
      return data;
    } catch (error) {
      console.error('Erreur mise à jour paiement:', error);
      toast.error("Erreur lors de la mise à jour du paiement");
      throw error;
    }
  };

  const deletePayment = async (id: string) => {
    try {
      const { error } = await supabase
        .from('payments')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPayments(prev => 
        prev.filter(payment => payment.id !== id)
      );
      toast.success("Paiement supprimé avec succès");
    } catch (error) {
      console.error('Erreur suppression paiement:', error);
      toast.error("Erreur lors de la suppression du paiement");
      throw error;
    }
  };

  return {
    payments,
    loading,
    error,
    createPayment,
    updatePayment,
    deletePayment,
    refreshPayments: fetchPayments
  };
} 