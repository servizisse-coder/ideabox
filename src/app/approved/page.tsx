'use client'

import Link from 'next/link'
import { CheckCircle, Calendar, ArrowRight, Sparkles } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAppStore } from '@/store/app-store'
import { formatDate, getStatusColor, getStatusLabel } from '@/lib/utils'

export default function ApprovedIdeasPage() {
  const { ideas } = useAppStore()
  
  const approvedIdeas = ideas.filter(idea => 
    idea.status === 'approved' || idea.status === 'scheduled' || idea.status === 'completed'
  ).sort((a, b) => new Date(b.direction_reviewed_at || b.updated_at).getTime() - new Date(a.direction_reviewed_at || a.updated_at).getTime())

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Idee Approvate</h1>
            <p className="text-gray-600">Le idee che la direzione ha deciso di sviluppare</p>
          </div>
        </div>

        {approvedIdeas.length > 0 ? (
          <div className="space-y-4">
            {approvedIdeas.map((idea) => (
              <Card key={idea.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={getStatusColor(idea.status)}>
                          {getStatusLabel(idea.status)}
                        </Badge>
                        {idea.scheduled_quarter && (
                          <Badge variant="outline" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {idea.scheduled_quarter}
                          </Badge>
                        )}
                      </div>
                      
                      <Link href={`/ideas/${idea.id}`} className="group">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                          {idea.title}
                        </h3>
                      </Link>
                      
                      {idea.ai_summary && (
                        <p className="text-gray-600 mt-2 line-clamp-2">{idea.ai_summary}</p>
                      )}

                      {idea.direction_motivation && (
                        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-100">
                          <p className="text-sm text-green-800">
                            <span className="font-medium">✅ Motivazione:</span> {idea.direction_motivation}
                          </p>
                        </div>
                      )}
                      
                      {idea.direction_reviewed_at && (
                        <p className="text-xs text-gray-500 mt-3">
                          Approvata il {formatDate(idea.direction_reviewed_at)}
                        </p>
                      )}
                    </div>
                    
                    <Link href={`/ideas/${idea.id}`} className="shrink-0">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 hover:bg-green-100 transition-colors group">
                        <ArrowRight className="h-5 w-5 text-gray-600 group-hover:text-green-600" />
                      </div>
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna idea approvata ancora</h3>
              <p className="text-gray-500">
                Le idee approvate dalla direzione appariranno qui.
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
