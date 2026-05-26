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
      addresses: {
        Row: {
          address_line1: string
          address_line2: string | null
          city: string
          country: string
          created_at: string
          full_name: string
          id: string
          instructions: string | null
          is_default: boolean
          label: string
          phone: string
          postal_code: string | null
          province: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address_line1: string
          address_line2?: string | null
          city: string
          country?: string
          created_at?: string
          full_name: string
          id?: string
          instructions?: string | null
          is_default?: boolean
          label?: string
          phone: string
          postal_code?: string | null
          province: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address_line1?: string
          address_line2?: string | null
          city?: string
          country?: string
          created_at?: string
          full_name?: string
          id?: string
          instructions?: string | null
          is_default?: boolean
          label?: string
          phone?: string
          postal_code?: string | null
          province?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "addresses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          quantity: number
          updated_at: string
          user_id: string
          variant_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id: string
          variant_id: string
        }
        Update: {
          created_at?: string
          id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
          parent_id: string | null
          position: number
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
          parent_id?: string | null
          position?: number
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
          parent_id?: string | null
          position?: number
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          brand_name: string
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          size_ml: number
          sku: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          brand_name: string
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          quantity: number
          size_ml: number
          sku: string
          unit_price: number
          variant_id?: string | null
        }
        Update: {
          brand_name?: string
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_name?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          quantity?: number
          size_ml?: number
          sku?: string
          unit_price?: number
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          created_by_admin_id: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string
          discount: number
          id: string
          notes: string | null
          order_number: number
          order_status: Database["public"]["Enums"]["order_status"]
          paid_at: string | null
          payment_provider: string | null
          payment_reference: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          shipping_canton: string
          shipping_cost: number
          shipping_district: string | null
          shipping_method: string | null
          shipping_province: string
          shipping_reference: string | null
          source: string
          subtotal: number
          tax: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          created_by_admin_id?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone: string
          discount?: number
          id?: string
          notes?: string | null
          order_number?: never
          order_status?: Database["public"]["Enums"]["order_status"]
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address: string
          shipping_canton: string
          shipping_cost?: number
          shipping_district?: string | null
          shipping_method?: string | null
          shipping_province: string
          shipping_reference?: string | null
          source?: string
          subtotal: number
          tax?: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          created_by_admin_id?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string
          discount?: number
          id?: string
          notes?: string | null
          order_number?: never
          order_status?: Database["public"]["Enums"]["order_status"]
          paid_at?: string | null
          payment_provider?: string | null
          payment_reference?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          shipping_address?: string
          shipping_canton?: string
          shipping_cost?: number
          shipping_district?: string | null
          shipping_method?: string | null
          shipping_province?: string
          shipping_reference?: string | null
          source?: string
          subtotal?: number
          tax?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_created_by_admin_id_fkey"
            columns: ["created_by_admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      processed_webhooks: {
        Row: {
          event_id: string
          id: string
          payload_hash: string | null
          processed_at: string
          provider: string
        }
        Insert: {
          event_id: string
          id?: string
          payload_hash?: string | null
          processed_at?: string
          provider: string
        }
        Update: {
          event_id?: string
          id?: string
          payload_hash?: string | null
          processed_at?: string
          provider?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          category_id: string
          product_id: string
        }
        Insert: {
          category_id: string
          product_id: string
        }
        Update: {
          category_id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_categories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_on_offer: boolean
          offer_price: number | null
          position: number
          price: number
          product_id: string
          product_type: Database["public"]["Enums"]["product_type"]
          size_ml: number
          sku: string
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_on_offer?: boolean
          offer_price?: number | null
          position?: number
          price: number
          product_id: string
          product_type: Database["public"]["Enums"]["product_type"]
          size_ml: number
          sku: string
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_on_offer?: boolean
          offer_price?: number | null
          position?: number
          price?: number
          product_id?: string
          product_type?: Database["public"]["Enums"]["product_type"]
          size_ml?: number
          sku?: string
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          concentration: string | null
          created_at: string
          description: string | null
          featured_variant_id: string | null
          gender: string | null
          id: string
          is_active: boolean
          name: string
          notes_base: string | null
          notes_middle: string | null
          notes_top: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          brand_id: string
          concentration?: string | null
          created_at?: string
          description?: string | null
          featured_variant_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes_base?: string | null
          notes_middle?: string | null
          notes_top?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          brand_id?: string
          concentration?: string | null
          created_at?: string
          description?: string | null
          featured_variant_id?: string | null
          gender?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes_base?: string | null
          notes_middle?: string | null
          notes_top?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_featured_variant"
            columns: ["featured_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      shipping_zone_cantons: {
        Row: {
          canton_code: string
          canton_name: string
          province_code: string
          province_name: string
          zone_id: string
        }
        Insert: {
          canton_code: string
          canton_name: string
          province_code: string
          province_name: string
          zone_id: string
        }
        Update: {
          canton_code?: string
          canton_name?: string
          province_code?: string
          province_name?: string
          zone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_zone_cantons_zone_id_fkey"
            columns: ["zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_zones: {
        Row: {
          base_cost: number
          code: string
          created_at: string
          free_shipping_threshold: number | null
          id: string
          is_active: boolean
          name: string
          updated_at: string
        }
        Insert: {
          base_cost: number
          code: string
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          base_cost?: number
          code?: string
          created_at?: string
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          delta: number
          id: string
          new_stock: number
          notes: string | null
          performed_by: string | null
          previous_stock: number
          reason: Database["public"]["Enums"]["stock_movement_reason"]
          reference_id: string | null
          variant_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: string
          new_stock: number
          notes?: string | null
          performed_by?: string | null
          previous_stock: number
          reason: Database["public"]["Enums"]["stock_movement_reason"]
          reference_id?: string | null
          variant_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: string
          new_stock?: number
          notes?: string | null
          performed_by?: string | null
          previous_stock?: number
          reason?: Database["public"]["Enums"]["stock_movement_reason"]
          reference_id?: string | null
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      advance_order_status: {
        Args: { p_new_status: string; p_order_id: string }
        Returns: Json
      }
      analytics_best_sellers: {
        Args: { p_limit?: number; p_since?: string }
        Returns: {
          brand_name: string
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          size_ml: number
          sku: string
          total_revenue: number
          total_units: number
          variant_id: string
        }[]
      }
      analytics_low_stock: {
        Args: { p_threshold?: number }
        Returns: {
          product_name: string
          product_type: Database["public"]["Enums"]["product_type"]
          size_ml: number
          sku: string
          stock: number
          variant_id: string
        }[]
      }
      analytics_revenue_summary: {
        Args: { p_since?: string }
        Returns: {
          avg_order_value: number
          gross_revenue: number
          total_orders: number
          total_units: number
        }[]
      }
      calculate_shipping_cost: {
        Args: { p_canton_code: string; p_subtotal: number }
        Returns: Json
      }
      claim_guest_orders: {
        Args: { p_email: string; p_user_id: string }
        Returns: number
      }
      create_new_product: {
        Args: {
          p_brand_id: string
          p_category_ids: string[]
          p_concentration: string
          p_description: string
          p_gender: string
          p_image_url: string
          p_is_on_offer: boolean
          p_name: string
          p_notes_base: string
          p_notes_middle: string
          p_notes_top: string
          p_offer_price?: number
          p_price: number
          p_product_type: Database["public"]["Enums"]["product_type"]
          p_size_ml: number
          p_sku: string
          p_stock: number
        }
        Returns: Json
      }
      decrease_variant_stock: {
        Args: { p_order_id: string; p_quantity: number; p_variant_id: string }
        Returns: undefined
      }
      deny_order_admin: {
        Args: { p_order_id: string; p_reason: string }
        Returns: Json
      }
      is_admin: { Args: never; Returns: boolean }
      mark_order_paid: { Args: { p_order_id: string }; Returns: Json }
      place_order: { Args: { p_payload: Json }; Returns: Json }
      restore_variant_stock: { Args: { p_order_id: string }; Returns: Json }
      search_products: {
        Args: { p_limit?: number; p_offset?: number; p_query: string }
        Returns: {
          brand_name: string
          id: string
          name: string
          similarity: number
          slug: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      sweep_abandoned_orders: { Args: never; Returns: number }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      order_status: "pending" | "received" | "shipped" | "denied"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      product_type: "full_size" | "decant"
      stock_movement_reason:
        | "manual_adjustment"
        | "order_placed"
        | "order_cancelled"
        | "restock"
        | "correction"
        | "return"
      user_role: "customer" | "admin"
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
      order_status: ["pending", "received", "shipped", "denied"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      product_type: ["full_size", "decant"],
      stock_movement_reason: [
        "manual_adjustment",
        "order_placed",
        "order_cancelled",
        "restock",
        "correction",
        "return",
      ],
      user_role: ["customer", "admin"],
    },
  },
} as const
