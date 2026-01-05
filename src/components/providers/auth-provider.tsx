'use client'

import { useEffect, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAppStore } from '@/store/app-store'

const PUBLIC_ROUTES = ['/login', '/register', '/forgot-password']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const initRef = useRef(false)
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
    // Skip if already initialized or on public route
    if (initRef.current) return
    if (PUBLIC_ROUTES.includes(pathname)) return
    
    initRef.current = true

    const supabase = createClient()

    const loadAllData = async (userId: string) => {
      try {
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
        if (cyclesRes.data?.[0]) setCurrentCycle(cyclesRes.data[0])
      } catch (error) {
        console.error('Error loading data:', error)
      }
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

          if (profile) {
            setUser(profile)
            await loadAllData(session.user.id)
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
      }
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event)
        
        if (event === 'SIGNED_IN' && session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profile) {
            setUser(profile)
            await loadAllData(session.user.id)
            router.push('/')
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          router.push('/login')
        }
      }
    )

    init()

    return () => subscription.unsubscribe()
  }, [pathname])

  // Always render children - middleware handles auth redirect
  return <>{children}</>
}
