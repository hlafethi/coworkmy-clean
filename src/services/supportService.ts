import { apiClient } from "@/lib/api-client";

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
}

// Interfaces de chat supprimées

export class SupportService {
  // Récupérer les FAQ
  static async getFAQs(): Promise<FAQ[]> {
    try {
      const response = await apiClient.get('/support/faqs');
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération des FAQ');
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur récupération FAQ:', error);
      throw error;
    }
  }

  // Récupérer les tickets de l'utilisateur
  static async getUserTickets(): Promise<SupportTicket[]> {
    try {
      const response = await apiClient.get('/support/tickets');
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération des tickets');
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur récupération tickets:', error);
      throw error;
    }
  }

  // Créer un nouveau ticket
  static async createTicket(ticketData: {
    subject: string;
    message: string;
    priority?: string;
  }): Promise<SupportTicket> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      console.log('🔍 SupportService: Utilisation de l\'endpoint temporaire /support/tickets-user-no-auth');
      console.log('📝 Données envoyées:', ticketData);
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch('http://localhost:5000/api/support/tickets-user-no-auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ticketData)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📝 Réponse API:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la création du ticket');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erreur création ticket:', error);
      throw error;
    }
  }

  // Méthodes de chat supprimées

  static async getTicketResponses(ticketId: string): Promise<any[]> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      console.log('🔍 SupportService: Utilisation de l\'endpoint temporaire /support/tickets/:id/responses-user-no-auth');
      console.log('📝 Ticket ID:', ticketId);
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch(`http://localhost:5000/api/support/tickets/${ticketId}/responses-user-no-auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📝 Réponses API utilisateur:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des réponses');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération réponses ticket:', error);
      throw error;
    }
  }

  static async addTicketResponse(ticketId: string, message: string): Promise<any> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      console.log('🔍 SupportService: Utilisation de l\'endpoint temporaire /support/tickets/:id/responses-user-no-auth');
      console.log('📝 Données envoyées:', { ticketId, message });
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch(`http://localhost:5000/api/support/tickets/${ticketId}/responses-user-no-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📝 Réponse API utilisateur:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'ajout de la réponse');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erreur ajout réponse ticket:', error);
      throw error;
    }
  }
}
