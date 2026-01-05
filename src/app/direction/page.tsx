'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, CheckCircle, XCircle, Clock, Eye, Star, TrendingUp, Send } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import { cn, formatDate } from '@/lib/utils'
import type { Idea } from '@/types/database'

export default function DirectionPage() {
  const { user, ideas, updateIdea, currentCycle } = useAppStore()
  const [selectedIdea, setSelectedIdea] = useState<Idea | null>(null)
  const [isDeciding, setIsDeciding] = useState(false)
  const [decision, setDecision] = useState<{
    verdict: 'approved' | 'rejected'
    motivation: string
    scheduled_quarter: string
  }>({ verdict: 'approved', motivation: '', scheduled_quarter: '' })

  // Only direction members can access
  if (!user?.is_direction) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="mx-auto max-w-4xl px-4 py-8">
          <Card>
            <CardContent className="py-12 text-center">
              <Shield className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accesso Riservato</h3>
              <p className="text-gray-500">Solo i membri della direzione possono accedere a questa pagina.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  // Get top ideas for review (sorted by combined score)
  const pendingIdeas = ideas
    .filter(idea => ['submitted', 'organized', 'under_review'].includes(idea.status))
    .sort((a, b) => (b.priority_score + b.quality_score) - (a.priority_score + a.quality_score))
    .slice(0, 10)

  const handleDecision = async () => {
    if (!selectedIdea || !decision.motivation.trim()) {
      toast({ title: "Inserisci una motivazione", variant: "destructive" })
      return
    }
    setIsDeciding(true)
    const supabase = createClient()

    try {
      const updates = {
        status: decision.verdict as 'approved' | 'rejected',
        direction_verdict: decision.verdict,
        direction_motivation: decision.motivation,
        direction_reviewed_by: user.id,
        direction_reviewed_at: new Date().toISOString(),
        scheduled_quarter: decision.verdict === 'approved' ? decision.scheduled_quarter : null,
        review_cycle: currentCycle?.cycle_number || null,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('ideas') as any).update(updates).eq('id', selectedIdea.id)
      if (error) throw error

      // Create notification for the author
      if (selectedIdea.author_id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('notifications') as any).insert({
          user_id: selectedIdea.author_id,
          type: decision.verdict === 'approved' ? 'idea_approved' : 'idea_rejected',
          title: decision.verdict === 'approved' 
            ? '🎉 La tua idea è stata approvata!' 
            : '📋 Aggiornamento sulla tua idea',
          message: decision.verdict === 'approved'
            ? `"${selectedIdea.title}" è stata approvata dalla direzione!`
            : `"${selectedIdea.title}" non è stata approvata questa volta. Leggi la motivazione.`,
          idea_id: selectedIdea.id,
        })
      }

      updateIdea(selectedIdea.id, updates)
      toast({ 
        title: decision.verdict === 'approved' ? "Idea Approvata! ✅" : "Decisione Registrata", 
        variant: "success" 
      })
      setSelectedIdea(null)
      setDecision({ verdict: 'approved', motivation: '', scheduled_quarter: '' })
    } catch (error) {
      toast({ title: "Errore", variant: "destructive" })
    } finally {
      setIsDeciding(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
            <Shield className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pannello Direzione</h1>
            <p className="text-gray-600">Valuta e approva le idee più votate dal team</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{pendingIdeas.length}</p>
                <p className="text-sm text-gray-500">Da valutare</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{ideas.filter(i => i.status === 'approved').length}</p>
                <p className="text-sm text-gray-500">Approvate</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <XCircle className="h-8 w-8 text-gray-400" />
              <div>
                <p className="text-2xl font-bold">{ideas.filter(i => i.status === 'rejected').length}</p>
                <p className="text-sm text-gray-500">Non Approvate</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Ideas Table */}
        <Card>
          <CardHeader>
            <CardTitle>🏆 Top 10 Idee da Valutare</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-y bg-gray-50">
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">#</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase">Idea</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Qualità</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Priorità</th>
                    <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase">Totale</th>
                    <th className="py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pendingIdeas.map((idea, index) => (
                    <tr key={idea.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <span className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          index < 3 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"
                        )}>{index + 1}</span>
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <p className="font-medium text-gray-900 line-clamp-1">{idea.title}</p>
                        <p className="text-xs text-gray-500">{formatDate(idea.created_at)}</p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 font-bold text-yellow-600">
                          <Star className="h-4 w-4" />{idea.quality_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="flex items-center justify-center gap-1 font-bold text-blue-600">
                          <TrendingUp className="h-4 w-4" />{idea.priority_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="font-bold text-purple-600">
                          {(idea.quality_score + idea.priority_score).toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
                          <Link href={`/ideas/${idea.id}`}>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </Link>
                          <Button size="sm" onClick={() => setSelectedIdea(idea)}>Valuta</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pendingIdeas.length === 0 && (
              <div className="text-center py-12">
                <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-4" />
                <p className="text-gray-500">Nessuna idea da valutare al momento!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Decision Dialog */}
        <Dialog open={!!selectedIdea} onOpenChange={() => setSelectedIdea(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Valuta Idea</DialogTitle>
              <DialogDescription>{selectedIdea?.title}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="flex gap-2">
                <Button
                  variant={decision.verdict === 'approved' ? 'default' : 'outline'}
                  className={decision.verdict === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                  onClick={() => setDecision({ ...decision, verdict: 'approved' })}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />Approva
                </Button>
                <Button
                  variant={decision.verdict === 'rejected' ? 'destructive' : 'outline'}
                  onClick={() => setDecision({ ...decision, verdict: 'rejected' })}
                >
                  <XCircle className="h-4 w-4 mr-2" />Non Approva
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium">Motivazione *</label>
                <Textarea
                  placeholder="Spiega la decisione..."
                  value={decision.motivation}
                  onChange={(e) => setDecision({ ...decision, motivation: e.target.value })}
                  rows={4}
                />
              </div>
              {decision.verdict === 'approved' && (
                <div>
                  <label className="text-sm font-medium">Programmazione (opzionale)</label>
                  <Input
                    placeholder="es. Q1 2025, Febbraio, Sprint 12..."
                    value={decision.scheduled_quarter}
                    onChange={(e) => setDecision({ ...decision, scheduled_quarter: e.target.value })}
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedIdea(null)}>Annulla</Button>
              <Button onClick={handleDecision} disabled={isDeciding}>
                {isDeciding ? 'Salvataggio...' : 'Conferma'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
