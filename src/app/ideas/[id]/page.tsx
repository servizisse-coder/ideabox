'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, User, Star, TrendingUp, Send, EyeOff, CheckCircle, XCircle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/ideas/star-rating'
import { cn, formatDate, formatDateTime, getStatusColor, getStatusLabel, getInitials } from '@/lib/utils'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'
import type { IdeaWithRelations, CommentWithAuthor } from '@/types/database'

export default function IdeaDetailPage() {
  const params = useParams()
  const router = useRouter()
  const ideaId = params.id as string
  const { user, userVotes, setVote, updateIdea } = useAppStore()
  const [idea, setIdea] = useState<IdeaWithRelations | null>(null)
  const [comments, setComments] = useState<CommentWithAuthor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [isAnonymousComment, setIsAnonymousComment] = useState(false)
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [isVoting, setIsVoting] = useState(false)
  const userVote = userVotes[ideaId]

  useEffect(() => { loadIdea() }, [ideaId])

  const loadIdea = async () => {
    const supabase = createClient()
    const { data: ideaData, error } = await supabase.from('ideas').select(`*, author:profiles(*), category:categories(*)`).eq('id', ideaId).single()
    if (error || !ideaData) { router.push('/'); return }
    const { data: commentsData } = await supabase.from('comments').select(`*, author:profiles(*)`).eq('idea_id', ideaId).order('created_at', { ascending: true })
    setIdea(ideaData as unknown as IdeaWithRelations)
    setComments((commentsData || []) as unknown as CommentWithAuthor[])
    setIsLoading(false)
  }

  const handleVote = async (type: 'quality' | 'priority', rating: number) => {
    if (!user || isVoting) return
    setIsVoting(true)
    const supabase = createClient()
    try {
      if (userVote) {
        await supabase.from('votes').update({ [`${type}_rating`]: rating }).eq('id', userVote.id)
        setVote(ideaId, { ...userVote, [`${type}_rating`]: rating })
      } else {
        const { data } = await supabase.from('votes').insert({ idea_id: ideaId, user_id: user.id, [`${type}_rating`]: rating }).select().single()
        if (data) setVote(ideaId, data)
      }
      const { data: updated } = await supabase.from('ideas').select('quality_score, priority_score, quality_votes_count, priority_votes_count').eq('id', ideaId).single()
      if (updated && idea) { setIdea({ ...idea, ...updated }); updateIdea(ideaId, updated) }
      toast({ title: "Voto registrato! 🎉", variant: "success" })
    } catch { toast({ title: "Errore", variant: "destructive" }) }
    finally { setIsVoting(false) }
  }

  const handleSendComment = async () => {
    if (!user || !newComment.trim() || isSendingComment) return
    setIsSendingComment(true)
    const supabase = createClient()
    try {
      const { data } = await supabase.from('comments').insert({ idea_id: ideaId, author_id: user.id, content: newComment.trim(), is_anonymous: isAnonymousComment }).select(`*, author:profiles(*)`).single()
      if (data) { setComments([...comments, data as unknown as CommentWithAuthor]); setNewComment(''); setIsAnonymousComment(false) }
      if (idea) { setIdea({ ...idea, comments_count: idea.comments_count + 1 }); updateIdea(ideaId, { comments_count: idea.comments_count + 1 }) }
      toast({ title: "Commento inviato! 💬", variant: "success" })
    } catch { toast({ title: "Errore", variant: "destructive" }) }
    finally { setIsSendingComment(false) }
  }

  if (isLoading || !idea) return <div className="min-h-screen bg-gray-50"><Header /><main className="mx-auto max-w-4xl px-4 py-8"><div className="animate-pulse h-64 bg-gray-200 rounded-xl" /></main></div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"><ArrowLeft className="h-4 w-4" />Torna alla Home</Link>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {idea.category && <Badge style={{ backgroundColor: `${idea.category.color}20`, color: idea.category.color }} className="border-0">{idea.category.name}</Badge>}
              <Badge className={getStatusColor(idea.status)}>{getStatusLabel(idea.status)}</Badge>
            </div>
            <CardTitle className="text-2xl">{idea.title}</CardTitle>
            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
              {idea.is_anonymous ? <span className="flex items-center gap-1"><User className="h-4 w-4" />Anonimo</span> : idea.author && (
                <span className="flex items-center gap-2"><Avatar className="h-6 w-6"><AvatarImage src={idea.author.avatar_url || undefined} /><AvatarFallback className="text-xs">{getInitials(idea.author.full_name)}</AvatarFallback></Avatar>{idea.author.full_name}</span>
              )}
              <span className="flex items-center gap-1"><Calendar className="h-4 w-4" />{formatDate(idea.created_at)}</span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-gray max-w-none mb-6"><p className="whitespace-pre-wrap">{idea.description}</p></div>
            {idea.ai_summary && <div className="p-4 bg-indigo-50 rounded-lg mb-6"><h4 className="font-medium text-indigo-900 mb-2">✨ Sintesi AI</h4><p className="text-indigo-800 text-sm">{idea.ai_summary}</p></div>}
            {idea.ai_tags && idea.ai_tags.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{idea.ai_tags.map((tag) => <span key={tag} className="text-sm px-3 py-1 rounded-full bg-gray-100 text-gray-700">#{tag}</span>)}</div>}
            
            {/* Voting */}
            <div className="grid sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2"><Star className="h-5 w-5 text-yellow-500" /><span className="font-medium">Qualità</span></div>
                <p className={cn("text-3xl font-bold mb-2", idea.quality_score >= 4 ? "text-green-600" : idea.quality_score >= 3 ? "text-yellow-600" : "text-gray-400")}>{idea.quality_score > 0 ? idea.quality_score.toFixed(1) : '-'}</p>
                <p className="text-xs text-gray-500 mb-3">{idea.quality_votes_count} voti</p>
                {user && <div className="flex justify-center"><StarRating value={userVote?.quality_rating || 0} onChange={(v) => handleVote('quality', v)} /></div>}
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="flex items-center justify-center gap-2 mb-2"><TrendingUp className="h-5 w-5 text-blue-500" /><span className="font-medium">Priorità</span></div>
                <p className={cn("text-3xl font-bold mb-2", idea.priority_score >= 4 ? "text-blue-600" : idea.priority_score >= 3 ? "text-indigo-600" : "text-gray-400")}>{idea.priority_score > 0 ? idea.priority_score.toFixed(1) : '-'}</p>
                <p className="text-xs text-gray-500 mb-3">{idea.priority_votes_count} voti</p>
                {user && <div className="flex justify-center"><StarRating value={userVote?.priority_rating || 0} onChange={(v) => handleVote('priority', v)} /></div>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Direction Decision */}
        {(idea.status === 'approved' || idea.status === 'rejected') && idea.direction_motivation && (
          <Card className={cn("mb-6", idea.status === 'approved' ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50")}>
            <CardHeader><CardTitle className="flex items-center gap-2">{idea.status === 'approved' ? <><CheckCircle className="h-5 w-5 text-green-600" />Approvata dalla Direzione</> : <><XCircle className="h-5 w-5 text-red-600" />Non Approvata</>}</CardTitle></CardHeader>
            <CardContent>
              <p className={cn("mb-4", idea.status === 'approved' ? "text-green-800" : "text-red-800")}>{idea.direction_motivation}</p>
              {idea.scheduled_quarter && <p className="text-sm font-medium text-green-700">📅 Programmata: {idea.scheduled_quarter}</p>}
              {idea.direction_reviewed_at && <p className="text-xs text-gray-500 mt-2">Decisione del {formatDateTime(idea.direction_reviewed_at)}</p>}
            </CardContent>
          </Card>
        )}

        {/* Comments */}
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2">💬 Commenti ({comments.length})</CardTitle></CardHeader>
          <CardContent>
            {comments.length > 0 ? (
              <div className="space-y-4 mb-6">{comments.map((comment) => (
                <div key={comment.id} className={cn("p-4 rounded-lg", comment.is_direction_reply ? "bg-purple-50 border border-purple-200" : "bg-gray-50")}>
                  <div className="flex items-center gap-2 mb-2">
                    {comment.is_anonymous ? <span className="flex items-center gap-1 text-sm text-gray-500"><EyeOff className="h-3 w-3" />Anonimo</span> : comment.author && (
                      <span className="flex items-center gap-2 text-sm"><Avatar className="h-5 w-5"><AvatarFallback className="text-[10px]">{getInitials(comment.author.full_name)}</AvatarFallback></Avatar><span className="font-medium">{comment.author.full_name}</span></span>
                    )}
                    <span className="text-xs text-gray-400">{formatDateTime(comment.created_at)}</span>
                    {comment.is_direction_reply && <Badge variant="default" className="text-xs bg-purple-600">Direzione</Badge>}
                  </div>
                  <p className="text-gray-700">{comment.content}</p>
                </div>
              ))}</div>
            ) : <p className="text-gray-500 text-center py-4 mb-6">Nessun commento ancora. Sii il primo!</p>}
            
            {user && (
              <div className="space-y-3 border-t pt-4">
                <Textarea placeholder="Scrivi un commento..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={3} />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                    <input type="checkbox" checked={isAnonymousComment} onChange={(e) => setIsAnonymousComment(e.target.checked)} className="rounded border-gray-300" />
                    <EyeOff className="h-4 w-4" />Commenta in anonimo
                  </label>
                  <Button onClick={handleSendComment} disabled={!newComment.trim() || isSendingComment} className="gap-2"><Send className="h-4 w-4" />{isSendingComment ? 'Invio...' : 'Invia'}</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
