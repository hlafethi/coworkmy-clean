import { apiClient } from "@/lib/api-client";
// Logger supprimé - utilisation de console directement

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  order_index: number;
}

export interface KBArticle {
  id: number;
  title: string;
  content: string;
  category: string;
  tags: string[];
  is_published: boolean;
  author_id: string;
  author_name?: string;
  author_email?: string;
  created_at: string;
  updated_at: string;
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

  // Récupérer les articles de base de connaissances
  static async getKBArticles(): Promise<KBArticle[]> {
    try {
      const response = await apiClient.get('/support/kb-articles');
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération des articles');
      }
      return response.data || [];
    } catch (error) {
      console.error('Erreur récupération articles KB:', error);
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
      
      const response = await apiClient.post('/support/tickets', ticketData);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la création du ticket');
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur création ticket:', error);
      throw error;
    }
  }

  // Méthodes de chat supprimées

  static async getTicketResponses(ticketId: string): Promise<any[]> {
    try {
      
      const response = await apiClient.get(`/support/tickets/${ticketId}/responses`);
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de la récupération des réponses');
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Erreur récupération réponses ticket:', error);
      throw error;
    }
  }

  static async addTicketResponse(ticketId: string, message: string): Promise<any> {
    try {
      
      const response = await apiClient.post(`/support/tickets/${ticketId}/responses`, { message });
      
      if (!response.success) {
        throw new Error(response.error || 'Erreur lors de l\'ajout de la réponse');
      }
      
      return response.data;
    } catch (error) {
      console.error('Erreur ajout réponse ticket:', error);
      throw error;
    }
  }
}
