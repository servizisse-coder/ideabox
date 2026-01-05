'use client'

import { useState } from 'react'
import Link from 'next/link'
import { 
  Trophy, 
  TrendingUp, 
  Sparkles, 
  Eye,
  Star,
  MessageCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn, getStatusColor, getStatusLabel } from '@/lib/utils'
import type { IdeaWithRelations } from '@/types/database'

interface TopIdeasTableProps {
  ideas: IdeaWithRelations[]
  topQuality: IdeaWithRelations | null
  topPriority: IdeaWithRelations | null
}

export function TopIdeasTable({ ideas, topQuality, topPriority }: TopIdeasTableProps) {
  const [sortBy, setSortBy] = useState<'priority' | 'quality' | 'recent'>('priority')

  const sortedIdeas = [...ideas].sort((a, b) => {
    if (sortBy === 'priority') return b.priority_score - a.priority_score
    if (sortBy === 'quality') return b.quality_score - a.quality_score
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div className="space-y-6">
      {/* Top Ideas Highlight */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Quality */}
        {topQuality && (
          <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-400">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm font-medium text-yellow-800">
                  🏆 Top Qualità
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/ideas/${topQuality.id}`} className="group">
                <h3 className="font-semibold text-gray-900 group-hover:text-yellow-700 transition-colors line-clamp-2">
                  {topQuality.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {topQuality.ai_summary || topQuality.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-yellow-700 font-bold">
                    <Star className="h-4 w-4 fill-yellow-400" />
                    {topQuality.quality_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {topQuality.quality_votes_count} voti
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Top Priority */}
        {topPriority && (
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500">
                  <TrendingUp className="h-4 w-4 text-white" />
                </div>
                <CardTitle className="text-sm font-medium text-blue-800">
                  🚀 Top Priorità
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Link href={`/ideas/${topPriority.id}`} className="group">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                  {topPriority.title}
                </h3>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {topPriority.ai_summary || topPriority.description}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <span className="flex items-center gap-1 text-blue-700 font-bold">
                    <TrendingUp className="h-4 w-4" />
                    {topPriority.priority_score.toFixed(1)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {topPriority.priority_votes_count} voti
                  </span>
                </div>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Main Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-indigo-500" />
              Tutte le Idee
            </CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Ordina per:</span>
              <div className="flex rounded-lg border overflow-hidden">
                <button
                  onClick={() => setSortBy('priority')}
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors",
                    sortBy === 'priority' 
                      ? "bg-indigo-100 text-indigo-700 font-medium" 
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Priorità
                </button>
                <button
                  onClick={() => setSortBy('quality')}
                  className={cn(
                    "px-3 py-1.5 text-sm border-x transition-colors",
                    sortBy === 'quality' 
                      ? "bg-yellow-100 text-yellow-700 font-medium" 
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Qualità
                </button>
                <button
                  onClick={() => setSortBy('recent')}
                  className={cn(
                    "px-3 py-1.5 text-sm transition-colors",
                    sortBy === 'recent' 
                      ? "bg-gray-200 text-gray-700 font-medium" 
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  )}
                >
                  Recenti
                </button>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-y bg-gray-50/50">
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    #
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Idea
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                    Categoria
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-3 w-3" />
                      Qualità
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Priorità
                    </div>
                  </th>
                  <th className="text-center py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                    <MessageCircle className="h-3 w-3 mx-auto" />
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                    Stato
                  </th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {sortedIdeas.map((idea, index) => (
                  <tr 
                    key={idea.id} 
                    className={cn(
                      "hover:bg-gray-50 transition-colors",
                      topQuality?.id === idea.id && "bg-yellow-50/50",
                      topPriority?.id === idea.id && "bg-blue-50/50"
                    )}
                  >
                    <td className="py-3 px-4">
                      <span className={cn(
                        "flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        index === 0 && sortBy === 'priority' && "bg-blue-100 text-blue-700",
                        index === 0 && sortBy === 'quality' && "bg-yellow-100 text-yellow-700",
                        index > 0 && "bg-gray-100 text-gray-600"
                      )}>
                        {index + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs">
                      <Link href={`/ideas/${idea.id}`} className="group">
                        <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {idea.title}
                        </p>
                        {idea.ai_tags && idea.ai_tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {idea.ai_tags.slice(0, 2).map((tag) => (
                              <span key={tag} className="text-xs text-gray-400">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {idea.category && (
                        <Badge 
                          style={{ backgroundColor: `${idea.category.color}20`, color: idea.category.color }}
                          className="border-0 text-xs"
                        >
                          {idea.category.name}
                        </Badge>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "font-bold",
                          idea.quality_score >= 4 ? "text-green-600" :
                          idea.quality_score >= 3 ? "text-yellow-600" :
                          idea.quality_score >= 2 ? "text-orange-600" : "text-gray-400"
                        )}>
                          {idea.quality_score > 0 ? idea.quality_score.toFixed(1) : '-'}
                        </span>
                        <span className="text-xs text-gray-400">{idea.quality_votes_count}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={cn(
                          "font-bold",
                          idea.priority_score >= 4 ? "text-blue-600" :
                          idea.priority_score >= 3 ? "text-indigo-600" :
                          idea.priority_score >= 2 ? "text-purple-600" : "text-gray-400"
                        )}>
                          {idea.priority_score > 0 ? idea.priority_score.toFixed(1) : '-'}
                        </span>
                        <span className="text-xs text-gray-400">{idea.priority_votes_count}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center hidden sm:table-cell">
                      <span className="text-gray-600">{idea.comments_count}</span>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      <Badge className={cn("text-xs", getStatusColor(idea.status))}>
                        {getStatusLabel(idea.status)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/ideas/${idea.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {sortedIdeas.length === 0 && (
            <div className="text-center py-12">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nessuna idea ancora. Sii il primo!</p>
              <Link href="/ideas/new">
                <Button className="mt-4">Proponi un&apos;Idea</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
