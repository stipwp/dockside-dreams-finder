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
      admin_audit_log: {
        Row: {
          action: string
          admin_id: string | null
          created_at: string
          detail: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      boat_profiles: {
        Row: {
          air_draft_ft: number | null
          beam_ft: number | null
          created_at: string
          draft_ft: number | null
          id: string
          is_default: boolean
          length_ft: number | null
          name: string
          power_need: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          air_draft_ft?: number | null
          beam_ft?: number | null
          created_at?: string
          draft_ft?: number | null
          id?: string
          is_default?: boolean
          length_ft?: number | null
          name: string
          power_need?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          air_draft_ft?: number | null
          beam_ft?: number | null
          created_at?: string
          draft_ft?: number | null
          id?: string
          is_default?: boolean
          length_ft?: number | null
          name?: string
          power_need?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      booking_messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          boat_beam_ft: number | null
          boat_draft_ft: number | null
          boat_length_ft: number | null
          boat_name: string | null
          cleaning_fee_cents: number
          created_at: string
          end_date: string
          guest_id: string
          guests: number
          host_id: string
          host_note: string | null
          id: string
          listing_id: string
          message: string | null
          nights: number
          payment_intent_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["booking_status"]
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          boat_beam_ft?: number | null
          boat_draft_ft?: number | null
          boat_length_ft?: number | null
          boat_name?: string | null
          cleaning_fee_cents?: number
          created_at?: string
          end_date: string
          guest_id: string
          guests?: number
          host_id: string
          host_note?: string | null
          id?: string
          listing_id: string
          message?: string | null
          nights: number
          payment_intent_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Update: {
          boat_beam_ft?: number | null
          boat_draft_ft?: number | null
          boat_length_ft?: number | null
          boat_name?: string | null
          cleaning_fee_cents?: number
          created_at?: string
          end_date?: string
          guest_id?: string
          guests?: number
          host_id?: string
          host_note?: string | null
          id?: string
          listing_id?: string
          message?: string | null
          nights?: number
          payment_intent_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["booking_status"]
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_placements: {
        Row: {
          amount_cents: number
          created_at: string
          ends_at: string
          id: string
          listing_id: string
          provider_payment_id: string | null
          starts_at: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          ends_at: string
          id?: string
          listing_id: string
          provider_payment_id?: string | null
          starts_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          ends_at?: string
          id?: string
          listing_id?: string
          provider_payment_id?: string | null
          starts_at?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "featured_placements_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiries: {
        Row: {
          created_at: string
          from_email: string
          from_name: string
          from_phone: string | null
          from_user_id: string | null
          id: string
          listing_id: string
          message: string
          read_at: string | null
        }
        Insert: {
          created_at?: string
          from_email: string
          from_name: string
          from_phone?: string | null
          from_user_id?: string | null
          id?: string
          listing_id: string
          message: string
          read_at?: string | null
        }
        Update: {
          created_at?: string
          from_email?: string
          from_name?: string
          from_phone?: string | null
          from_user_id?: string | null
          id?: string
          listing_id?: string
          message?: string
          read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_availability: {
        Row: {
          created_at: string
          date: string
          id: string
          is_blocked: boolean
          listing_id: string
          price_cents_override: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_blocked?: boolean
          listing_id: string
          price_cents_override?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_blocked?: boolean
          listing_id?: string
          price_cents_override?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_availability_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_photos: {
        Row: {
          created_at: string
          id: string
          is_cover: boolean
          listing_id: string
          sort_order: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id: string
          sort_order?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_cover?: boolean
          listing_id?: string
          sort_order?: number
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "listing_photos_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          address: string | null
          advance_notice_hours: number
          bathrooms: number | null
          bedrooms: number | null
          cancellation_policy: string
          city: string | null
          cleaning_fee_cents: number
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          cover_photo_url: string | null
          covered: boolean | null
          created_at: string
          description: string | null
          dock_beam_ft: number | null
          dock_length_ft: number | null
          featured: boolean
          floating: boolean | null
          house_rules: string | null
          id: string
          instant_book: boolean
          is_demo: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          lat: number | null
          listing_type: Database["public"]["Enums"]["listing_type"] | null
          liveaboard_allowed: boolean | null
          lng: number | null
          lot_sqft: number | null
          max_boat_beam_ft: number | null
          max_boat_draft_ft: number | null
          max_boat_length_ft: number | null
          max_guests: number
          max_nights: number | null
          min_nights: number
          nightly_price_cents: number | null
          owner_id: string | null
          power: string | null
          price_cents: number
          price_period: Database["public"]["Enums"]["price_period"] | null
          rating_avg: number | null
          rating_count: number
          sqft: number | null
          state: string | null
          status: Database["public"]["Enums"]["listing_status"]
          tidal: boolean | null
          title: string
          updated_at: string
          water_depth_ft: number | null
          water_hookup: boolean | null
          waterway: string | null
          weekly_price_cents: number | null
        }
        Insert: {
          address?: string | null
          advance_notice_hours?: number
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string
          city?: string | null
          cleaning_fee_cents?: number
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_photo_url?: string | null
          covered?: boolean | null
          created_at?: string
          description?: string | null
          dock_beam_ft?: number | null
          dock_length_ft?: number | null
          featured?: boolean
          floating?: boolean | null
          house_rules?: string | null
          id?: string
          instant_book?: boolean
          is_demo?: boolean
          kind: Database["public"]["Enums"]["listing_kind"]
          lat?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          liveaboard_allowed?: boolean | null
          lng?: number | null
          lot_sqft?: number | null
          max_boat_beam_ft?: number | null
          max_boat_draft_ft?: number | null
          max_boat_length_ft?: number | null
          max_guests?: number
          max_nights?: number | null
          min_nights?: number
          nightly_price_cents?: number | null
          owner_id?: string | null
          power?: string | null
          price_cents?: number
          price_period?: Database["public"]["Enums"]["price_period"] | null
          rating_avg?: number | null
          rating_count?: number
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tidal?: boolean | null
          title: string
          updated_at?: string
          water_depth_ft?: number | null
          water_hookup?: boolean | null
          waterway?: string | null
          weekly_price_cents?: number | null
        }
        Update: {
          address?: string | null
          advance_notice_hours?: number
          bathrooms?: number | null
          bedrooms?: number | null
          cancellation_policy?: string
          city?: string | null
          cleaning_fee_cents?: number
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          cover_photo_url?: string | null
          covered?: boolean | null
          created_at?: string
          description?: string | null
          dock_beam_ft?: number | null
          dock_length_ft?: number | null
          featured?: boolean
          floating?: boolean | null
          house_rules?: string | null
          id?: string
          instant_book?: boolean
          is_demo?: boolean
          kind?: Database["public"]["Enums"]["listing_kind"]
          lat?: number | null
          listing_type?: Database["public"]["Enums"]["listing_type"] | null
          liveaboard_allowed?: boolean | null
          lng?: number | null
          lot_sqft?: number | null
          max_boat_beam_ft?: number | null
          max_boat_draft_ft?: number | null
          max_boat_length_ft?: number | null
          max_guests?: number
          max_nights?: number | null
          min_nights?: number
          nightly_price_cents?: number | null
          owner_id?: string | null
          power?: string | null
          price_cents?: number
          price_period?: Database["public"]["Enums"]["price_period"] | null
          rating_avg?: number | null
          rating_count?: number
          sqft?: number | null
          state?: string | null
          status?: Database["public"]["Enums"]["listing_status"]
          tidal?: boolean | null
          title?: string
          updated_at?: string
          water_depth_ft?: number | null
          water_hookup?: boolean | null
          waterway?: string | null
          weekly_price_cents?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          suspended_at: string | null
          suspension_reason: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          suspended_at?: string | null
          suspension_reason?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reporter_id: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reporter_id?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          body: string | null
          booking_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          listing_id: string
          rating: number
          reviewer_id: string | null
          reviewer_name: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          listing_id: string
          rating: number
          reviewer_id?: string | null
          reviewer_name?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          booking_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          listing_id?: string
          rating?: number
          reviewer_id?: string | null
          reviewer_name?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          alerts_enabled: boolean
          created_at: string
          id: string
          name: string
          params: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          name: string
          params?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          alerts_enabled?: boolean
          created_at?: string
          id?: string
          name?: string
          params?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          interval: string
          provider: string | null
          provider_customer_id: string | null
          provider_subscription_id: string | null
          status: Database["public"]["Enums"]["subscription_status"]
          tier: Database["public"]["Enums"]["plan_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          interval?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          interval?: string
          provider?: string | null
          provider_customer_id?: string | null
          provider_subscription_id?: string | null
          status?: Database["public"]["Enums"]["subscription_status"]
          tier?: Database["public"]["Enums"]["plan_tier"]
          updated_at?: string
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
      verifications: {
        Row: {
          created_at: string
          email_verified: boolean
          id: string
          identity_status: Database["public"]["Enums"]["verification_status"]
          phone_verified: boolean
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_verified?: boolean
          id?: string
          identity_status?: Database["public"]["Enums"]["verification_status"]
          phone_verified?: boolean
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_verified?: boolean
          id?: string
          identity_status?: Database["public"]["Enums"]["verification_status"]
          phone_verified?: boolean
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          submitted_at?: string | null
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
      current_tier: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["plan_tier"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "owner" | "admin"
      booking_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "expired"
      listing_kind: "home" | "slip"
      listing_status: "draft" | "published" | "sold_rented"
      listing_type: "home_sale" | "slip_lease" | "slip_short_term"
      plan_tier: "free" | "host_pro" | "captain"
      price_period: "sale" | "month" | "season"
      report_status: "open" | "reviewing" | "resolved" | "dismissed"
      report_target: "listing" | "user" | "message" | "booking"
      subscription_status: "active" | "trialing" | "past_due" | "canceled"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      app_role: ["owner", "admin"],
      booking_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "expired",
      ],
      listing_kind: ["home", "slip"],
      listing_status: ["draft", "published", "sold_rented"],
      listing_type: ["home_sale", "slip_lease", "slip_short_term"],
      plan_tier: ["free", "host_pro", "captain"],
      price_period: ["sale", "month", "season"],
      report_status: ["open", "reviewing", "resolved", "dismissed"],
      report_target: ["listing", "user", "message", "booking"],
      subscription_status: ["active", "trialing", "past_due", "canceled"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
