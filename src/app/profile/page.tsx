'use client'

import { useState } from 'react'
import { User, Mail, Building, Shield, Save, Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { getInitials } from '@/lib/utils'

export default function ProfilePage() {
  const { user, setUser } = useAppStore()
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    department: user?.department || '',
  })

  const handleSave = async () => {
    if (!user) return

    setIsSaving(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name.trim(),
          department: formData.department.trim() || null,
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error

      setUser(data)
      setIsEditing(false)
      toast({
        title: 'Profilo aggiornato',
        description: 'Le modifiche sono state salvate',
        variant: 'success',
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: 'Errore',
        description: 'Impossibile salvare le modifiche',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Caricamento profilo...</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-xl bg-indigo-100 text-indigo-700">
                  {getInitials(user.full_name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <CardTitle className="text-2xl">{user.full_name}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <Mail className="h-4 w-4" />
                  {user.email}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  {user.is_admin && (
                    <Badge className="bg-purple-100 text-purple-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                  {user.is_direction && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <Shield className="h-3 w-3 mr-1" />
                      Direzione
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Nome */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <User className="h-4 w-4" />
                Nome Completo
              </label>
              {isEditing ? (
                <Input
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Il tuo nome"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.full_name}</p>
              )}
            </div>

            {/* Dipartimento */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Dipartimento
              </label>
              {isEditing ? (
                <Input
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Es: Marketing, IT, HR..."
                />
              ) : (
                <p className="text-gray-900 py-2">
                  {user.department || <span className="text-gray-400 italic">Non specificato</span>}
                </p>
              )}
            </div>

            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </label>
              <p className="text-gray-500 py-2">{user.email}</p>
              <p className="text-xs text-gray-400">L'email non può essere modificata</p>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsEditing(false)
                      setFormData({
                        full_name: user.full_name,
                        department: user.department || '',
                      })
                    }}
                  >
                    Annulla
                  </Button>
                  <Button onClick={handleSave} disabled={isSaving} className="gap-2">
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Salva
                  </Button>
                </>
              ) : (
                <Button onClick={() => setIsEditing(true)}>
                  Modifica Profilo
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
