import { create } from 'zustand'
import type { Profile, Idea, Category, Notification, Vote, ReviewCycle } from '@/types/database'

interface AppState {
  // User
  user: Profile | null
  setUser: (user: Profile | null) => void
  
  // Ideas
  ideas: Idea[]
  setIdeas: (ideas: Idea[]) => void
  addIdea: (idea: Idea) => void
  updateIdea: (id: string, updates: Partial<Idea>) => void
  
  // Categories
  categories: Category[]
  setCategories: (categories: Category[]) => void
  
  // Notifications
  notifications: Notification[]
  unreadCount: number
  setNotifications: (notifications: Notification[]) => void
  addNotification: (notification: Notification) => void
  markAsRead: (id: string) => void
  markAllAsRead: () => void
  
  // User votes (per tracciare i voti dell'utente corrente)
  userVotes: Record<string, Vote>
  setUserVotes: (votes: Vote[]) => void
  setVote: (ideaId: string, vote: Vote) => void
  
  // Review cycle
  currentCycle: ReviewCycle | null
  setCurrentCycle: (cycle: ReviewCycle | null) => void
  
  // UI state
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
  
  // Filters
  filters: {
    status: string | null
    category: string | null
    sortBy: 'priority' | 'quality' | 'recent'
  }
  setFilters: (filters: Partial<AppState['filters']>) => void
}

export const useAppStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),
  
  // Ideas
  ideas: [],
  setIdeas: (ideas) => set({ ideas }),
  addIdea: (idea) => set((state) => ({ ideas: [idea, ...state.ideas] })),
  updateIdea: (id, updates) => set((state) => ({
    ideas: state.ideas.map((idea) =>
      idea.id === id ? { ...idea, ...updates } : idea
    ),
  })),
  
  // Categories
  categories: [],
  setCategories: (categories) => set({ categories }),
  
  // Notifications
  notifications: [],
  unreadCount: 0,
  setNotifications: (notifications) => set({ 
    notifications,
    unreadCount: notifications.filter(n => !n.is_read).length
  }),
  addNotification: (notification) => set((state) => ({ 
    notifications: [notification, ...state.notifications],
    unreadCount: state.unreadCount + (notification.is_read ? 0 : 1)
  })),
  markAsRead: (id) => set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, is_read: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1)
  })),
  markAllAsRead: () => set((state) => ({
    notifications: state.notifications.map((n) => ({ ...n, is_read: true })),
    unreadCount: 0
  })),
  
  // User votes
  userVotes: {},
  setUserVotes: (votes) => set({
    userVotes: votes.reduce((acc, vote) => ({ ...acc, [vote.idea_id]: vote }), {})
  }),
  setVote: (ideaId, vote) => set((state) => ({
    userVotes: { ...state.userVotes, [ideaId]: vote }
  })),
  
  // Review cycle
  currentCycle: null,
  setCurrentCycle: (cycle) => set({ currentCycle: cycle }),
  
  // UI state
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  
  // Filters
  filters: {
    status: null,
    category: null,
    sortBy: 'priority',
  },
  setFilters: (filters) => set((state) => ({ 
    filters: { ...state.filters, ...filters } 
  })),
}))
