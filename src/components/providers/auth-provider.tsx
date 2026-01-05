'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/app-store'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(true)
  const [isPublicRoute, setIsPublicRoute] = useState(false)
  const { 
    setUser, 
    setCategories, 
    setIdeas, 
    setUserVotes, 
    setNotifications, 
    setCurrentCycle 
  } = useAppStore()

  // Check if current route is public
  useEffect(() => {
    setIsPublicRoute(PUBLIC_ROUTES.includes(pathname))
  }, [pathname])

  const loadAppData = useCallback(async (supabase: ReturnType<typeof createClient>, userId: string) => {
    try {
      // Load all data in parallel
      const [categoriesRes, ideasRes, votesRes, notificationsRes, cyclesRes] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('ideas').select('*, author:profiles(*), category:categories(*)').neq('status', 'draft').order('created_at', { ascending: false }),
        supabase.from('votes').select('*').eq('user_id', userId),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(50),
        supabase.from('review_cycles').select('*').order('cycle_number', { ascending: false }).limit(1)
      ])

      if (categoriesRes.data) setCategories(categoriesRes.data)
      if (ideasRes.data) setIdeas(ideasRes.data as any)
      if (votesRes.data) setUserVotes(votesRes.data)
      if (notificationsRes.data) setNotifications(notificationsRes.data as any)
      if (cyclesRes.data && cyclesRes.data.length > 0) setCurrentCycle(cyclesRes.data[0])
    } catch (error) {
      console.error('Error loading app data:', error)
    }
  }, [setCategories, setIdeas, setUserVotes, setNotifications, setCurrentCycle])

  useEffect(() => {
    const supabase = createClient()
    let mounted = true

    const init = async () => {
      // If public route, don't block rendering
      if (PUBLIC_ROUTES.includes(pathname)) {
        setIsLoading(false)
        return
      }

      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.error('Session error:', sessionError)
          if (mounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }

        if (!session?.user) {
          if (mounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profileError || !profile) {
          console.error('Profile error:', profileError)
          if (mounted) {
            setIsLoading(false)
            router.push('/login')
          }
          return
        }

        if (mounted) {
          setUser(profile)
          await loadAppData(supabase, session.user.id)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        if (mounted) {
          setIsLoading(false)
          router.push('/login')
        }
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser(profile)
            await loadAppData(supabase, session.user.id)
          }
          setIsLoading(false)
          router.push('/')
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setIsLoading(false)
          router.push('/login')
        }
      }
    )

    init()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [pathname, router, setUser, loadAppData])

  // Show loading only for protected routes
  if (isLoading && !isPublicRoute) {
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
