'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Send, Eye, EyeOff, ChevronDown, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export function NewIdeaForm() {
  const router = useRouter()
  const { user, categories, setCategories, addIdea } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingCategories, setIsLoadingCategories] = useState(true) // Start as true
  const [loadError, setLoadError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    is_anonymous: false,
  })

  // Load categories function - can be called manually for retry
  const loadCategories = useCallback(async (force = false) => {
    // If we already have categories and not forcing, use them
    if (categories.length > 0 && !force) {
      console.log('[NewIdeaForm] Categories already in store:', categories.length)
      setIsLoadingCategories(false)
      setLoadError(null)
      return
    }

    console.log('[NewIdeaForm] Loading categories...')
    setIsLoadingCategories(true)
    setLoadError(null)

    try {
      const supabase = createClient()
      console.log('[NewIdeaForm] Supabase client created, fetching categories...')
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

      console.log('[NewIdeaForm] Supabase response:', { data, error })

      if (error) {
        console.error('[NewIdeaForm] Supabase error:', error)
        setLoadError(`Errore database: ${error.message}`)
        return
      }

      if (!data || data.length === 0) {
        console.warn('[NewIdeaForm] No categories returned from database')
        setLoadError('Nessuna categoria trovata nel database')
        return
      }

      console.log('[NewIdeaForm] Categories loaded successfully:', data.length)
      setCategories(data)
      setLoadError(null)
    } catch (error) {
      console.error('[NewIdeaForm] Exception loading categories:', error)
      setLoadError(error instanceof Error ? error.message : 'Errore sconosciuto')
    } finally {
      setIsLoadingCategories(false)
    }
  }, [categories.length, setCategories])

  // Load categories on mount
  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per inviare un'idea",
        variant: "destructive",
      })
      return
    }

    if (!formData.title.trim() || !formData.description.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci titolo e descrizione",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const { data, error } = await supabase
        .from('ideas')
        .insert({
          author_id: user.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          category_id: formData.category_id || null,
          is_anonymous: formData.is_anonymous,
          status: 'submitted',
        })
        .select(`
          *,
          author:profiles(*),
          category:categories(*)
        `)
        .single()

      if (error) throw error

      addIdea(data)
      
      toast({
        title: "Idea inviata! 🎉",
        description: "La tua idea è stata registrata con successo",
        variant: "success",
      })

      router.push(`/ideas/${data.id}`)
    } catch (error) {
      console.error('Error creating idea:', error)
      toast({
        title: "Errore",
        description: "Non è stato possibile inviare l'idea",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600">
            <Lightbulb className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle>Nuova Idea</CardTitle>
            <CardDescription>
              Condividi la tua idea con il team. Ogni contributo conta!
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-gray-700">
              Titolo <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              placeholder="Un titolo chiaro e conciso..."
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              maxLength={100}
            />
            <p className="text-xs text-gray-500 text-right">
              {formData.title.length}/100
            </p>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium text-gray-700">
              Descrizione <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="description"
              placeholder="Descrivi la tua idea in dettaglio. Cosa proponi? Perché è importante? Come potrebbe essere implementata?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
            <p className="text-xs text-gray-500">
              Più dettagli fornisci, meglio sarà compresa la tua idea.
            </p>
          </div>

          {/* Category - Native Select with Error Handling */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoria
            </label>
            
            {loadError ? (
              // Error state with retry button
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span className="text-sm text-red-600 flex-1">{loadError}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => loadCategories(true)}
                  className="gap-1"
                >
                  <RefreshCw className="h-3 w-3" />
                  Riprova
                </Button>
              </div>
            ) : (
              <div className="relative">
                <select
                  id="category"
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  disabled={isLoadingCategories}
                  className="flex h-10 w-full appearance-none items-center justify-between rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">
                    {isLoadingCategories ? "Caricamento categorie..." : "Seleziona una categoria (opzionale)"}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-50 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Anonymous toggle */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.is_anonymous ? (
                <EyeOff className="h-5 w-5 text-gray-500" />
              ) : (
                <Eye className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Pubblica come anonimo
                </p>
                <p className="text-xs text-gray-500">
                  {formData.is_anonymous 
                    ? "Il tuo nome non sarà visibile agli altri utenti (ma gli admin lo vedranno)" 
                    : "Il tuo nome sarà visibile a tutti"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, is_anonymous: !formData.is_anonymous })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.is_anonymous ? 'bg-indigo-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.is_anonymous ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !user}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Invio in corso...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Invia Idea
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
