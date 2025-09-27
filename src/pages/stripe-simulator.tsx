import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function StripeSimulator() {
    return (
        <div className="container mx-auto px-4 py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Simulateur Stripe (Test)</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4">Cette page simule un paiement Stripe pour les tests front-end.</p>
                    <Button className="w-full">
                        Payer avec Stripe (faux)
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
} 