'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react'
import { Header } from '@/components/layout/header'
import { TopIdeasTable } from '@/components/ideas/top-ideas-table'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAppStore } from '@/store/app-store'
import { formatDate } from '@/lib/utils'

export default function HomePage() {
  const { user, ideas, currentCycle } = useAppStore()

  // Filter ideas for the table (only submitted/organized ones)
  const tableIdeas = ideas.filter(idea => 
    ['submitted', 'organized', 'under_review'].includes(idea.status)
  )

  // Find top ideas
  const topQuality = tableIdeas.length > 0 
    ? tableIdeas.reduce((best, idea) => 
        idea.quality_score > best.quality_score ? idea : best
      , tableIdeas[0])
    : null

  const topPriority = tableIdeas.length > 0
    ? tableIdeas.reduce((best, idea) => 
        idea.priority_score > best.priority_score ? idea : best
      , tableIdeas[0])
    : null

  // Stats
  const totalIdeas = ideas.length
  const approvedIdeas = ideas.filter(i => i.status === 'approved').length
  const pendingIdeas = ideas.filter(i => ['submitted', 'organized', 'under_review'].includes(i.status)).length

  // Days until next review
  const daysUntilReview = currentCycle 
    ? Math.ceil((new Date(currentCycle.review_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Ciao, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-600 mt-1">
            Hai un&apos;idea? Questo è il posto giusto per condividerla!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                  <Lightbulb className="h-5 w-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{totalIdeas}</p>
                  <p className="text-xs text-gray-500">Idee Totali</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{pendingIdeas}</p>
                  <p className="text-xs text-gray-500">In Attesa</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{approvedIdeas}</p>
                  <p className="text-xs text-gray-500">Approvate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={daysUntilReview !== null && daysUntilReview <= 3 ? 'border-orange-300 bg-orange-50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                  daysUntilReview !== null && daysUntilReview <= 3 
                    ? 'bg-orange-200' 
                    : 'bg-purple-100'
                }`}>
                  <Calendar className={`h-5 w-5 ${
                    daysUntilReview !== null && daysUntilReview <= 3 
                      ? 'text-orange-600' 
                      : 'text-purple-600'
                  }`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {daysUntilReview !== null ? (daysUntilReview > 0 ? daysUntilReview : 'Oggi!') : '-'}
                  </p>
                  <p className="text-xs text-gray-500">Giorni alla Revisione</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Hai un&apos;idea brillante? 💡</h2>
              <p className="text-indigo-100 mt-1">
                Non aspettare! Le migliori idee nascono dalla condivisione.
              </p>
            </div>
            <Link href="/ideas/new">
              <Button size="lg" variant="secondary" className="gap-2">
                <Plus className="h-5 w-5" />
                Proponi un&apos;Idea
              </Button>
            </Link>
          </div>
        </div>

        {/* Main Table */}
        <TopIdeasTable 
          ideas={tableIdeas} 
          topQuality={(topQuality?.quality_score ?? 0) > 0 ? topQuality : null}
          topPriority={(topPriority?.priority_score ?? 0) > 0 ? topPriority : null}
        />

        {/* Quick Links */}
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <Link href="/approved">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Idee Approvate</p>
                      <p className="text-sm text-gray-500">Vedi cosa è stato approvato</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/rejected">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                      <Clock className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Idee Non Approvate</p>
                      <p className="text-sm text-gray-500">Scopri perché</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/my-ideas">
            <Card className="hover:shadow-md transition-shadow cursor-pointer group">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
                      <Users className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Le Mie Idee</p>
                      <p className="text-sm text-gray-500">Gestisci le tue proposte</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  )
}
