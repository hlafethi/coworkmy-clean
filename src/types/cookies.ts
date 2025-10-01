export interface CookieSettings {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface CookieConsentSettings {
  id: string;
  title: string;
  description: string;
  accept_button_text: string;
  reject_button_text: string;
  settings_button_text: string;
  save_preferences_text: string;
  necessary_cookies_title: string;
  necessary_cookies_description: string;
  analytics_cookies_title: string;
  analytics_cookies_description: string;
  analytics_cookies_enabled: boolean;
  marketing_cookies_title: string;
  marketing_cookies_description: string;
  marketing_cookies_enabled: boolean;
  privacy_policy_url: string;
  cookie_policy_url: string;
  is_active: boolean;
  banner_position: 'top' | 'bottom';
  banner_layout: 'banner' | 'modal' | 'sidebar';
  primary_color: string;
  secondary_color: string;
  background_color: string;
  text_color: string;
  created_at: string;
  updated_at: string;
}
