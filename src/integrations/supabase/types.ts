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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      affiliations: {
        Row: {
          created_at: string
          id: string
          links: Json
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          links?: Json
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          links?: Json
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      app_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      campaign_ads: {
        Row: {
          adset: string
          breakdowns: Json
          campaign_id: string
          created_at: string
          creative: string | null
          delivery: string
          format: string
          id: string
          metrics: Json
          name: string
          quality: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          adset?: string
          breakdowns?: Json
          campaign_id: string
          created_at?: string
          creative?: string | null
          delivery?: string
          format?: string
          id?: string
          metrics?: Json
          name: string
          quality?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          adset?: string
          breakdowns?: Json
          campaign_id?: string
          created_at?: string
          creative?: string | null
          delivery?: string
          format?: string
          id?: string
          metrics?: Json
          name?: string
          quality?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_metrics_daily: {
        Row: {
          ad_id: string | null
          campaign_id: string
          clicks: number
          created_at: string
          day: string
          id: string
          impressions: number
          leads: number
          metrics: Json
          revenue: number
          sales: number
          spend: number
          user_id: string
        }
        Insert: {
          ad_id?: string | null
          campaign_id: string
          clicks?: number
          created_at?: string
          day?: string
          id?: string
          impressions?: number
          leads?: number
          metrics?: Json
          revenue?: number
          sales?: number
          spend?: number
          user_id: string
        }
        Update: {
          ad_id?: string | null
          campaign_id?: string
          clicks?: number
          created_at?: string
          day?: string
          id?: string
          impressions?: number
          leads?: number
          metrics?: Json
          revenue?: number
          sales?: number
          spend?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_daily_ad_id_fkey"
            columns: ["ad_id"]
            isOneToOne: false
            referencedRelation: "campaign_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_metrics_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          balance: number
          created_at: string
          daily_budget: number
          id: string
          name: string
          objective: string
          platform: Database["public"]["Enums"]["platform"]
          product_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          daily_budget?: number
          id?: string
          name: string
          objective?: string
          platform: Database["public"]["Enums"]["platform"]
          product_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          daily_budget?: number
          id?: string
          name?: string
          objective?: string
          platform?: Database["public"]["Enums"]["platform"]
          product_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          duration_min: number
          id: string
          kind: string
          link: string | null
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          kind?: string
          link?: string | null
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          kind?: string
          link?: string | null
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedbacks: {
        Row: {
          approved: boolean
          author_name: string | null
          content: string
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          approved?: boolean
          author_name?: string | null
          content: string
          created_at?: string
          id?: string
          rating?: number
          user_id: string
        }
        Update: {
          approved?: boolean
          author_name?: string | null
          content?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_id: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          product_id: string | null
          source: string
          stage: Database["public"]["Enums"]["lead_stage"]
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id: string
          value?: number
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          source?: string
          stage?: Database["public"]["Enums"]["lead_stage"]
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          read: boolean
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          read?: boolean
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      product_metrics: {
        Row: {
          affiliates_count: number
          conversion_rate: number
          epc: number
          product_id: string
          refund_rate: number
          sales_30d: number
          stars: number
          temperature: number
          updated_at: string
        }
        Insert: {
          affiliates_count?: number
          conversion_rate?: number
          epc?: number
          product_id: string
          refund_rate?: number
          sales_30d?: number
          stars?: number
          temperature?: number
          updated_at?: string
        }
        Update: {
          affiliates_count?: number
          conversion_rate?: number
          epc?: number
          product_id?: string
          refund_rate?: number
          sales_30d?: number
          stars?: number
          temperature?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_metrics_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          audience: string | null
          category: string
          commission_pct: number
          commission_rules: string | null
          cover_url: string | null
          created_at: string
          description: string | null
          featured: boolean
          funnel: string | null
          gallery: Json
          id: string
          is_subscription: boolean
          materials: Json
          name: string
          slug: string
          status: string
          tagline: string | null
          ticket: number
          updated_at: string
        }
        Insert: {
          audience?: string | null
          category?: string
          commission_pct?: number
          commission_rules?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          funnel?: string | null
          gallery?: Json
          id?: string
          is_subscription?: boolean
          materials?: Json
          name: string
          slug: string
          status?: string
          tagline?: string | null
          ticket?: number
          updated_at?: string
        }
        Update: {
          audience?: string | null
          category?: string
          commission_pct?: number
          commission_rules?: string | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured?: boolean
          funnel?: string | null
          gallery?: Json
          id?: string
          is_subscription?: boolean
          materials?: Json
          name?: string
          slug?: string
          status?: string
          tagline?: string | null
          ticket?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarding_done: boolean
          phone: string | null
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarding_done?: boolean
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          balance?: number
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarding_done?: boolean
          phone?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          buyer_name: string | null
          commission: number
          created_at: string
          id: string
          method: string
          platform: Database["public"]["Enums"]["platform"] | null
          product_id: string | null
          quantity: number
          status: Database["public"]["Enums"]["sale_status"]
          user_id: string
        }
        Insert: {
          amount?: number
          buyer_name?: string | null
          commission?: number
          created_at?: string
          id?: string
          method?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          product_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["sale_status"]
          user_id: string
        }
        Update: {
          amount?: number
          buyer_name?: string | null
          commission?: number
          created_at?: string
          id?: string
          method?: string
          platform?: Database["public"]["Enums"]["platform"] | null
          product_id?: string | null
          quantity?: number
          status?: Database["public"]["Enums"]["sale_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      training_lessons: {
        Row: {
          created_at: string
          description: string | null
          duration_min: number
          id: string
          sort_order: number
          title: string
          training_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          sort_order?: number
          title: string
          training_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_min?: number
          id?: string
          sort_order?: number
          title?: string
          training_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_lessons_training_id_fkey"
            columns: ["training_id"]
            isOneToOne: false
            referencedRelation: "trainings"
            referencedColumns: ["id"]
          },
        ]
      }
      training_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "training_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "training_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      trainings: {
        Row: {
          cover_url: string | null
          created_at: string
          description: string | null
          id: string
          level: string
          slug: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          slug: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          level?: string
          slug?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["tx_status"]
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
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
      withdrawals: {
        Row: {
          amount: number
          created_at: string
          id: string
          note: string | null
          pix_key: string
          pix_key_type: string
          status: Database["public"]["Enums"]["withdrawal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          pix_key: string
          pix_key_type?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          pix_key?: string
          pix_key_type?: string
          status?: Database["public"]["Enums"]["withdrawal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      lead_stage:
        | "novo"
        | "contato"
        | "qualificado"
        | "negociacao"
        | "ganho"
        | "perdido"
      platform: "meta_facebook" | "meta_instagram" | "tiktok" | "kwai"
      sale_status: "aprovada" | "pendente" | "reembolsada" | "chargeback"
      tx_status: "concluida" | "pendente" | "recusada"
      tx_type: "comissao" | "saque" | "pix" | "ajuste" | "bonus"
      withdrawal_status: "em_analise" | "aprovado" | "recusado" | "pago"
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
      app_role: ["admin", "user"],
      lead_stage: [
        "novo",
        "contato",
        "qualificado",
        "negociacao",
        "ganho",
        "perdido",
      ],
      platform: ["meta_facebook", "meta_instagram", "tiktok", "kwai"],
      sale_status: ["aprovada", "pendente", "reembolsada", "chargeback"],
      tx_status: ["concluida", "pendente", "recusada"],
      tx_type: ["comissao", "saque", "pix", "ajuste", "bonus"],
      withdrawal_status: ["em_analise", "aprovado", "recusado", "pago"],
    },
  },
} as const
