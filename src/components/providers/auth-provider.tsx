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
    setUser, 
    setCategories, 
    setIdeas, 
    setUserVotes, 
    setNotifications, 
    setCurrentCycle 
  } = useAppStore()

  useEffect(() => {
    if (initRef.current) return
    initRef.current = true

    const supabase = createClient()

    const loadData = async (userId: string) => {
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
    }

    const init = async () => {
      if (PUBLIC_ROUTES.includes(pathname)) return

      const { data: { session } } = await supabase.auth.getSession()
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (profile) {
          setUser(profile)
          await loadData(session.user.id)
        }
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

          if (profile) {
            setUser(profile)
            await loadData(session.user.id)
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
  }, [])

  // Always render children - middleware handles auth
  return <>{children}</>
}
