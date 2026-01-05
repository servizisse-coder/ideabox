'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/app-store'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const { 
    setUser, 
    setCategories, 
    setIdeas, 
    setUserVotes, 
    setNotifications, 
    setCurrentCycle 
  } = useAppStore()

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const loadData = async (userId: string) => {
      // Load categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .order('name')
      if (mounted && categories) setCategories(categories)

      // Load ideas
      const { data: ideas } = await supabase
        .from('ideas')
        .select('*, author:profiles(*), category:categories(*)')
        .neq('status', 'draft')
        .order('created_at', { ascending: false })
      if (mounted && ideas) setIdeas(ideas as any)

      // Load user votes
      const { data: votes } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
      if (mounted && votes) setUserVotes(votes)

      // Load notifications
      const { data: notifications } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (mounted && notifications) setNotifications(notifications as any)

      // Load current cycle
      const { data: cycles } = await supabase
        .from('review_cycles')
        .select('*')
        .order('cycle_number', { ascending: false })
        .limit(1)
      if (mounted && cycles && cycles.length > 0) setCurrentCycle(cycles[0])
    }

    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (mounted && profile) {
            setUser(profile)
            await loadData(session.user.id)
          }
        } else if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login')
          return
        }
      } catch (error) {
        console.error('Auth error:', error)
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (mounted && profile) {
            setUser(profile)
            await loadData(session.user.id)
            setIsLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    init()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-gray-500">Caricamento...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
