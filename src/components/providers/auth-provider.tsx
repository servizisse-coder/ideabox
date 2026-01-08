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
        console.log('AuthProvider init starting...')
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session?.user?.id ? 'exists' : 'none')

        if (session?.user) {
          console.log('Init: Fetching profile for user:', session.user.id)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('Init: Profile fetch result:', { profile, profileError })

          if (profileError && profileError.code === 'PGRST116') {
            // Profilo non esiste, crealo
            console.log('Init: Profile not found, creating...')
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utente'
              })
              .select()
              .single()

            if (newProfile) {
              console.log('Init: Profile created, setting user:', newProfile)
              setUser(newProfile)
              await loadAllData(session.user.id)
              return
            } else {
              console.error('Init: Error creating profile:', createError)
            }
          }

          if (profile) {
            console.log('Init: Setting user in store:', profile)
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
        console.log('Auth event:', event, 'User ID:', session?.user?.id)

        if (event === 'SIGNED_IN' && session?.user) {
          console.log('Fetching profile for user:', session.user.id)
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('Profile fetch result:', { profile, profileError })

          if (profileError) {
            console.error('Error fetching profile:', profileError)
            // Se il profilo non esiste, crealo
            if (profileError.code === 'PGRST116') {
              console.log('Profile not found, creating one...')
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Utente'
                })
                .select()
                .single()

              if (newProfile) {
                console.log('Profile created:', newProfile)
                setUser(newProfile)
                await loadAllData(session.user.id)
                router.push('/')
                return
              } else {
                console.error('Error creating profile:', createError)
              }
            }
          }

          if (profile) {
            console.log('Setting user in store:', profile)
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
