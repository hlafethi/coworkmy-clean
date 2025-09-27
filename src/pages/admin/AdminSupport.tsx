import { Helmet } from 'react-helmet-async';
import AdminSupportChat from '@/components/admin/support/AdminSupportChat';
import AdminSupportTickets from '@/components/admin/support/AdminSupportTickets';
import { AdminSupportFaqs } from '@/components/admin/support/AdminSupportFaqs';
import AdminSupportKnowledgeBase from '@/components/admin/support/AdminSupportKnowledgeBase';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { useState } from 'react';

const AdminSupport = () => {
    const [tab, setTab] = useState('chat');
    return (
        <>
            <Helmet>
                <title>Support Admin - CoWorkMy</title>
                <meta name="description" content="Interface d'administration pour répondre au chat support utilisateur." />
            </Helmet>
            <main className="min-h-screen bg-gray-50 py-12">
                <div className="container mx-auto px-4">
                    <h1 className="text-3xl font-bold mb-2">Gestion du support</h1>
                    <p className="text-gray-600 mb-8">Gérez les conversations, tickets et la base de connaissances de vos utilisateurs.</p>
                    <Card className="mb-8">
                        <CardHeader className="pb-2">
                            <CardTitle>Support</CardTitle>
                            <CardDescription>Outils de gestion du support client en temps réel.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs value={tab} onValueChange={setTab} className="w-full">
                                <TabsList className="mb-6 w-full grid grid-cols-4">
                                    <TabsTrigger value="chat">Chat en ligne</TabsTrigger>
                                    <TabsTrigger value="tickets">Tickets</TabsTrigger>
                                    <TabsTrigger value="faq">FAQ</TabsTrigger>
                                    <TabsTrigger value="kb">Base de connaissances</TabsTrigger>
                                </TabsList>
                                <TabsContent value="chat">
                                    <AdminSupportChat />
                                </TabsContent>
                                <TabsContent value="tickets">
                                    <AdminSupportTickets />
                                </TabsContent>
                                <TabsContent value="faq">
                                    <AdminSupportFaqs />
                                </TabsContent>
                                <TabsContent value="kb">
                                    <AdminSupportKnowledgeBase />
                                </TabsContent>
                            </Tabs>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );
};

export default AdminSupport; 