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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contracts: {
        Row: {
          created_at: string
          deposit_amount: number | null
          end_date: string
          id: string
          merchant_id: string
          rent_amount: number
          start_date: string
          status: string | null
          tenant_user_id: string
          terms: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deposit_amount?: number | null
          end_date: string
          id?: string
          merchant_id: string
          rent_amount: number
          start_date: string
          status?: string | null
          tenant_user_id: string
          terms?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deposit_amount?: number | null
          end_date?: string
          id?: string
          merchant_id?: string
          rent_amount?: number
          start_date?: string
          status?: string | null
          tenant_user_id?: string
          terms?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          contract_id: string | null
          created_at: string
          description: string
          id: string
          merchant_id: string
          priority: string | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tenant_user_id: string
          title: string
          updated_at: string
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          description: string
          id?: string
          merchant_id: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_user_id: string
          title: string
          updated_at?: string
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          description?: string
          id?: string
          merchant_id?: string
          priority?: string | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_user_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disputes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_accounts: {
        Row: {
          balance: number
          created_at: string
          id: string
          merchant_id: string
          pending_balance: number
          updated_at: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          merchant_id: string
          pending_balance?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          merchant_id?: string
          pending_balance?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      escrow_transactions: {
        Row: {
          amount: number
          contract_id: string | null
          created_at: string
          description: string | null
          escrow_account_id: string
          id: string
          processed_at: string | null
          reference: string | null
          status: string | null
          type: string
        }
        Insert: {
          amount: number
          contract_id?: string | null
          created_at?: string
          description?: string | null
          escrow_account_id: string
          id?: string
          processed_at?: string | null
          reference?: string | null
          status?: string | null
          type: string
        }
        Update: {
          amount?: number
          contract_id?: string | null
          created_at?: string
          description?: string | null
          escrow_account_id?: string
          id?: string
          processed_at?: string | null
          reference?: string | null
          status?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "escrow_transactions_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_transactions_escrow_account_id_fkey"
            columns: ["escrow_account_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          description: string | null
          due_date: string
          id: string
          invoice_number: string
          issued_at: string | null
          line_items: Json | null
          merchant_id: string
          paid_at: string | null
          status: string
          tax_amount: number | null
          tenant_user_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          description?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issued_at?: string | null
          line_items?: Json | null
          merchant_id: string
          paid_at?: string | null
          status?: string
          tax_amount?: number | null
          tenant_user_id: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issued_at?: string | null
          line_items?: Json | null
          merchant_id?: string
          paid_at?: string | null
          status?: string
          tax_amount?: number | null
          tenant_user_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          assigned_to: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          merchant_id: string
          priority: string
          resolved_at: string | null
          status: string
          tenant_user_id: string
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          merchant_id: string
          priority?: string
          resolved_at?: string | null
          status?: string
          tenant_user_id: string
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          merchant_id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          tenant_user_id?: string
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_verifications: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          merchant_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          merchant_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          merchant_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          address: string | null
          business_name: string
          business_type: string | null
          city: string | null
          created_at: string
          id: string
          postal_code: string | null
          province: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          created_at?: string
          id?: string
          postal_code?: string | null
          province?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          created_at?: string
          id?: string
          postal_code?: string | null
          province?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          link: string | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          due_date: string
          id: string
          merchant_id: string
          paid_at: string | null
          payment_method: string | null
          payment_type: string
          reference: string | null
          status: string
          tenant_user_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          due_date: string
          id?: string
          merchant_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          reference?: string | null
          status?: string
          tenant_user_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          due_date?: string
          id?: string
          merchant_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_type?: string
          reference?: string | null
          status?: string
          tenant_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[] | null
          city: string
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          merchant_id: string
          name: string
          occupied_units: number | null
          postal_code: string | null
          property_type: string
          province: string
          status: string | null
          total_units: number | null
          updated_at: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          city: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          merchant_id: string
          name: string
          occupied_units?: number | null
          postal_code?: string | null
          property_type: string
          province: string
          status?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          merchant_id?: string
          name?: string
          occupied_units?: number | null
          postal_code?: string | null
          property_type?: string
          province?: string
          status?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          merchant_id: string
          phone: string | null
          status: string | null
          token: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          merchant_id: string
          phone?: string | null
          status?: string | null
          token?: string
          unit_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          merchant_id?: string
          phone?: string | null
          status?: string | null
          token?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          amenities: string[] | null
          created_at: string
          deposit_amount: number | null
          description: string | null
          floor: number | null
          id: string
          property_id: string
          rent_amount: number
          size_sqm: number | null
          status: string | null
          unit_number: string
          unit_type: string | null
          updated_at: string
        }
        Insert: {
          amenities?: string[] | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          floor?: number | null
          id?: string
          property_id: string
          rent_amount: number
          size_sqm?: number | null
          status?: string | null
          unit_number: string
          unit_type?: string | null
          updated_at?: string
        }
        Update: {
          amenities?: string[] | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          floor?: number | null
          id?: string
          property_id?: string
          rent_amount?: number
          size_sqm?: number | null
          status?: string | null
          unit_number?: string
          unit_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
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
      vendors: {
        Row: {
          address: string | null
          business_name: string
          city: string | null
          contact_email: string
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          province: string | null
          rating: number | null
          service_categories: string[] | null
          total_jobs: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
        }
        Insert: {
          address?: string | null
          business_name: string
          city?: string | null
          contact_email: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          province?: string | null
          rating?: number | null
          service_categories?: string[] | null
          total_jobs?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string
          city?: string | null
          contact_email?: string
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          province?: string | null
          rating?: number | null
          service_categories?: string[] | null
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "merchant" | "tenant" | "vendor"
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
      app_role: ["admin", "merchant", "tenant", "vendor"],
    },
  },
} as const
