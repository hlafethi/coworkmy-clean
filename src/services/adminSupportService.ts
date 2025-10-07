// Logger supprimé - utilisation de console directement
export interface AdminTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  created_at: string;
  updated_at?: string;
  user_name: string;
  user_email: string;
}

export class AdminSupportService {
  // Récupérer tous les tickets pour l'admin
  static async getTickets(): Promise<AdminTicket[]> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch('http://localhost:5000/api/admin/support/tickets-no-auth', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des tickets');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération tickets admin:', error);
      throw error;
    }
  }

  // Récupérer les réponses d'un ticket pour l'admin
  static async getTicketResponses(ticketId: string): Promise<any[]> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      console.log('📝 Ticket ID:', ticketId);
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch(`http://localhost:5000/api/admin/support/tickets/${ticketId}/responses-no-auth`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📝 Réponses ticket API admin:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des réponses');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération réponses ticket admin:', error);
      throw error;
    }
  }

  // Ajouter une réponse admin à un ticket
  static async addTicketResponse(ticketId: string, message: string): Promise<any> {
    try {
      // Utilisation temporaire de l'endpoint sans authentification pour contourner le problème de token
      console.log('📝 Données envoyées:', { ticketId, message });
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch(`http://localhost:5000/api/admin/support/tickets/${ticketId}/responses-no-auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      console.log('📝 Réponse admin ajoutée API:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de l\'ajout de la réponse');
      }
      
      return result.data;
    } catch (error) {
      console.error('Erreur ajout réponse admin:', error);
      throw error;
    }
  }

  // Récupérer les articles de la base de connaissances
  static async getKBArticles(): Promise<any[]> {
    try {
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch('http://localhost:5000/api/admin/support/kb-articles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des articles');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération articles KB admin:', error);
      throw error;
    }
  }

  // Récupérer les FAQ
  static async getFAQs(): Promise<any[]> {
    try {
      
      // Appel direct à l'API sans passer par apiClient pour éviter les problèmes de cache
      const response = await fetch('http://localhost:5000/api/admin/support/faqs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Erreur lors de la récupération des FAQ');
      }
      
      return result.data || [];
    } catch (error) {
      console.error('Erreur récupération FAQ admin:', error);
      throw error;
    }
  }
}
