'use client'

import Link from 'next/link'
import { User, Plus, Clock, CheckCircle, XCircle, Eye, Star, TrendingUp, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { formatDate, getStatusColor, getStatusLabel, cn } from '@/lib/utils'

export default function MyIdeasPage() {
  const { user, ideas } = useAppStore()
  
  const myIdeas = ideas
    .filter(idea => idea.author_id === user?.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const stats = {
    total: myIdeas.length,
    approved: myIdeas.filter(i => i.status === 'approved' || i.status === 'scheduled' || i.status === 'completed').length,
    pending: myIdeas.filter(i => ['submitted', 'organized', 'under_review'].includes(i.status)).length,
    rejected: myIdeas.filter(i => i.status === 'rejected').length,
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Le Mie Idee</h1>
              <p className="text-gray-600">Tutte le idee che hai proposto</p>
            </div>
          </div>
          <Link href="/ideas/new">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuova Idea
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">Totali</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
              <p className="text-sm text-gray-500">In Attesa</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
              <p className="text-sm text-gray-500">Approvate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-3xl font-bold text-gray-400">{stats.rejected}</p>
              <p className="text-sm text-gray-500">Non Approvate</p>
            </CardContent>
          </Card>
        </div>

        {myIdeas.length > 0 ? (
          <div className="space-y-4">
            {myIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={getStatusColor(idea.status)}>
                          {getStatusLabel(idea.status)}
                        </Badge>
                        {idea.is_anonymous && (
                          <Badge variant="outline" className="text-xs">Anonima</Badge>
                        )}
                      </div>
                      
                      <Link href={`/ideas/${idea.id}`} className="group">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {idea.title}
                        </h3>
                      </Link>
                      
                      {idea.ai_summary && (
                        <p className="text-gray-600 mt-2 line-clamp-2">{idea.ai_summary}</p>
                      )}

                      <div className="flex items-center gap-6 mt-4 text-sm">
                        <span className="text-gray-500">{formatDate(idea.created_at)}</span>
                        <span className="flex items-center gap-1 text-yellow-600">
                          <Star className="h-4 w-4" />
                          {idea.quality_score > 0 ? idea.quality_score.toFixed(1) : '-'}
                        </span>
                        <span className="flex items-center gap-1 text-blue-600">
                          <TrendingUp className="h-4 w-4" />
                          {idea.priority_score > 0 ? idea.priority_score.toFixed(1) : '-'}
                        </span>
                      </div>

                      {idea.direction_motivation && (
                        <div className={cn(
                          "mt-4 p-3 rounded-lg border text-sm",
                          idea.status === 'approved' ? "bg-green-50 border-green-200 text-green-800" : "bg-gray-50 border-gray-200 text-gray-700"
                        )}>
                          <span className="font-medium">
                            {idea.status === 'approved' ? '✅ ' : '📝 '}
                            Risposta direzione:
                          </span> {idea.direction_motivation}
                        </div>
                      )}
                    </div>
                    
                    <Link href={`/ideas/${idea.id}`} className="shrink-0">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Sparkles className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Non hai ancora proposto idee</h3>
              <p className="text-gray-500 mb-4">È il momento di condividere le tue idee con il team!</p>
              <Link href="/ideas/new">
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  Proponi la tua prima idea
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
