'use client'

import Link from 'next/link'
import { Bell, CheckCircle, XCircle, MessageCircle, Lightbulb, Check, Trash2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { formatDateTime, cn } from '@/lib/utils'

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useAppStore()

  const handleMarkAsRead = async (id: string) => {
    const supabase = createClient()
    await supabase.from('notifications').update({ is_read: true }).eq('id', id)
    markAsRead(id)
  }

  const handleMarkAllAsRead = async () => {
    const supabase = createClient()
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
    if (unreadIds.length > 0) {
      await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      markAllAsRead()
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'idea_approved': return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'idea_rejected': return <XCircle className="h-5 w-5 text-gray-500" />
      case 'new_comment': return <MessageCircle className="h-5 w-5 text-blue-500" />
      case 'new_vote': return <Lightbulb className="h-5 w-5 text-yellow-500" />
      default: return <Bell className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <Bell className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifiche</h1>
              <p className="text-gray-600">
                {unreadCount > 0 ? `${unreadCount} non lette` : 'Tutto letto!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" onClick={handleMarkAllAsRead} className="gap-2">
              <Check className="h-4 w-4" />
              Segna tutte come lette
            </Button>
          )}
        </div>

        {notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card 
                key={notification.id} 
                className={cn(
                  "transition-colors",
                  !notification.is_read && "bg-indigo-50 border-indigo-200"
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "font-medium",
                        !notification.is_read && "text-gray-900"
                      )}>
                        {notification.title}
                      </p>
                      {notification.message && (
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-2">
                        {formatDateTime(notification.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {notification.idea_id && (
                        <Link href={`/ideas/${notification.idea_id}`}>
                          <Button variant="ghost" size="sm">Vedi</Button>
                        </Link>
                      )}
                      {!notification.is_read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna notifica</h3>
              <p className="text-gray-500">
                Le notifiche sulle tue idee e commenti appariranno qui.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
