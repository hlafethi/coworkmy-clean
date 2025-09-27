import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

export const NotificationCenter: React.FC = () => {
    const { notifications, loading, markAsRead, markAllAsRead } = useNotifications();

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0"
                        >
                            {unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between p-2 border-b">
                    <h4 className="font-medium">Notifications</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8"
                            onClick={() => markAllAsRead()}
                        >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Tout marquer comme lu
                        </Button>
                    )}
                </div>
                <ScrollArea className="h-[300px]">
                    {loading ? (
                        <div className="p-4 text-center">Chargement...</div>
                    ) : notifications.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                            Aucune notification
                        </div>
                    ) : (
                        notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`p-4 cursor-pointer ${!notification.is_read ? 'bg-muted/50' : ''
                                    }`}
                                onClick={() => !notification.is_read && markAsRead(notification.id)}
                            >
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-start justify-between">
                                        <span className="font-medium">{notification.title}</span>
                                        {!notification.is_read && (
                                            <Badge variant="secondary" className="ml-2">
                                                Nouveau
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        {notification.message}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(new Date(notification.created_at), {
                                            addSuffix: true,
                                            locale: fr,
                                        })}
                                    </span>
                                </div>
                            </DropdownMenuItem>
                        ))
                    )}
                </ScrollArea>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}; 