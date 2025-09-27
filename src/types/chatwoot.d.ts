interface Window {
  chatwootSettings?: {
    hideMessageBubble: boolean;
    position: 'left' | 'right';
    locale: string;
    type: 'standard' | 'expanded_bubble';
    launcherTitle: string;
    showPopoutButton?: boolean;
    darkMode?: 'auto' | 'light' | 'dark';
  };
  chatwootSDK?: {
    run: (config: { websiteToken: string; baseUrl: string }) => void;
  };
  $chatwoot?: {
    setUser: (userId: string, userAttributes: any) => void;
    setCustomAttributes: (attributes: Record<string, any>) => void;
    reset: () => void;
    toggle: () => void;
    setLocale: (locale: string) => void;
    popoutWindow: () => void;
  };
}
