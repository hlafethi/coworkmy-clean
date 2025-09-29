import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiClient } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface StripeConfig {
  test_publishable_key: string;
  test_secret_key: string;
  webhook_secret: string;
  live_publishable_key: string;
  live_secret_key: string;
  live_webhook_secret: string;
  mode?: 'test' | 'live';
}

export const PaymentConfig = () => {
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error' | 'loading'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'test' | 'live'>('test');
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  
  // État local pour les valeurs du formulaire
  const [stripeConfig, setStripeConfig] = useState<StripeConfig>({
    test_publishable_key: '',
    test_secret_key: '',
    webhook_secret: '',
    live_publishable_key: '',
    live_secret_key: '',
    live_webhook_secret: '',
    mode: 'test'
  });

  // Charger les paramètres depuis la base de données
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const result = await apiClient.get('/admin/settings');
      
      if (result.success && result.data) {
        // Chercher la configuration Stripe dans les paramètres
        const stripeSetting = result.data.find((setting: any) => setting.key === 'stripe');
        if (stripeSetting?.value) {
          // stripeSetting.value est déjà un objet, pas besoin de JSON.parse
          const stripeData = stripeSetting.value as StripeConfig;
          setStripeConfig({
            test_publishable_key: stripeData.test_publishable_key || '',
            test_secret_key: stripeData.test_secret_key || '',
            webhook_secret: stripeData.webhook_secret || '',
            live_publishable_key: stripeData.live_publishable_key || '',
            live_secret_key: stripeData.live_secret_key || '',
            live_webhook_secret: stripeData.live_webhook_secret || '',
            mode: stripeData.mode || 'test'
          });
        }
      }
    } catch (error) {
      console.error('Erreur inattendue:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Sauvegarder les paramètres
  const saveSettings = async () => {
    try {
      setIsLoading(true);
      
      const result = await apiClient.post('/admin/settings', {
        key: 'stripe',
        value: JSON.stringify(stripeConfig)
      });
      
      if (result.success) {
        toast({
          title: "Succès",
          description: "Les paramètres Stripe ont été mis à jour avec succès",
        });
      } else {
        throw new Error(result.error || 'Erreur de sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Gérer les changements de valeurs
  const handleInputChange = (field: keyof StripeConfig, value: string) => {
    setStripeConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Charger les paramètres au montage
  useEffect(() => {
    loadSettings();
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      toast({
        title: "Information",
        description: "Les clés API Stripe doivent être configurées dans les variables d'environnement",
      });
      toast({
        title: "Instructions",
        description: "Ajoutez VITE_STRIPE_PUBLISHABLE_KEY dans .env.local et STRIPE_SECRET_KEY dans les variables d'environnement Supabase",
        duration: 5000,
      });
      await saveSettings();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde",
      });
    }
  };
  
  // Nouvelle fonction pour basculer le mode Stripe
  const handleSwitchMode = async (mode: 'test' | 'live') => {
    setIsSwitching(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ value: { ...stripeConfig, mode } })
        .eq('key', 'stripe');
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: `Impossible de basculer en mode ${mode}`,
        });
      } else {
        setStripeConfig((prev) => ({ ...prev, mode }));
        toast({
          title: 'Mode Stripe mis à jour',
          description: `Le mode Stripe est maintenant : ${mode === 'live' ? 'Production' : 'Test'}`,
          duration: 3000,
        });
        // Attendre que le toast soit visible avant de recharger
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      }
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Erreur inattendue lors du changement de mode',
      });
    } finally {
      setIsSwitching(false);
    }
  };

  // Nouvelle fonction pour tester la connexion Stripe selon le mode
  const testStripeConnection = async (mode: 'test' | 'live') => {
    setConnectionStatus('loading');
    setTestMessage('');
    try {
      const secretKey = mode === 'live' ? stripeConfig.live_secret_key : stripeConfig.test_secret_key;
      if (!secretKey) {
        setConnectionStatus('error');
        setTestMessage('Veuillez entrer la clé secrète Stripe avant de tester la connexion.');
        return;
      }
      const response = await fetch('https://exffryodynkyizbeesbt.functions.supabase.co/stripe-public-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey }),
      });
      const data = await response.json();
      if (data.success) {
        setConnectionStatus('success');
        setTestMessage(`Connexion à Stripe (${mode === 'live' ? 'production' : 'test'}) réussie ! Compte : ${data.account.id}`);
      } else {
        setConnectionStatus('error');
        setTestMessage(`Erreur Stripe : ${data.error}`);
      }
    } catch (error) {
      setConnectionStatus('error');
      setTestMessage('Erreur lors du test de connexion à Stripe.');
      console.error('Error testing Stripe connection:', error);
    }
  };

  const resetTestKeys = () => {
    setStripeConfig(prev => ({
      ...prev,
      test_publishable_key: '',
      test_secret_key: '',
      webhook_secret: ''
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Configuration des paiements
        </CardTitle>
        <CardDescription>
          Configurez les informations de votre passerelle de paiement
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4 mb-4">
          <Badge color={stripeConfig.mode === 'live' ? 'green' : 'yellow'}>
            {stripeConfig.mode === 'live' ? 'Production' : 'Test'}
          </Badge>
          <Button
            variant={stripeConfig.mode === 'test' ? 'default' : 'outline'}
            onClick={() => handleSwitchMode('test')}
            disabled={isSwitching}
          >
            Mode Test
          </Button>
          <Button
            variant={stripeConfig.mode === 'live' ? 'default' : 'outline'}
            onClick={() => handleSwitchMode('live')}
            className="ml-2"
            disabled={isSwitching}
          >
            Mode Production
          </Button>
          <Button
            variant="secondary"
            onClick={() => testStripeConnection('test')}
            className="ml-4"
          >
            Tester la connexion Test
          </Button>
          <Button
            variant="secondary"
            onClick={() => testStripeConnection('live')}
            className="ml-2"
          >
            Tester la connexion Production
          </Button>
        </div>
        
        {connectionStatus === 'success' && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Connexion réussie</AlertTitle>
            <AlertDescription className="text-green-700">
              {testMessage}
            </AlertDescription>
          </Alert>
        )}
        
        {connectionStatus === 'error' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erreur de connexion</AlertTitle>
            <AlertDescription>
              {testMessage}
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={onSubmit} className="space-y-4">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'test' | 'live')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="test">Mode Test</TabsTrigger>
              <TabsTrigger value="live" className="text-foreground">Mode Production</TabsTrigger>
            </TabsList>
            
            <TabsContent value="test" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Clé Publishable Test
                  </label>
                  <Input
                    type="text"
                    placeholder="pk_test_..."
                    value={stripeConfig.test_publishable_key}
                    onChange={(e) => handleInputChange('test_publishable_key', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Clé Secrète Test
                  </label>
                  <Input
                    type="text"
                    placeholder="sk_test_..."
                    value={stripeConfig.test_secret_key}
                    onChange={(e) => handleInputChange('test_secret_key', e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Webhook Secret Test
                  </label>
                  <Input
                    type="text"
                    placeholder="whsec_..."
                    value={stripeConfig.webhook_secret}
                    onChange={(e) => handleInputChange('webhook_secret', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="live" className="space-y-4 mt-4">
              <Alert>
                <AlertTitle>Mode Production</AlertTitle>
                <AlertDescription>
                  Attention : En mode production, des frais réels seront facturés aux clients. Assurez-vous que votre configuration est correcte.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Clé Publishable Live
                  </label>
                  <Input
                    type="text"
                    placeholder="pk_live_..."
                    value={stripeConfig.live_publishable_key}
                    onChange={(e) => handleInputChange('live_publishable_key', e.target.value)}
                    className="mt-2"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Clé Secrète Live
                  </label>
                  <Input
                    type="text"
                    placeholder="sk_live_..."
                    value={stripeConfig.live_secret_key}
                    onChange={(e) => handleInputChange('live_secret_key', e.target.value)}
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Webhook Secret Live
                  </label>
                  <Input
                    type="text"
                    placeholder="whsec_..."
                    value={stripeConfig.live_webhook_secret}
                    onChange={(e) => handleInputChange('live_webhook_secret', e.target.value)}
                    className="mt-2"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={resetTestKeys}>
              Réinitialiser les clés de test
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PaymentConfig;
