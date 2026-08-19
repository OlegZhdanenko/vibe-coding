/**
 * Hand-maintained mirror of the SQL in `supabase/migrations`.
 * Regenerate with `supabase gen types typescript` once the CLI is linked.
 *
 * Everything here is declared with `type`, not `interface`: postgrest-js checks
 * the schema against `Record<string, unknown>`, and interfaces do not get an
 * implicit index signature — using one silently degrades every query to `never`.
 */

export type PlanId = 'free' | 'pro' | 'team'

export type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: PlanId
  generations_used: number
  created_at: string
  updated_at: string
}

export type EmailRow = {
  id: string
  user_id: string
  topic: string
  tone: string
  length: string
  language: string
  recipient: string | null
  subject: string
  body: string
  model: string
  created_at: string
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          plan?: PlanId
          generations_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: Partial<ProfileRow>
        Relationships: []
      }
      emails: {
        Row: EmailRow
        Insert: {
          id?: string
          user_id: string
          topic: string
          tone: string
          length: string
          language: string
          recipient?: string | null
          subject: string
          body: string
          model: string
          created_at?: string
        }
        Update: Partial<EmailRow>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      increment_generations_used: {
        Args: { target_user: string }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
