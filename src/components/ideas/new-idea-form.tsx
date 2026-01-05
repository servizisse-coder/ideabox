'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lightbulb, Send, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

export function NewIdeaForm() {
  const router = useRouter()
  const { user, categories, addIdea } = useAppStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category_id: '',
    is_anonymous: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

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

          {/* Category */}
          <div className="space-y-2">
            <label htmlFor="category" className="text-sm font-medium text-gray-700">
              Categoria
            </label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData({ ...formData, category_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleziona una categoria (opzionale)" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: category.color }}
                      />
                      {category.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              disabled={isSubmitting}
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
