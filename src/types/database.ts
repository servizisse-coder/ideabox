export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type IdeaStatus = 
  | 'draft'
  | 'submitted'
  | 'organized'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'scheduled'
  | 'completed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          department: string | null
          avatar_url: string | null
          is_admin: boolean
          is_direction: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          department?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_direction?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          department?: string | null
          avatar_url?: string | null
          is_admin?: boolean
          is_direction?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string
          created_at?: string
        }
      }
      ideas: {
        Row: {
          id: string
          author_id: string | null
          is_anonymous: boolean
          title: string
          description: string
          category_id: string | null
          ai_summary: string | null
          ai_tags: string[] | null
          ai_similar_ideas: string[] | null
          ai_processed_at: string | null
          quality_score: number
          priority_score: number
          quality_votes_count: number
          priority_votes_count: number
          comments_count: number
          status: IdeaStatus
          review_cycle: number | null
          direction_verdict: string | null
          direction_motivation: string | null
          direction_reviewed_by: string | null
          direction_reviewed_at: string | null
          scheduled_quarter: string | null
          scheduled_priority: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id?: string | null
          is_anonymous?: boolean
          title: string
          description: string
          category_id?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          ai_similar_ideas?: string[] | null
          ai_processed_at?: string | null
          quality_score?: number
          priority_score?: number
          quality_votes_count?: number
          priority_votes_count?: number
          comments_count?: number
          status?: IdeaStatus
          review_cycle?: number | null
          direction_verdict?: string | null
          direction_motivation?: string | null
          direction_reviewed_by?: string | null
          direction_reviewed_at?: string | null
          scheduled_quarter?: string | null
          scheduled_priority?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string | null
          is_anonymous?: boolean
          title?: string
          description?: string
          category_id?: string | null
          ai_summary?: string | null
          ai_tags?: string[] | null
          ai_similar_ideas?: string[] | null
          ai_processed_at?: string | null
          quality_score?: number
          priority_score?: number
          quality_votes_count?: number
          priority_votes_count?: number
          comments_count?: number
          status?: IdeaStatus
          review_cycle?: number | null
          direction_verdict?: string | null
          direction_motivation?: string | null
          direction_reviewed_by?: string | null
          direction_reviewed_at?: string | null
          scheduled_quarter?: string | null
          scheduled_priority?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      votes: {
        Row: {
          id: string
          idea_id: string
          user_id: string
          quality_rating: number | null
          priority_rating: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          user_id: string
          quality_rating?: number | null
          priority_rating?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          user_id?: string
          quality_rating?: number | null
          priority_rating?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          idea_id: string
          author_id: string | null
          is_anonymous: boolean
          content: string
          is_direction_reply: boolean
          reply_to_direction: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          author_id?: string | null
          is_anonymous?: boolean
          content: string
          is_direction_reply?: boolean
          reply_to_direction?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          author_id?: string | null
          is_anonymous?: boolean
          content?: string
          is_direction_reply?: boolean
          reply_to_direction?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      review_cycles: {
        Row: {
          id: number
          cycle_number: number
          start_date: string
          end_date: string
          review_date: string
          reveal_date: string | null
          status: string
          top_ideas_ids: string[] | null
          created_at: string
        }
        Insert: {
          id?: number
          cycle_number: number
          start_date: string
          end_date: string
          review_date: string
          reveal_date?: string | null
          status?: string
          top_ideas_ids?: string[] | null
          created_at?: string
        }
        Update: {
          id?: number
          cycle_number?: number
          start_date?: string
          end_date?: string
          review_date?: string
          reveal_date?: string | null
          status?: string
          top_ideas_ids?: string[] | null
          created_at?: string
        }
      }
      direction_decisions: {
        Row: {
          id: string
          idea_id: string
          cycle_id: number | null
          verdict: string
          motivation: string
          reviewed_by: string | null
          quality_score_at_review: number | null
          priority_score_at_review: number | null
          rank_position: number | null
          created_at: string
        }
        Insert: {
          id?: string
          idea_id: string
          cycle_id?: number | null
          verdict: string
          motivation: string
          reviewed_by?: string | null
          quality_score_at_review?: number | null
          priority_score_at_review?: number | null
          rank_position?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          idea_id?: string
          cycle_id?: number | null
          verdict?: string
          motivation?: string
          reviewed_by?: string | null
          quality_score_at_review?: number | null
          priority_score_at_review?: number | null
          rank_position?: number | null
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string | null
          idea_id: string | null
          is_read: boolean
          scheduled_for: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message?: string | null
          idea_id?: string | null
          is_read?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string | null
          idea_id?: string | null
          is_read?: boolean
          scheduled_for?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_top_ideas: {
        Args: { limit_count?: number }
        Returns: {
          id: string
          title: string
          quality_score: number
          priority_score: number
        }[]
      }
    }
    Enums: {
      idea_status: IdeaStatus
    }
  }
}

// Tipi helper
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Tipi derivati per comodità
export type Profile = Tables<'profiles'>
export type Category = Tables<'categories'>
export type Idea = Tables<'ideas'>
export type Vote = Tables<'votes'>
export type Comment = Tables<'comments'>
export type ReviewCycle = Tables<'review_cycles'>
export type DirectionDecision = Tables<'direction_decisions'>
export type Notification = Tables<'notifications'>

// Tipi estesi con relazioni
export type IdeaWithRelations = Idea & {
  author?: Profile | null
  category?: Category | null
  votes?: Vote[]
  comments?: (Comment & { author?: Profile | null })[]
  direction_reviewer?: Profile | null
}

export type CommentWithAuthor = Comment & {
  author?: Profile | null
}
