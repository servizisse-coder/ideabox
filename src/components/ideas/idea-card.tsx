'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  MessageCircle, 
  TrendingUp, 
  Sparkles,
  User,
  Calendar,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StarRating } from '@/components/ideas/star-rating'
import { cn, formatDate, getStatusColor, getStatusLabel, getInitials } from '@/lib/utils'
import type { IdeaWithRelations } from '@/types/database'
import { useAppStore } from '@/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from '@/hooks/use-toast'

interface IdeaCardProps {
  idea: IdeaWithRelations
  showVoting?: boolean
  compact?: boolean
  highlight?: 'quality' | 'priority' | null
}

export function IdeaCard({ idea, showVoting = true, compact = false, highlight = null }: IdeaCardProps) {
  const { user, userVotes, setVote, updateIdea } = useAppStore()
  const [isVoting, setIsVoting] = useState(false)
  
  const userVote = userVotes[idea.id]
  const category = idea.category

  const handleVote = async (type: 'quality' | 'priority', rating: number) => {
    if (!user || isVoting) return
    
    setIsVoting(true)
    const supabase = createClient()

    try {
      if (userVote) {
        // Update existing vote
        const { error } = await supabase
          .from('votes')
          .update({ [`${type}_rating`]: rating, updated_at: new Date().toISOString() })
          .eq('id', userVote.id)

        if (error) throw error

        setVote(idea.id, { ...userVote, [`${type}_rating`]: rating })
      } else {
        // Create new vote
        const { data, error } = await supabase
          .from('votes')
          .insert({
            idea_id: idea.id,
            user_id: user.id,
            [`${type}_rating`]: rating,
          })
          .select()
          .single()

        if (error) throw error
        setVote(idea.id, data)
      }

      // Refetch idea scores
      const { data: updatedIdea } = await supabase
        .from('ideas')
        .select('quality_score, priority_score, quality_votes_count, priority_votes_count')
        .eq('id', idea.id)
        .single()

      if (updatedIdea) {
        updateIdea(idea.id, updatedIdea)
      }

      toast({
        title: "Voto registrato! 🎉",
        description: type === 'quality' ? "Hai votato la qualità dell'idea" : "Hai votato la priorità dell'idea",
        variant: "success",
      })
    } catch (error) {
      console.error('Error voting:', error)
      toast({
        title: "Errore",
        description: "Non è stato possibile registrare il voto",
        variant: "destructive",
      })
    } finally {
      setIsVoting(false)
    }
  }

  return (
    <Card className={cn(
      "group hover:shadow-md transition-all duration-200",
      highlight === 'quality' && "ring-2 ring-yellow-400 bg-yellow-50/30",
      highlight === 'priority' && "ring-2 ring-blue-400 bg-blue-50/30"
    )}>
      <CardContent className={cn("p-4", compact && "p-3")}>
        <div className="flex gap-4">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {category && (
                  <Badge 
                    style={{ backgroundColor: `${category.color}20`, color: category.color }}
                    className="border-0"
                  >
                    {category.name}
                  </Badge>
                )}
                <Badge className={getStatusColor(idea.status)}>
                  {getStatusLabel(idea.status)}
                </Badge>
                {highlight === 'quality' && (
                  <Badge variant="warning" className="gap-1">
                    <Sparkles className="h-3 w-3" />
                    Top Qualità
                  </Badge>
                )}
                {highlight === 'priority' && (
                  <Badge variant="default" className="gap-1 bg-blue-100 text-blue-700">
                    <TrendingUp className="h-3 w-3" />
                    Top Priorità
                  </Badge>
                )}
              </div>
            </div>

            {/* Title */}
            <Link href={`/ideas/${idea.id}`}>
              <h3 className={cn(
                "font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2",
                compact ? "text-sm" : "text-base"
              )}>
                {idea.title}
              </h3>
            </Link>

            {/* AI Summary or Description */}
            {!compact && (
              <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                {idea.ai_summary || idea.description}
              </p>
            )}

            {/* AI Tags */}
            {idea.ai_tags && idea.ai_tags.length > 0 && !compact && (
              <div className="flex flex-wrap gap-1 mt-2">
                {idea.ai_tags.slice(0, 3).map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Meta info */}
            <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
              {/* Author */}
              {idea.is_anonymous ? (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Anonimo
                </span>
              ) : idea.author && (
                <span className="flex items-center gap-1">
                  <Avatar className="h-4 w-4">
                    <AvatarImage src={idea.author.avatar_url || undefined} />
                    <AvatarFallback className="text-[8px]">
                      {getInitials(idea.author.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  {idea.author.full_name}
                </span>
              )}
              
              {/* Date */}
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(idea.created_at)}
              </span>

              {/* Comments */}
              <span className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {idea.comments_count}
              </span>
            </div>
          </div>

          {/* Voting section */}
          {showVoting && (
            <div className="flex flex-col gap-3 items-end shrink-0">
              {/* Quality score */}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Qualità</span>
                  <span className={cn(
                    "text-lg font-bold",
                    idea.quality_score >= 4 ? "text-green-600" :
                    idea.quality_score >= 3 ? "text-yellow-600" :
                    idea.quality_score >= 2 ? "text-orange-600" : "text-gray-400"
                  )}>
                    {idea.quality_score > 0 ? idea.quality_score.toFixed(1) : '-'}
                  </span>
                </div>
                {user && (
                  <StarRating
                    value={userVote?.quality_rating || 0}
                    onChange={(v) => handleVote('quality', v)}
                    size="sm"
                  />
                )}
              </div>

              {/* Priority score */}
              <div className="text-right">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Priorità</span>
                  <span className={cn(
                    "text-lg font-bold",
                    idea.priority_score >= 4 ? "text-blue-600" :
                    idea.priority_score >= 3 ? "text-indigo-600" :
                    idea.priority_score >= 2 ? "text-purple-600" : "text-gray-400"
                  )}>
                    {idea.priority_score > 0 ? idea.priority_score.toFixed(1) : '-'}
                  </span>
                </div>
                {user && (
                  <StarRating
                    value={userVote?.priority_rating || 0}
                    onChange={(v) => handleVote('priority', v)}
                    size="sm"
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {/* Link to detail */}
        <Link 
          href={`/ideas/${idea.id}`}
          className="flex items-center justify-end gap-1 mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Dettagli
          <ChevronRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  )
}
