'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/app-store'
import type { Profile, Category, Vote, Notification, ReviewCycle, Idea } from '@/types/database'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const { 
    user, 
    setUser, 
    setCategories, 
    setIdeas, 
    setUserVotes, 
    setNotifications, 
    setCurrentCycle 
  } = useAppStore()

  useEffect(() => {
    const supabase = createClient()

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser(profile as Profile)
            
            // Load initial data
            await Promise.all([
              loadCategories(supabase),
              loadIdeas(supabase),
              loadUserVotes(supabase, session.user.id),
              loadNotifications(supabase, session.user.id),
              loadCurrentCycle(supabase),
            ])
          }
        } else if (!PUBLIC_ROUTES.includes(pathname)) {
          router.push('/login')
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    // Auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser(profile as Profile)
            await Promise.all([
              loadCategories(supabase),
              loadIdeas(supabase),
              loadUserVotes(supabase, session.user.id),
              loadNotifications(supabase, session.user.id),
              loadCurrentCycle(supabase),
            ])
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          if (!PUBLIC_ROUTES.includes(pathname)) {
            router.push('/login')
          }
        }
      }
    )

    initializeAuth()

    return () => {
      subscription.unsubscribe()
    }
  }, [pathname, router, setUser, setCategories, setIdeas, setUserVotes, setNotifications, setCurrentCycle])

  const loadCategories = async (supabase: ReturnType<typeof createClient>) => {
    const { data } = await supabase.from('categories').select('*').order('name')
    if (data) setCategories(data as Category[])
  }

  const loadIdeas = async (supabase: ReturnType<typeof createClient>) => {
    const { data } = await supabase
      .from('ideas')
      .select(`
        *,
        author:profiles(*),
        category:categories(*)
      `)
      .neq('status', 'draft')
      .order('created_at', { ascending: false })
    
    if (data) setIdeas(data as unknown as Idea[])
  }

  const loadUserVotes = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    const { data } = await supabase
      .from('votes')
      .select('*')
      .eq('user_id', userId)
    
    if (data) setUserVotes(data as Vote[])
  }

  const loadNotifications = async (supabase: ReturnType<typeof createClient>, userId: string) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
    
    if (data) setNotifications(data as Notification[])
  }

  const loadCurrentCycle = async (supabase: ReturnType<typeof createClient>) => {
    const { data } = await supabase
      .from('review_cycles')
      .select('*')
      .order('cycle_number', { ascending: false })
      .limit(1)
      .single()
    
    if (data) setCurrentCycle(data as ReviewCycle)
  }

  // Show loading state
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

  // Redirect if not authenticated
  if (!user && !PUBLIC_ROUTES.includes(pathname)) {
    return null
  }

  return <>{children}</>
}
