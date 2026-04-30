export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      candidate_levels: {
        Row: {
          candidate_id: string
          id: string
          level: Database["public"]["Enums"]["course_level"]
          unlocked: boolean
          unlocked_at: string | null
        }
        Insert: {
          candidate_id: string
          id?: string
          level: Database["public"]["Enums"]["course_level"]
          unlocked?: boolean
          unlocked_at?: string | null
        }
        Update: {
          candidate_id?: string
          id?: string
          level?: Database["public"]["Enums"]["course_level"]
          unlocked?: boolean
          unlocked_at?: string | null
        }
        Relationships: []
      }
      candidate_subscriptions: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          candidate_id: string
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          level: Database["public"]["Enums"]["course_level"]
          notes: string | null
          payment_reference: string | null
          price_paid: number
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          updated_at: string
        }
        Insert: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          candidate_id: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          level: Database["public"]["Enums"]["course_level"]
          notes?: string | null
          payment_reference?: string | null
          price_paid?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          candidate_id?: string
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          level?: Database["public"]["Enums"]["course_level"]
          notes?: string | null
          payment_reference?: string | null
          price_paid?: number
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          updated_at?: string
        }
        Relationships: []
      }
      content_access_overrides: {
        Row: {
          candidate_id: string
          course_id: string | null
          created_at: string
          granted_at: string
          granted_by: string | null
          id: string
          lesson_id: string | null
          level: Database["public"]["Enums"]["course_level"] | null
          notes: string | null
          scope: Database["public"]["Enums"]["override_scope"]
          unlock_until: string
          updated_at: string
        }
        Insert: {
          candidate_id: string
          course_id?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["course_level"] | null
          notes?: string | null
          scope: Database["public"]["Enums"]["override_scope"]
          unlock_until: string
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          course_id?: string | null
          created_at?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          lesson_id?: string | null
          level?: Database["public"]["Enums"]["course_level"] | null
          notes?: string | null
          scope?: Database["public"]["Enums"]["override_scope"]
          unlock_until?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_published: boolean
          level: Database["public"]["Enums"]["course_level"]
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          level: Database["public"]["Enums"]["course_level"]
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_published?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          candidate_id: string
          completed_at: string | null
          created_at: string
          id: string
          is_completed: boolean
          lesson_id: string
        }
        Insert: {
          candidate_id: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id: string
        }
        Update: {
          candidate_id?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          is_completed?: boolean
          lesson_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_resources: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          lesson_id: string
          order_index: number
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind: Database["public"]["Enums"]["resource_kind"]
          lesson_id: string
          order_index?: number
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          lesson_id?: string
          order_index?: number
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      lessons: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_free: boolean
          order_index: number
          pdf_url: string | null
          ppt_url: string | null
          text_content: string | null
          title: string
          updated_at: string
          youtube_url: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_free?: boolean
          order_index?: number
          pdf_url?: string | null
          ppt_url?: string | null
          text_content?: string | null
          title: string
          updated_at?: string
          youtube_url?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_free?: boolean
          order_index?: number
          pdf_url?: string | null
          ppt_url?: string | null
          text_content?: string | null
          title?: string
          updated_at?: string
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          id: string
          read_at: string | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          read_at?: string | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      plan_pricing: {
        Row: {
          billing_type: Database["public"]["Enums"]["billing_type"]
          created_at: string
          currency: string
          features: Json
          id: string
          is_active: boolean
          level: Database["public"]["Enums"]["course_level"]
          price: number
          updated_at: string
        }
        Insert: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          level: Database["public"]["Enums"]["course_level"]
          price?: number
          updated_at?: string
        }
        Update: {
          billing_type?: Database["public"]["Enums"]["billing_type"]
          created_at?: string
          currency?: string
          features?: Json
          id?: string
          is_active?: boolean
          level?: Database["public"]["Enums"]["course_level"]
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string
          created_at: string
          id: string
          options: Json | null
          order_index: number
          points: number
          q_type: Database["public"]["Enums"]["question_type"]
          question_text: string
          test_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          q_type: Database["public"]["Enums"]["question_type"]
          question_text: string
          test_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          id?: string
          options?: Json | null
          order_index?: number
          points?: number
          q_type?: Database["public"]["Enums"]["question_type"]
          question_text?: string
          test_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      test_attempts: {
        Row: {
          answers: Json
          candidate_id: string
          id: string
          percentage: number
          score: number
          started_at: string
          status: Database["public"]["Enums"]["attempt_status"]
          submitted_at: string | null
          test_id: string
          total: number
        }
        Insert: {
          answers?: Json
          candidate_id: string
          id?: string
          percentage?: number
          score?: number
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          test_id: string
          total?: number
        }
        Update: {
          answers?: Json
          candidate_id?: string
          id?: string
          percentage?: number
          score?: number
          started_at?: string
          status?: Database["public"]["Enums"]["attempt_status"]
          submitted_at?: string | null
          test_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "test_attempts_test_id_fkey"
            columns: ["test_id"]
            isOneToOne: false
            referencedRelation: "tests"
            referencedColumns: ["id"]
          },
        ]
      }
      tests: {
        Row: {
          created_at: string
          created_by: string | null
          duration_minutes: number
          id: string
          lesson_id: string
          pass_percentage: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          lesson_id: string
          pass_percentage?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          duration_minutes?: number
          id?: string
          lesson_id?: string
          pass_percentage?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tests_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      tutor_assignments: {
        Row: {
          assigned_by: string | null
          candidate_id: string
          created_at: string
          id: string
          tutor_id: string
          updated_at: string
        }
        Insert: {
          assigned_by?: string | null
          candidate_id: string
          created_at?: string
          id?: string
          tutor_id: string
          updated_at?: string
        }
        Update: {
          assigned_by?: string | null
          candidate_id?: string
          created_at?: string
          id?: string
          tutor_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_lesson: {
        Args: { _lesson_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_level: {
        Args: {
          _level: Database["public"]["Enums"]["course_level"]
          _user_id: string
        }
        Returns: boolean
      }
      can_communicate: {
        Args: { _user_a: string; _user_b: string }
        Returns: boolean
      }
      get_assigned_tutor: { Args: { _candidate_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_active_plan: {
        Args: {
          _level: Database["public"]["Enums"]["course_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_any_active_plan: { Args: { _user_id: string }; Returns: boolean }
      has_override_for_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_override_for_lesson: {
        Args: { _lesson_id: string; _user_id: string }
        Returns: boolean
      }
      has_override_for_level: {
        Args: {
          _level: Database["public"]["Enums"]["course_level"]
          _user_id: string
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_assigned_pair: {
        Args: { _candidate_id: string; _tutor_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "tutor" | "candidate"
      attempt_status: "in_progress" | "passed" | "failed"
      billing_type: "monthly" | "one_time"
      course_level: "basic" | "intermediate" | "senior"
      override_scope: "level" | "course" | "lesson"
      question_type: "mcq" | "fib"
      resource_kind: "pdf" | "ppt" | "youtube"
      subscription_status: "active" | "expired" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "tutor", "candidate"],
      attempt_status: ["in_progress", "passed", "failed"],
      billing_type: ["monthly", "one_time"],
      course_level: ["basic", "intermediate", "senior"],
      override_scope: ["level", "course", "lesson"],
      question_type: ["mcq", "fib"],
      resource_kind: ["pdf", "ppt", "youtube"],
      subscription_status: ["active", "expired", "cancelled"],
    },
  },
} as const
