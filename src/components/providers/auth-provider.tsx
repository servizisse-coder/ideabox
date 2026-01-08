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
  const subscriptionRef = useRef(false)
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
    // Create a single supabase client for this component
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

    const loadUserProfile = async (userId: string, email: string, fullName?: string) => {
      console.log('Loading profile for user:', userId)
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (profileError && profileError.code === 'PGRST116') {
        // Profile doesn't exist, create it
        console.log('Profile not found, creating...')
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            id: userId,
            email: email,
            full_name: fullName || email.split('@')[0] || 'Utente'
          })
          .select()
          .single()

        if (newProfile) {
          console.log('Profile created:', newProfile.id)
          setUser(newProfile)
          await loadAllData(userId)
          return true
        } else {
          console.error('Error creating profile:', createError)
          return false
        }
      }

      if (profile) {
        console.log('Profile loaded:', profile.id)
        setUser(profile)
        await loadAllData(userId)
        return true
      }

      return false
    }

    // ALWAYS set up auth state change listener (even on public routes)
    // This ensures we catch SIGNED_IN events from the login page
    if (!subscriptionRef.current) {
      subscriptionRef.current = true
      
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth event:', event, 'User ID:', session?.user?.id)

          if (event === 'SIGNED_IN' && session?.user) {
            const success = await loadUserProfile(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.full_name
            )
            if (success) {
              // Only redirect if we're on a public route
              if (PUBLIC_ROUTES.includes(pathname)) {
                router.push('/')
              }
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setIdeas([])
            setUserVotes([])
            setNotifications([])
            router.push('/login')
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Re-validate user on token refresh
            console.log('Token refreshed, re-loading profile')
            await loadUserProfile(
              session.user.id,
              session.user.email!,
              session.user.user_metadata?.full_name
            )
          }
        }
      )

      // Clean up subscription on unmount
      return () => {
        subscription.unsubscribe()
        subscriptionRef.current = false
      }
    }
  }, []) // Empty deps - subscription should only be set up once

  // Separate effect for initial session check (only on protected routes)
  useEffect(() => {
    if (initRef.current) return
    if (PUBLIC_ROUTES.includes(pathname)) return
    
    initRef.current = true

    const supabase = createClient()

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

          console.log('Init: Profile fetch result:', { profile: profile?.id, error: profileError?.code })

          if (profileError && profileError.code === 'PGRST116') {
            // Profile doesn't exist, create it
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
              console.log('Init: Profile created:', newProfile.id)
              setUser(newProfile)
              
              // Load all data
              const [categoriesRes, ideasRes, votesRes, notificationsRes, cyclesRes] = await Promise.all([
                supabase.from('categories').select('*').order('name'),
                supabase.from('ideas').select('*, author:profiles(*), category:categories(*)').neq('status', 'draft').order('created_at', { ascending: false }),
                supabase.from('votes').select('*').eq('user_id', session.user.id),
                supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
                supabase.from('review_cycles').select('*').order('cycle_number', { ascending: false }).limit(1)
              ])

              if (categoriesRes.data) setCategories(categoriesRes.data)
              if (ideasRes.data) setIdeas(ideasRes.data as any)
              if (votesRes.data) setUserVotes(votesRes.data)
              if (notificationsRes.data) setNotifications(notificationsRes.data as any)
              if (cyclesRes.data?.[0]) setCurrentCycle(cyclesRes.data[0])
              return
            } else {
              console.error('Init: Error creating profile:', createError)
            }
          }

          if (profile) {
            console.log('Init: Setting user in store:', profile.id)
            setUser(profile)
            
            // Load all data
            const [categoriesRes, ideasRes, votesRes, notificationsRes, cyclesRes] = await Promise.all([
              supabase.from('categories').select('*').order('name'),
              supabase.from('ideas').select('*, author:profiles(*), category:categories(*)').neq('status', 'draft').order('created_at', { ascending: false }),
              supabase.from('votes').select('*').eq('user_id', session.user.id),
              supabase.from('notifications').select('*').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(50),
              supabase.from('review_cycles').select('*').order('cycle_number', { ascending: false }).limit(1)
            ])

            if (categoriesRes.data) setCategories(categoriesRes.data)
            if (ideasRes.data) setIdeas(ideasRes.data as any)
            if (votesRes.data) setUserVotes(votesRes.data)
            if (notificationsRes.data) setNotifications(notificationsRes.data as any)
            if (cyclesRes.data?.[0]) setCurrentCycle(cyclesRes.data[0])
          }
        }
      } catch (error) {
        console.error('Auth init error:', error)
      }
    }

    init()
  }, [pathname])

  // Always render children - middleware handles auth redirect
  return <>{children}</>
}
