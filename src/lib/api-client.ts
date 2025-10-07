// Logger supprimé - utilisation de console directement
const getApiBaseUrl = () => {
  // Vérifier si on est dans le navigateur et si la configuration est disponible
  if (typeof window !== 'undefined' && window.APP_CONFIG?.API_URL) {
    return `${window.APP_CONFIG.API_URL}/api`;
  }
  // Fallback pour la production - FORCER HTTPS
  return 'https://coworkmy.fr/api';
};

const API_BASE_URL = getApiBaseUrl();

interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
  user?: any;
  token?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Récupérer le token depuis localStorage
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('coworkmy-token');
    }
  }

  // Méthode pour mettre à jour le token
  updateToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('coworkmy-token');
    }
  }

  private async request<T = any>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Mettre à jour le token avant chaque requête
    this.updateToken();
    
    const url = `${API_BASE_URL}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    } else {
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Erreur serveur' };
      }

      return { success: true, data: data.data || data };
    } catch (error) {
      console.error('Erreur API:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  // Authentification
  async signIn(email: string, password: string) {
    const result = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

      if (result.data && result.data.token) {
        this.token = result.data.token;
        if (typeof window !== 'undefined' && this.token) {
          localStorage.setItem('coworkmy-token', this.token);
        }
      }

    return result;
  }

  async signUp(email: string, password: string, fullName?: string) {
    try {
      const result = await this.request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      if (result.success && result.data && result.data.token) {
        this.token = result.data.token;
        if (typeof window !== 'undefined' && this.token) {
          localStorage.setItem('coworkmy-token', this.token);
        }
      }

      return result;
    } catch (error) {
      console.error('Erreur signUp API client:', error);
      return { success: false, error: 'Erreur de connexion' };
    }
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Méthode générique GET
  async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // Méthode générique POST
  async post<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Méthode générique PUT
  async put<T = any>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // Méthode générique DELETE
  async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  async signOut() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('coworkmy-token');
    }
  }

  // Espaces
  async getSpaces() {
    return this.request('/spaces/active');
  }

  async createSpace(spaceData: any) {
    return this.request('/spaces', {
      method: 'POST',
      body: JSON.stringify(spaceData),
    });
  }

  // Réservations
  async getBookings() {
    return this.request('/bookings');
  }

  async createBooking(bookingData: any) {
    return this.request('/bookings', {
      method: 'POST',
      body: JSON.stringify(bookingData),
    });
  }

  // Paramètres admin
  async getAdminSettings() {
    return this.request('/admin/settings');
  }

  // Santé de l'API
  async healthCheck() {
    return this.request('/health');
  }

  // Utilisateurs
  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id: string) {
    return this.request(`/users/${id}`);
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }

  async getUserDocuments(id: string) {
    return this.request(`/users/${id}/documents`);
  }

  // Réservations admin
  async getAdminBookings() {
    return this.request('/admin/bookings');
  }

  async updateBookingStatus(id: string, status: string) {
    return this.request(`/admin/bookings/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async deleteBooking(id: string) {
    return this.request(`/admin/bookings/${id}`, {
      method: 'DELETE',
    });
  }

  // Paiements
  async getPayments() {
    return this.request('/payments');
  }

  // Créneaux horaires
  async getTimeSlots() {
    return this.request('/time-slots');
  }

  async createTimeSlot(timeSlotData: any) {
    return this.request('/time-slots', {
      method: 'POST',
      body: JSON.stringify(timeSlotData),
    });
  }

  async updateTimeSlot(id: string, timeSlotData: any) {
    return this.request(`/time-slots/${id}`, {
      method: 'PUT',
      body: JSON.stringify(timeSlotData),
    });
  }

  async deleteTimeSlot(id: string) {
    return this.request(`/time-slots/${id}`, {
      method: 'DELETE',
    });
  }

  // Modèles d'email
  async getEmailTemplates() {
    return this.request('/email-templates');
  }

  async createEmailTemplate(templateData: any) {
    return this.request('/email-templates', {
      method: 'POST',
      body: JSON.stringify(templateData),
    });
  }

  async updateEmailTemplate(id: string, templateData: any) {
    return this.request(`/email-templates/${id}`, {
      method: 'PUT',
      body: JSON.stringify(templateData),
    });
  }

  async deleteEmailTemplate(id: string) {
    return this.request(`/email-templates/${id}`, {
      method: 'DELETE',
    });
  }

  // Pages légales
  async getLegalPages() {
    return this.request('/legal-pages');
  }

  async createLegalPage(pageData: any) {
    return this.request('/legal-pages', {
      method: 'POST',
      body: JSON.stringify(pageData),
    });
  }

  async updateLegalPage(id: string, pageData: any) {
    return this.request(`/legal-pages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(pageData),
    });
  }

  async deleteLegalPage(id: string) {
    return this.request(`/legal-pages/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient();
