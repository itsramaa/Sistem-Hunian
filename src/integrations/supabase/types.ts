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
      addresses: {
        Row: {
          address_type: string | null
          city: string
          created_at: string | null
          id: string
          latitude: number | null
          longitude: number | null
          postal_code: string | null
          province: string
          street_address: string | null
        }
        Insert: {
          address_type?: string | null
          city: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          province: string
          street_address?: string | null
        }
        Update: {
          address_type?: string | null
          city?: string
          created_at?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          postal_code?: string | null
          province?: string
          street_address?: string | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      assets: {
        Row: {
          brand: string | null
          condition: string
          created_at: string
          facility_type_id: string
          id: string
          merchant_id: string
          notes: string | null
          property_id: string | null
          purchase_date: string | null
          purchase_price: number
          salvage_value: number
          serial_number: string | null
          status: string
          unit_id: string | null
          updated_at: string
          useful_life_months: number
        }
        Insert: {
          brand?: string | null
          condition?: string
          created_at?: string
          facility_type_id: string
          id?: string
          merchant_id: string
          notes?: string | null
          property_id?: string | null
          purchase_date?: string | null
          purchase_price?: number
          salvage_value?: number
          serial_number?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          useful_life_months?: number
        }
        Update: {
          brand?: string | null
          condition?: string
          created_at?: string
          facility_type_id?: string
          id?: string
          merchant_id?: string
          notes?: string | null
          property_id?: string | null
          purchase_date?: string | null
          purchase_price?: number
          salvage_value?: number
          serial_number?: string | null
          status?: string
          unit_id?: string | null
          updated_at?: string
          useful_life_months?: number
        }
        Relationships: [
          {
            foreignKeyName: "assets_facility_type_id_fkey"
            columns: ["facility_type_id"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_data: Json | null
          old_data: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_data?: Json | null
          old_data?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          merchant_id: string
          updated_at: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          merchant_id: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          merchant_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      cancellation_feedback: {
        Row: {
          created_at: string
          feedback: string | null
          id: string
          merchant_id: string
          reason: string
          subscription_id: string | null
          would_return: boolean | null
        }
        Insert: {
          created_at?: string
          feedback?: string | null
          id?: string
          merchant_id: string
          reason: string
          subscription_id?: string | null
          would_return?: boolean | null
        }
        Update: {
          created_at?: string
          feedback?: string | null
          id?: string
          merchant_id?: string
          reason?: string
          subscription_id?: string | null
          would_return?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "cancellation_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "cancellation_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "cancellation_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "cancellation_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cancellation_feedback_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "merchant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          context: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_analytics: {
        Row: {
          action_taken: string | null
          conversation_id: string | null
          created_at: string
          id: string
          message_count: number | null
          query_type: string | null
          response_time_ms: number | null
          user_id: string | null
          user_role: string | null
          user_satisfied: boolean | null
        }
        Insert: {
          action_taken?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_count?: number | null
          query_type?: string | null
          response_time_ms?: number | null
          user_id?: string | null
          user_role?: string | null
          user_satisfied?: boolean | null
        }
        Update: {
          action_taken?: string | null
          conversation_id?: string | null
          created_at?: string
          id?: string
          message_count?: number | null
          query_type?: string | null
          response_time_ms?: number | null
          user_id?: string | null
          user_role?: string | null
          user_satisfied?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_analytics_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      chatbot_knowledge: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          keywords: string[] | null
          question: string
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question: string
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          question?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          id: string
          name: string
          province_id: string
        }
        Insert: {
          id: string
          name: string
          province_id: string
        }
        Update: {
          id?: string
          name?: string
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cities_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      collections_cases: {
        Row: {
          created_at: string | null
          days_overdue: number
          escalation_level: number
          id: string
          invoice_id: string
          last_contact_at: string | null
          merchant_id: string
          next_action_date: string | null
          notes: string | null
          resolution_type: string | null
          resolved_at: string | null
          status: string
          tenant_user_id: string
          total_due: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          days_overdue: number
          escalation_level?: number
          id?: string
          invoice_id: string
          last_contact_at?: string | null
          merchant_id: string
          next_action_date?: string | null
          notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
          tenant_user_id: string
          total_due: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          days_overdue?: number
          escalation_level?: number
          id?: string
          invoice_id?: string
          last_contact_at?: string | null
          merchant_id?: string
          next_action_date?: string | null
          notes?: string | null
          resolution_type?: string | null
          resolved_at?: string | null
          status?: string
          tenant_user_id?: string
          total_due?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collections_cases_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_cases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "collections_cases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "collections_cases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "collections_cases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collections_cases_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_documents: {
        Row: {
          created_at: string
          document_name: string
          document_type: string
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          merchant_id: string
          notes: string | null
          property_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_name: string
          document_type: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          merchant_id: string
          notes?: string | null
          property_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_name?: string
          document_type?: string
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          merchant_id?: string
          notes?: string | null
          property_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "compliance_documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "compliance_documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "compliance_documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          actual_end_date: string | null
          billing_day: number | null
          churn_reason: string | null
          contract_document_url: string | null
          contract_number: string | null
          created_at: string
          deposit_amount: number | null
          early_termination_penalty_rate: number | null
          end_date: string
          expected_move_out_date: string | null
          grace_period_days: number | null
          id: string
          late_fee_type: string | null
          late_payment_penalty_rate: number | null
          merchant_id: string
          merchant_signature_url: string | null
          merchant_signed_at: string | null
          move_out_notice_date: string | null
          move_out_notice_given: boolean | null
          notice_period_days: number | null
          payment_frequency: string | null
          referral_bonus_amount: number | null
          referral_bonus_applied: boolean | null
          rent_amount: number
          signature_status: string | null
          start_date: string
          status: string | null
          tenant_signature_url: string | null
          tenant_signed_at: string | null
          tenant_user_id: string
          termination_penalty: number | null
          terms: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          actual_end_date?: string | null
          billing_day?: number | null
          churn_reason?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          created_at?: string
          deposit_amount?: number | null
          early_termination_penalty_rate?: number | null
          end_date: string
          expected_move_out_date?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee_type?: string | null
          late_payment_penalty_rate?: number | null
          merchant_id: string
          merchant_signature_url?: string | null
          merchant_signed_at?: string | null
          move_out_notice_date?: string | null
          move_out_notice_given?: boolean | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          referral_bonus_amount?: number | null
          referral_bonus_applied?: boolean | null
          rent_amount: number
          signature_status?: string | null
          start_date: string
          status?: string | null
          tenant_signature_url?: string | null
          tenant_signed_at?: string | null
          tenant_user_id: string
          termination_penalty?: number | null
          terms?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          actual_end_date?: string | null
          billing_day?: number | null
          churn_reason?: string | null
          contract_document_url?: string | null
          contract_number?: string | null
          created_at?: string
          deposit_amount?: number | null
          early_termination_penalty_rate?: number | null
          end_date?: string
          expected_move_out_date?: string | null
          grace_period_days?: number | null
          id?: string
          late_fee_type?: string | null
          late_payment_penalty_rate?: number | null
          merchant_id?: string
          merchant_signature_url?: string | null
          merchant_signed_at?: string | null
          move_out_notice_date?: string | null
          move_out_notice_given?: boolean | null
          notice_period_days?: number | null
          payment_frequency?: string | null
          referral_bonus_amount?: number | null
          referral_bonus_applied?: boolean | null
          rent_amount?: number
          signature_status?: string | null
          start_date?: string
          status?: string | null
          tenant_signature_url?: string | null
          tenant_signed_at?: string | null
          tenant_user_id?: string
          termination_penalty?: number | null
          terms?: string | null
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
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
      data_quality_checks: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          is_final_validated: boolean | null
          merchant_id: string
          overrides: Json | null
          quality_score: number | null
          validated_at: string | null
          validated_by: string | null
          validation_results: Json | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          is_final_validated?: boolean | null
          merchant_id: string
          overrides?: Json | null
          quality_score?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_results?: Json | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          is_final_validated?: boolean | null
          merchant_id?: string
          overrides?: Json | null
          quality_score?: number | null
          validated_at?: string | null
          validated_by?: string | null
          validation_results?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_quality_checks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "data_quality_checks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "data_quality_checks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "data_quality_checks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_quality_checks_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_disputes: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          deposit_refund_id: string
          dispute_reason: string
          disputed_amount: number
          evidence_photos: string[] | null
          id: string
          merchant_response: string | null
          resolution: string | null
          resolved_amount: number | null
          resolved_at: string | null
          resolved_by: string | null
          status: string | null
          tenant_user_id: string
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          deposit_refund_id: string
          dispute_reason: string
          disputed_amount: number
          evidence_photos?: string[] | null
          id?: string
          merchant_response?: string | null
          resolution?: string | null
          resolved_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_user_id: string
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          deposit_refund_id?: string
          dispute_reason?: string
          disputed_amount?: number
          evidence_photos?: string[] | null
          id?: string
          merchant_response?: string | null
          resolution?: string | null
          resolved_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string | null
          tenant_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_disputes_deposit_refund_id_fkey"
            columns: ["deposit_refund_id"]
            isOneToOne: false
            referencedRelation: "deposit_refunds"
            referencedColumns: ["id"]
          },
        ]
      }
      deposit_refunds: {
        Row: {
          account_holder_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          contract_id: string
          created_at: string | null
          deduction_details: Json | null
          deductions: number | null
          due_date: string | null
          id: string
          inspection_id: string | null
          original_deposit: number
          refund_amount: number
          refunded_at: string | null
          status: string | null
          tenant_user_id: string
          updated_at: string | null
          xendit_disbursement_id: string | null
        }
        Insert: {
          account_holder_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contract_id: string
          created_at?: string | null
          deduction_details?: Json | null
          deductions?: number | null
          due_date?: string | null
          id?: string
          inspection_id?: string | null
          original_deposit: number
          refund_amount: number
          refunded_at?: string | null
          status?: string | null
          tenant_user_id: string
          updated_at?: string | null
          xendit_disbursement_id?: string | null
        }
        Update: {
          account_holder_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          contract_id?: string
          created_at?: string | null
          deduction_details?: Json | null
          deductions?: number | null
          due_date?: string | null
          id?: string
          inspection_id?: string | null
          original_deposit?: number
          refund_amount?: number
          refunded_at?: string | null
          status?: string | null
          tenant_user_id?: string
          updated_at?: string | null
          xendit_disbursement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deposit_refunds_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_refunds_inspection_id_fkey"
            columns: ["inspection_id"]
            isOneToOne: false
            referencedRelation: "move_out_inspections"
            referencedColumns: ["id"]
          },
        ]
      }
      disaster_risk_profiles: {
        Row: {
          created_at: string
          disaster_history: Json | null
          earthquake_risk: string | null
          fire_risk: string | null
          flood_risk: string | null
          id: string
          landslide_risk: string | null
          last_assessed_at: string | null
          merchant_id: string
          mitigation_systems: Json | null
          notes: string | null
          overall_risk_score: number | null
          property_id: string
          risk_zone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          disaster_history?: Json | null
          earthquake_risk?: string | null
          fire_risk?: string | null
          flood_risk?: string | null
          id?: string
          landslide_risk?: string | null
          last_assessed_at?: string | null
          merchant_id: string
          mitigation_systems?: Json | null
          notes?: string | null
          overall_risk_score?: number | null
          property_id: string
          risk_zone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          disaster_history?: Json | null
          earthquake_risk?: string | null
          fire_risk?: string | null
          flood_risk?: string | null
          id?: string
          landslide_risk?: string | null
          last_assessed_at?: string | null
          merchant_id?: string
          mitigation_systems?: Json | null
          notes?: string | null
          overall_risk_score?: number | null
          property_id?: string
          risk_zone?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "disaster_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disaster_risk_profiles_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      disbursements: {
        Row: {
          amount: number
          bank_account_id: string | null
          completed_at: string | null
          created_at: string
          escrow_account_id: string | null
          failure_reason: string | null
          fee_amount: number | null
          id: string
          net_amount: number
          processed_at: string | null
          requires_manual_review: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_for: string | null
          status: string
          type: string
          updated_at: string
          vendor_id: string | null
          xendit_disbursement_id: string | null
          xendit_reference: string | null
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          completed_at?: string | null
          created_at?: string
          escrow_account_id?: string | null
          failure_reason?: string | null
          fee_amount?: number | null
          id?: string
          net_amount: number
          processed_at?: string | null
          requires_manual_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor_id?: string | null
          xendit_disbursement_id?: string | null
          xendit_reference?: string | null
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          completed_at?: string | null
          created_at?: string
          escrow_account_id?: string | null
          failure_reason?: string | null
          fee_amount?: number | null
          id?: string
          net_amount?: number
          processed_at?: string | null
          requires_manual_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_for?: string | null
          status?: string
          type?: string
          updated_at?: string
          vendor_id?: string | null
          xendit_disbursement_id?: string | null
          xendit_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "disbursements_escrow_account_id_fkey"
            columns: ["escrow_account_id"]
            isOneToOne: false
            referencedRelation: "escrow_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "disbursements_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
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
      dss_recommendations: {
        Row: {
          accepted_at: string | null
          confidence_score: number | null
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          impact_estimate: Json | null
          measured_impact: Json | null
          merchant_id: string
          ml_model_run_id: string | null
          recommendation_data: Json | null
          rejected_at: string | null
          rejection_reason: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          impact_estimate?: Json | null
          measured_impact?: Json | null
          merchant_id: string
          ml_model_run_id?: string | null
          recommendation_data?: Json | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          confidence_score?: number | null
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          impact_estimate?: Json | null
          measured_impact?: Json | null
          merchant_id?: string
          ml_model_run_id?: string | null
          recommendation_data?: Json | null
          rejected_at?: string | null
          rejection_reason?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dss_recommendations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "dss_recommendations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "dss_recommendations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "dss_recommendations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dss_recommendations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dss_recommendations_ml_model_run_id_fkey"
            columns: ["ml_model_run_id"]
            isOneToOne: false
            referencedRelation: "ml_model_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      dss_validation_logs: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          new_state: string | null
          old_state: string | null
          performed_by: string | null
          validation_details: Json | null
          validation_result: string
          validation_type: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          new_state?: string | null
          old_state?: string | null
          performed_by?: string | null
          validation_details?: Json | null
          validation_result: string
          validation_type: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          new_state?: string | null
          old_state?: string | null
          performed_by?: string | null
          validation_details?: Json | null
          validation_result?: string
          validation_type?: string
        }
        Relationships: []
      }
      early_termination_requests: {
        Row: {
          approved_at: string | null
          contract_id: string
          counter_offer_amount: number | null
          created_at: string | null
          denied_at: string | null
          id: string
          merchant_response: string | null
          penalty_amount: number | null
          reason: string | null
          requested_date: string
          status: string | null
          supporting_docs: string[] | null
          tenant_user_id: string
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          contract_id: string
          counter_offer_amount?: number | null
          created_at?: string | null
          denied_at?: string | null
          id?: string
          merchant_response?: string | null
          penalty_amount?: number | null
          reason?: string | null
          requested_date: string
          status?: string | null
          supporting_docs?: string[] | null
          tenant_user_id: string
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          contract_id?: string
          counter_offer_amount?: number | null
          created_at?: string | null
          denied_at?: string | null
          id?: string
          merchant_response?: string | null
          penalty_amount?: number | null
          reason?: string | null
          requested_date?: string
          status?: string | null
          supporting_docs?: string[] | null
          tenant_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "early_termination_requests_contract_id_fkey"
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
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "escrow_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "escrow_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "escrow_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escrow_accounts_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
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
          gateway_fee: number | null
          gross_amount: number | null
          id: string
          platform_fee: number | null
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
          gateway_fee?: number | null
          gross_amount?: number | null
          id?: string
          platform_fee?: number | null
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
          gateway_fee?: number | null
          gross_amount?: number | null
          id?: string
          platform_fee?: number | null
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
      facilities: {
        Row: {
          asset_type: string | null
          brand: string | null
          category: string
          created_at: string | null
          id: string
          merchant_id: string
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          salvage_value: number | null
          updated_at: string | null
          useful_life_months: number | null
        }
        Insert: {
          asset_type?: string | null
          brand?: string | null
          category?: string
          created_at?: string | null
          id?: string
          merchant_id: string
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          salvage_value?: number | null
          updated_at?: string | null
          useful_life_months?: number | null
        }
        Update: {
          asset_type?: string | null
          brand?: string | null
          category?: string
          created_at?: string | null
          id?: string
          merchant_id?: string
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          salvage_value?: number | null
          updated_at?: string | null
          useful_life_months?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "facilities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facilities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facilities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facilities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facilities_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_assignments: {
        Row: {
          capacity: number | null
          created_at: string
          facility_type_id: string
          id: string
          notes: string | null
          property_id: string | null
          unit_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          facility_type_id: string
          id?: string
          notes?: string | null
          property_id?: string | null
          unit_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          facility_type_id?: string
          id?: string
          notes?: string | null
          property_id?: string | null
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "facility_assignments_facility_type_id_fkey"
            columns: ["facility_type_id"]
            isOneToOne: false
            referencedRelation: "facility_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_assignments_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      facility_types: {
        Row: {
          asset_type: string
          created_at: string
          default_useful_life_months: number | null
          id: string
          is_trackable: boolean
          merchant_id: string
          name: string
          nature: string
          scope: string
          updated_at: string
        }
        Insert: {
          asset_type?: string
          created_at?: string
          default_useful_life_months?: number | null
          id?: string
          is_trackable?: boolean
          merchant_id: string
          name: string
          nature?: string
          scope?: string
          updated_at?: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          default_useful_life_months?: number | null
          id?: string
          is_trackable?: boolean
          merchant_id?: string
          name?: string
          nature?: string
          scope?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "facility_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facility_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facility_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "facility_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "facility_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_visible: boolean | null
          like_count: number | null
          parent_id: string | null
          post_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_visible?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_visible?: boolean | null
          like_count?: number | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_posts: {
        Row: {
          author_id: string
          comment_count: number | null
          content: string
          created_at: string
          id: string
          is_locked: boolean | null
          is_pinned: boolean | null
          is_visible: boolean | null
          like_count: number | null
          photos: string[] | null
          property_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          author_id: string
          comment_count?: number | null
          content: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_visible?: boolean | null
          like_count?: number | null
          photos?: string[] | null
          property_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          author_id?: string
          comment_count?: number | null
          content?: string
          created_at?: string
          id?: string
          is_locked?: boolean | null
          is_pinned?: boolean | null
          is_visible?: boolean | null
          like_count?: number | null
          photos?: string[] | null
          property_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_posts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_reports: {
        Row: {
          comment_id: string | null
          created_at: string
          description: string | null
          id: string
          post_id: string | null
          reason: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string | null
          reason: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          post_id?: string | null
          reason?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "forum_reports_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "forum_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_reports_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_property_assignments: {
        Row: {
          assigned_date: string
          created_at: string
          guardian_id: string
          id: string
          property_id: string
          role: string
          status: string
        }
        Insert: {
          assigned_date?: string
          created_at?: string
          guardian_id: string
          id?: string
          property_id: string
          role?: string
          status?: string
        }
        Update: {
          assigned_date?: string
          created_at?: string
          guardian_id?: string
          id?: string
          property_id?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_property_assignments_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "property_guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_property_assignments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_claims: {
        Row: {
          approved_amount: number | null
          claim_amount: number
          claim_date: string
          created_at: string
          description: string | null
          documents: Json | null
          id: string
          incident_date: string
          incident_type: string
          merchant_id: string
          policy_id: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          claim_amount?: number
          claim_date: string
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          incident_date: string
          incident_type: string
          merchant_id: string
          policy_id: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          claim_amount?: number
          claim_date?: string
          created_at?: string
          description?: string | null
          documents?: Json | null
          id?: string
          incident_date?: string
          incident_type?: string
          merchant_id?: string
          policy_id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_claims_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_claims_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_claims_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_claims_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_claims_policy_id_fkey"
            columns: ["policy_id"]
            isOneToOne: false
            referencedRelation: "insurance_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      insurance_policies: {
        Row: {
          coverage_amount: number
          coverage_details: Json | null
          created_at: string
          end_date: string
          id: string
          merchant_id: string
          policy_number: string
          policy_type: string
          premium_amount: number
          premium_frequency: string | null
          property_id: string
          provider: string
          start_date: string
          status: string
          updated_at: string
        }
        Insert: {
          coverage_amount?: number
          coverage_details?: Json | null
          created_at?: string
          end_date: string
          id?: string
          merchant_id: string
          policy_number: string
          policy_type: string
          premium_amount?: number
          premium_frequency?: string | null
          property_id: string
          provider: string
          start_date: string
          status?: string
          updated_at?: string
        }
        Update: {
          coverage_amount?: number
          coverage_details?: Json | null
          created_at?: string
          end_date?: string
          id?: string
          merchant_id?: string
          policy_number?: string
          policy_type?: string
          premium_amount?: number
          premium_frequency?: string | null
          property_id?: string
          provider?: string
          start_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "insurance_policies_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_policies_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_policies_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "insurance_policies_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "insurance_policies_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_status_history: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          id: string
          invoice_id: string
          merchant_id: string
          new_status: string
          notes: string | null
          old_status: string | null
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          invoice_id: string
          merchant_id: string
          new_status: string
          notes?: string | null
          old_status?: string | null
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          invoice_id?: string
          merchant_id?: string
          new_status?: string
          notes?: string | null
          old_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_status_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoice_status_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoice_status_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoice_status_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
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
          grace_period_active: boolean | null
          id: string
          invoice_number: string
          issued_at: string | null
          late_fee: number | null
          late_fee_applied_at: string | null
          line_items: Json | null
          merchant_id: string
          original_amount: number | null
          overdue_since: string | null
          paid_at: string | null
          payment_plan_id: string | null
          property_id: string | null
          status: string
          tax_amount: number | null
          tenant_name: string | null
          tenant_user_id: string
          total_amount: number
          unit_id: string | null
          unit_number: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          description?: string | null
          due_date: string
          grace_period_active?: boolean | null
          id?: string
          invoice_number: string
          issued_at?: string | null
          late_fee?: number | null
          late_fee_applied_at?: string | null
          line_items?: Json | null
          merchant_id: string
          original_amount?: number | null
          overdue_since?: string | null
          paid_at?: string | null
          payment_plan_id?: string | null
          property_id?: string | null
          status?: string
          tax_amount?: number | null
          tenant_name?: string | null
          tenant_user_id: string
          total_amount: number
          unit_id?: string | null
          unit_number?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          due_date?: string
          grace_period_active?: boolean | null
          id?: string
          invoice_number?: string
          issued_at?: string | null
          late_fee?: number | null
          late_fee_applied_at?: string | null
          line_items?: Json | null
          merchant_id?: string
          original_amount?: number | null
          overdue_since?: string | null
          paid_at?: string | null
          payment_plan_id?: string | null
          property_id?: string | null
          status?: string
          tax_amount?: number | null
          tenant_name?: string | null
          tenant_user_id?: string
          total_amount?: number
          unit_id?: string | null
          unit_number?: string | null
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
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      late_fee_records: {
        Row: {
          applied_at: string | null
          calculation_method: string
          created_at: string | null
          days_overdue: number
          id: string
          invoice_id: string
          late_fee_amount: number
          original_amount: number
        }
        Insert: {
          applied_at?: string | null
          calculation_method: string
          created_at?: string | null
          days_overdue: number
          id?: string
          invoice_id: string
          late_fee_amount: number
          original_amount: number
        }
        Update: {
          applied_at?: string | null
          calculation_method?: string
          created_at?: string | null
          days_overdue?: number
          id?: string
          invoice_id?: string
          late_fee_amount?: number
          original_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "late_fee_records_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_conversations: {
        Row: {
          created_at: string | null
          id: string
          merchant_id: string | null
          status: string
          subject: string | null
          updated_at: string | null
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          status?: string
          subject?: string | null
          updated_at?: string | null
          user_id?: string
          user_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "live_chat_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "live_chat_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "live_chat_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_chat_conversations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      live_chat_messages: {
        Row: {
          conversation_id: string | null
          created_at: string | null
          id: string
          message: string
          sender_id: string
          sender_role: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message: string
          sender_id: string
          sender_role: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          message?: string
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "live_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_expenses: {
        Row: {
          created_at: string
          currency: string
          id: string
          line_items: Json | null
          maintenance_request_id: string
          merchant_id: string
          notes: string | null
          ocr_result_id: string | null
          receipt_date: string | null
          receipt_number: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string
          vendor_name: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          line_items?: Json | null
          maintenance_request_id: string
          merchant_id: string
          notes?: string | null
          ocr_result_id?: string | null
          receipt_date?: string | null
          receipt_number?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          vendor_name?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          line_items?: Json | null
          maintenance_request_id?: string
          merchant_id?: string
          notes?: string | null
          ocr_result_id?: string | null
          receipt_date?: string | null
          receipt_number?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
          vendor_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_expenses_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_requests: {
        Row: {
          accepted_at: string | null
          assigned_to: string | null
          assigned_vendor_id: string | null
          category: string
          completion_notes: string | null
          completion_photos: string[] | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          images: string[] | null
          merchant_id: string
          preferred_schedule: string | null
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          started_at: string | null
          status: string
          tenant_user_id: string | null
          title: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          category?: string
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          merchant_id: string
          preferred_schedule?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_user_id?: string | null
          title: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_to?: string | null
          assigned_vendor_id?: string | null
          category?: string
          completion_notes?: string | null
          completion_photos?: string[] | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          images?: string[] | null
          merchant_id?: string
          preferred_schedule?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_user_id?: string | null
          title?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_assigned_vendor_id_fkey"
            columns: ["assigned_vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
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
      maintenance_reviews: {
        Row: {
          created_at: string | null
          id: string
          maintenance_request_id: string
          photos: string[] | null
          rating: number
          review_text: string | null
          tenant_user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          maintenance_request_id: string
          photos?: string[] | null
          rating: number
          review_text?: string | null
          tenant_user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          maintenance_request_id?: string
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          tenant_user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_reviews_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: true
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_timeline: {
        Row: {
          actor_id: string | null
          actor_role: string | null
          created_at: string | null
          id: string
          maintenance_request_id: string
          message: string
          metadata: Json | null
          status: string
        }
        Insert: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: string
          maintenance_request_id: string
          message: string
          metadata?: Json | null
          status: string
        }
        Update: {
          actor_id?: string | null
          actor_role?: string | null
          created_at?: string | null
          id?: string
          maintenance_request_id?: string
          message?: string
          metadata?: Json | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_timeline_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_updates: {
        Row: {
          author_id: string
          author_role: string
          content: string
          created_at: string
          id: string
          maintenance_request_id: string
          photos: string[] | null
          status_change_to: string | null
        }
        Insert: {
          author_id: string
          author_role: string
          content: string
          created_at?: string
          id?: string
          maintenance_request_id: string
          photos?: string[] | null
          status_change_to?: string | null
        }
        Update: {
          author_id?: string
          author_role?: string
          content?: string
          created_at?: string
          id?: string
          maintenance_request_id?: string
          photos?: string[] | null
          status_change_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_updates_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_analytics_summary: {
        Row: {
          active_contracts: number | null
          merchant_id: string
          monthly_revenue: number | null
          occupancy_rate: number | null
          occupied_units: number | null
          overdue_invoices: number | null
          pending_invoices: number | null
          total_properties: number | null
          total_revenue: number | null
          total_units: number | null
          updated_at: string | null
        }
        Insert: {
          active_contracts?: number | null
          merchant_id: string
          monthly_revenue?: number | null
          occupancy_rate?: number | null
          occupied_units?: number | null
          overdue_invoices?: number | null
          pending_invoices?: number | null
          total_properties?: number | null
          total_revenue?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Update: {
          active_contracts?: number | null
          merchant_id?: string
          monthly_revenue?: number | null
          occupancy_rate?: number | null
          occupied_units?: number | null
          overdue_invoices?: number | null
          pending_invoices?: number | null
          total_properties?: number | null
          total_revenue?: number | null
          total_units?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_analytics_summary_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_analytics_summary_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_analytics_summary_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_analytics_summary_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_analytics_summary_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_feedback: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string | null
          id: string
          merchant_id: string | null
          message: string
          rating: number | null
          screenshot_url: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category: string
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          message: string
          rating?: number | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string | null
          id?: string
          merchant_id?: string | null
          message?: string
          rating?: number | null
          screenshot_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "merchant_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_feedback_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_subscriptions: {
        Row: {
          canceled_at: string | null
          cancellation_effective_date: string | null
          cancellation_reason: string | null
          cancellation_requested_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          failed_attempts: number | null
          grace_period_end: string | null
          id: string
          merchant_id: string
          next_billing_date: string | null
          payment_method: string | null
          payment_status: string | null
          status: string
          tier_id: string
          trial_ends_at: string | null
          updated_at: string
          xendit_recurring_id: string | null
        }
        Insert: {
          canceled_at?: string | null
          cancellation_effective_date?: string | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          failed_attempts?: number | null
          grace_period_end?: string | null
          id?: string
          merchant_id: string
          next_billing_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          tier_id: string
          trial_ends_at?: string | null
          updated_at?: string
          xendit_recurring_id?: string | null
        }
        Update: {
          canceled_at?: string | null
          cancellation_effective_date?: string | null
          cancellation_reason?: string | null
          cancellation_requested_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          failed_attempts?: number | null
          grace_period_end?: string | null
          id?: string
          merchant_id?: string
          next_billing_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          status?: string
          tier_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          xendit_recurring_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: true
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_subscriptions_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      merchant_verification_history: {
        Row: {
          action: string
          approval_notes: string | null
          created_at: string | null
          id: string
          merchant_id: string
          new_status: string | null
          old_status: string | null
          performed_by: string | null
          rejection_details: string | null
          rejection_reason: string | null
          resubmission_instructions: string | null
        }
        Insert: {
          action: string
          approval_notes?: string | null
          created_at?: string | null
          id?: string
          merchant_id: string
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          rejection_details?: string | null
          rejection_reason?: string | null
          resubmission_instructions?: string | null
        }
        Update: {
          action?: string
          approval_notes?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string
          new_status?: string | null
          old_status?: string | null
          performed_by?: string | null
          rejection_details?: string | null
          rejection_reason?: string | null
          resubmission_instructions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchant_verification_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verification_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verification_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verification_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_verification_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
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
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "merchant_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchant_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      merchants: {
        Row: {
          billing_address_id: string | null
          business_name: string
          business_type: string | null
          created_at: string
          headquarters_address_id: string | null
          id: string
          last_disbursement_date: string | null
          merchant_code: string | null
          min_disbursement_amount: number | null
          penalty_rate: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_details: string | null
          resubmission_count: number | null
          resubmission_instructions: string | null
          search_vector: unknown
          total_disbursed: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verification_submitted_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          billing_address_id?: string | null
          business_name: string
          business_type?: string | null
          created_at?: string
          headquarters_address_id?: string | null
          id?: string
          last_disbursement_date?: string | null
          merchant_code?: string | null
          min_disbursement_amount?: number | null
          penalty_rate?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_details?: string | null
          resubmission_count?: number | null
          resubmission_instructions?: string | null
          search_vector?: unknown
          total_disbursed?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          billing_address_id?: string | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          headquarters_address_id?: string | null
          id?: string
          last_disbursement_date?: string | null
          merchant_code?: string | null
          min_disbursement_amount?: number | null
          penalty_rate?: number | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_details?: string | null
          resubmission_count?: number | null
          resubmission_instructions?: string | null
          search_vector?: unknown
          total_disbursed?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_address_id_fkey"
            columns: ["headquarters_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      ml_model_runs: {
        Row: {
          confidence_score: number | null
          cost_estimate: number | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          function_name: string
          id: string
          input_summary: string | null
          merchant_id: string | null
          metadata: Json | null
          model_name: string
          output_summary: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name: string
          id?: string
          input_summary?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          model_name?: string
          output_summary?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          cost_estimate?: number | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          function_name?: string
          id?: string
          input_summary?: string | null
          merchant_id?: string | null
          metadata?: Json | null
          model_name?: string
          output_summary?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ml_model_runs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ml_model_runs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ml_model_runs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ml_model_runs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ml_model_runs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_inspections: {
        Row: {
          completed_at: string | null
          created_at: string | null
          deduction_details: Json | null
          deposit_refund_amount: number | null
          id: string
          inspection_report: Json | null
          inspector_id: string | null
          inspector_signature: string | null
          move_out_notice_id: string
          photos: string[] | null
          scheduled_date: string | null
          status: string | null
          tenant_confirmed: boolean | null
          tenant_signature: string | null
          total_deductions: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          deduction_details?: Json | null
          deposit_refund_amount?: number | null
          id?: string
          inspection_report?: Json | null
          inspector_id?: string | null
          inspector_signature?: string | null
          move_out_notice_id: string
          photos?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          tenant_confirmed?: boolean | null
          tenant_signature?: string | null
          total_deductions?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          deduction_details?: Json | null
          deposit_refund_amount?: number | null
          id?: string
          inspection_report?: Json | null
          inspector_id?: string | null
          inspector_signature?: string | null
          move_out_notice_id?: string
          photos?: string[] | null
          scheduled_date?: string | null
          status?: string | null
          tenant_confirmed?: boolean | null
          tenant_signature?: string | null
          total_deductions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "move_out_inspections_move_out_notice_id_fkey"
            columns: ["move_out_notice_id"]
            isOneToOne: false
            referencedRelation: "move_out_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_notices: {
        Row: {
          acknowledged_at: string | null
          contract_id: string
          created_at: string | null
          id: string
          intended_move_out_date: string
          is_early_termination: boolean | null
          notes: string | null
          notice_date: string | null
          reason: string | null
          status: string | null
          tenant_user_id: string
          updated_at: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          contract_id: string
          created_at?: string | null
          id?: string
          intended_move_out_date: string
          is_early_termination?: boolean | null
          notes?: string | null
          notice_date?: string | null
          reason?: string | null
          status?: string | null
          tenant_user_id: string
          updated_at?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          contract_id?: string
          created_at?: string | null
          id?: string
          intended_move_out_date?: string
          is_early_termination?: boolean | null
          notes?: string | null
          notice_date?: string | null
          reason?: string | null
          status?: string | null
          tenant_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "move_out_notices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_tasks: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          move_out_notice_id: string
          order_index: number | null
          task_name: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          move_out_notice_id: string
          order_index?: number | null
          task_name: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          move_out_notice_id?: string
          order_index?: number | null
          task_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_out_tasks_move_out_notice_id_fkey"
            columns: ["move_out_notice_id"]
            isOneToOne: false
            referencedRelation: "move_out_notices"
            referencedColumns: ["id"]
          },
        ]
      }
      move_out_timeline: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          move_out_notice_id: string
          notes: string | null
          step: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          move_out_notice_id: string
          notes?: string | null
          step: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          move_out_notice_id?: string
          notes?: string | null
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "move_out_timeline_move_out_notice_id_fkey"
            columns: ["move_out_notice_id"]
            isOneToOne: false
            referencedRelation: "move_out_notices"
            referencedColumns: ["id"]
          },
        ]
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
      occupancy_snapshots: {
        Row: {
          available_units: number
          avg_rent_amount: number
          avg_vacancy_days: number | null
          created_at: string
          id: string
          maintenance_units: number
          merchant_id: string
          move_outs: number
          new_move_ins: number
          occupancy_rate: number
          occupied_units: number
          property_id: string | null
          snapshot_month: string
          total_units: number
        }
        Insert: {
          available_units?: number
          avg_rent_amount?: number
          avg_vacancy_days?: number | null
          created_at?: string
          id?: string
          maintenance_units?: number
          merchant_id: string
          move_outs?: number
          new_move_ins?: number
          occupancy_rate?: number
          occupied_units?: number
          property_id?: string | null
          snapshot_month: string
          total_units?: number
        }
        Update: {
          available_units?: number
          avg_rent_amount?: number
          avg_vacancy_days?: number | null
          created_at?: string
          id?: string
          maintenance_units?: number
          merchant_id?: string
          move_outs?: number
          new_move_ins?: number
          occupancy_rate?: number
          occupied_units?: number
          property_id?: string | null
          snapshot_month?: string
          total_units?: number
        }
        Relationships: [
          {
            foreignKeyName: "occupancy_snapshots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "occupancy_snapshots_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      ocr_results: {
        Row: {
          confidence_score: number | null
          created_at: string
          document_type: string
          document_url: string
          error_message: string | null
          extracted_data: Json | null
          id: string
          merchant_id: string | null
          ml_model_run_id: string | null
          processing_time_ms: number | null
          requires_review: boolean
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          document_type: string
          document_url: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          merchant_id?: string | null
          ml_model_run_id?: string | null
          processing_time_ms?: number | null
          requires_review?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          document_type?: string
          document_url?: string
          error_message?: string | null
          extracted_data?: Json | null
          id?: string
          merchant_id?: string | null
          ml_model_run_id?: string | null
          processing_time_ms?: number | null
          requires_review?: boolean
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ocr_results_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ocr_results_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ocr_results_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "ocr_results_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_results_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_results_ml_model_run_id_fkey"
            columns: ["ml_model_run_id"]
            isOneToOne: false
            referencedRelation: "ml_model_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      order_reviews: {
        Row: {
          created_at: string
          id: string
          is_visible: boolean | null
          order_id: string
          photos: string[] | null
          rating: number
          review_text: string | null
          tenant_user_id: string
          updated_at: string
          vendor_id: string
          vendor_replied_at: string | null
          vendor_reply: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          order_id: string
          photos?: string[] | null
          rating: number
          review_text?: string | null
          tenant_user_id: string
          updated_at?: string
          vendor_id: string
          vendor_replied_at?: string | null
          vendor_reply?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_visible?: boolean | null
          order_id?: string
          photos?: string[] | null
          rating?: number
          review_text?: string | null
          tenant_user_id?: string
          updated_at?: string
          vendor_id?: string
          vendor_replied_at?: string | null
          vendor_reply?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: string | null
          cancel_reason: string | null
          canceled_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          order_number: string
          product_id: string
          quantity: number
          scheduled_date: string | null
          scheduled_time: string | null
          service_fee: number | null
          status: string
          tenant_user_id: string
          total_price: number
          unit_id: string | null
          unit_price: number
          updated_at: string
          vendor_id: string
        }
        Insert: {
          address?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number: string
          product_id: string
          quantity?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_fee?: number | null
          status?: string
          tenant_user_id: string
          total_price: number
          unit_id?: string | null
          unit_price: number
          updated_at?: string
          vendor_id: string
        }
        Update: {
          address?: string | null
          cancel_reason?: string | null
          canceled_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          order_number?: string
          product_id?: string
          quantity?: number
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_fee?: number | null
          status?: string
          tenant_user_id?: string
          total_price?: number
          unit_id?: string | null
          unit_price?: number
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plan_installments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string
          id: string
          installment_number: number
          invoice_id: string | null
          paid_at: string | null
          payment_plan_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date: string
          id?: string
          installment_number: number
          invoice_id?: string | null
          paid_at?: string | null
          payment_plan_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string
          id?: string
          installment_number?: number
          invoice_id?: string | null
          paid_at?: string | null
          payment_plan_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plan_installments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plan_installments_payment_plan_id_fkey"
            columns: ["payment_plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_plans: {
        Row: {
          accepted_at: string | null
          completed_at: string | null
          created_at: string | null
          defaulted_at: string | null
          frequency: string
          id: string
          installment_amount: number
          installment_count: number
          invoice_id: string
          late_fee_waived: boolean | null
          merchant_id: string
          original_amount: number
          plan_type: string
          start_date: string
          status: string
          tenant_user_id: string
          terms: string | null
          updated_at: string | null
          waived_amount: number | null
        }
        Insert: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          defaulted_at?: string | null
          frequency?: string
          id?: string
          installment_amount: number
          installment_count?: number
          invoice_id: string
          late_fee_waived?: boolean | null
          merchant_id: string
          original_amount: number
          plan_type?: string
          start_date: string
          status?: string
          tenant_user_id: string
          terms?: string | null
          updated_at?: string | null
          waived_amount?: number | null
        }
        Update: {
          accepted_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          defaulted_at?: string | null
          frequency?: string
          id?: string
          installment_amount?: number
          installment_count?: number
          invoice_id?: string
          late_fee_waived?: boolean | null
          merchant_id?: string
          original_amount?: number
          plan_type?: string
          start_date?: string
          status?: string
          tenant_user_id?: string
          terms?: string | null
          updated_at?: string | null
          waived_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_plans_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_verifications: {
        Row: {
          amount_difference: number | null
          bank_name: string | null
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string
          declared_amount: number | null
          id: string
          invoice_id: string | null
          match_confidence: number | null
          matched_amount: number | null
          merchant_id: string
          ocr_result_id: string
          recipient_name: string | null
          reference_number: string | null
          rejection_reason: string | null
          sender_name: string | null
          status: string
          tenant_user_id: string
          transfer_date: string | null
          updated_at: string
        }
        Insert: {
          amount_difference?: number | null
          bank_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          declared_amount?: number | null
          id?: string
          invoice_id?: string | null
          match_confidence?: number | null
          matched_amount?: number | null
          merchant_id: string
          ocr_result_id: string
          recipient_name?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          status?: string
          tenant_user_id: string
          transfer_date?: string | null
          updated_at?: string
        }
        Update: {
          amount_difference?: number | null
          bank_name?: string | null
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string
          declared_amount?: number | null
          id?: string
          invoice_id?: string | null
          match_confidence?: number | null
          matched_amount?: number | null
          merchant_id?: string
          ocr_result_id?: string
          recipient_name?: string | null
          reference_number?: string | null
          rejection_reason?: string | null
          sender_name?: string | null
          status?: string
          tenant_user_id?: string
          transfer_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_verifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payment_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_verifications_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_verifications_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
        ]
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
          proof_photo_url: string | null
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
          proof_photo_url?: string | null
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
          proof_photo_url?: string | null
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
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_subscription_changes: {
        Row: {
          applied_at: string | null
          cancelled_at: string | null
          change_type: string
          created_at: string
          current_tier_id: string | null
          effective_date: string
          id: string
          merchant_id: string
          pending_tier_id: string
          reason: string | null
          status: string
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          applied_at?: string | null
          cancelled_at?: string | null
          change_type?: string
          created_at?: string
          current_tier_id?: string | null
          effective_date: string
          id?: string
          merchant_id: string
          pending_tier_id: string
          reason?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          applied_at?: string | null
          cancelled_at?: string | null
          change_type?: string
          created_at?: string
          current_tier_id?: string | null
          effective_date?: string
          id?: string
          merchant_id?: string
          pending_tier_id?: string
          reason?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_subscription_changes_current_tier_id_fkey"
            columns: ["current_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_pending_tier_id_fkey"
            columns: ["pending_tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_subscription_changes_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "merchant_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key: string
          setting_value?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          estimated_duration: string | null
          id: string
          is_available: boolean | null
          max_order: number | null
          min_order: number | null
          name: string
          photos: string[] | null
          price: number
          promo_end: string | null
          promo_price: number | null
          promo_start: string | null
          service_area: string[] | null
          stock: number | null
          unit: string | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          is_available?: boolean | null
          max_order?: number | null
          min_order?: number | null
          name: string
          photos?: string[] | null
          price: number
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          service_area?: string[] | null
          stock?: number | null
          unit?: string | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          estimated_duration?: string | null
          id?: string
          is_available?: boolean | null
          max_order?: number | null
          min_order?: number | null
          name?: string
          photos?: string[] | null
          price?: number
          promo_end?: string | null
          promo_price?: number | null
          promo_start?: string | null
          service_area?: string[] | null
          stock?: number | null
          unit?: string | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_2fa_enabled: boolean | null
          admin_2fa_secret: string | null
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
          admin_2fa_enabled?: boolean | null
          admin_2fa_secret?: string | null
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
          admin_2fa_enabled?: boolean | null
          admin_2fa_secret?: string | null
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
          address_id: string | null
          amenities: string[] | null
          avg_annual_unexpected_cost: number | null
          building_condition: string | null
          construction_cost: number | null
          construction_year: number | null
          created_at: string
          description: string | null
          disaster_risk_level: string | null
          floor_count: number | null
          funding_source: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          images: string[] | null
          land_ownership: string | null
          marketing_cost: number | null
          merchant_id: string
          monthly_amortization: number | null
          monthly_maintenance_cost: number | null
          name: string
          nearby_facilities: Json | null
          occupied_units: number | null
          property_code: string | null
          property_type: string
          renovation_cost: number | null
          security_score: number | null
          status: string | null
          total_units: number | null
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          amenities?: string[] | null
          avg_annual_unexpected_cost?: number | null
          building_condition?: string | null
          construction_cost?: number | null
          construction_year?: number | null
          created_at?: string
          description?: string | null
          disaster_risk_level?: string | null
          floor_count?: number | null
          funding_source?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          images?: string[] | null
          land_ownership?: string | null
          marketing_cost?: number | null
          merchant_id: string
          monthly_amortization?: number | null
          monthly_maintenance_cost?: number | null
          name: string
          nearby_facilities?: Json | null
          occupied_units?: number | null
          property_code?: string | null
          property_type: string
          renovation_cost?: number | null
          security_score?: number | null
          status?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          amenities?: string[] | null
          avg_annual_unexpected_cost?: number | null
          building_condition?: string | null
          construction_cost?: number | null
          construction_year?: number | null
          created_at?: string
          description?: string | null
          disaster_risk_level?: string | null
          floor_count?: number | null
          funding_source?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          images?: string[] | null
          land_ownership?: string | null
          marketing_cost?: number | null
          merchant_id?: string
          monthly_amortization?: number | null
          monthly_maintenance_cost?: number | null
          name?: string
          nearby_facilities?: Json | null
          occupied_units?: number | null
          property_code?: string | null
          property_type?: string
          renovation_cost?: number | null
          security_score?: number | null
          status?: string | null
          total_units?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "properties_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_data_versions: {
        Row: {
          change_reason: string | null
          change_summary: string | null
          changed_by: string | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          snapshot_data: Json
          version_number: number
        }
        Insert: {
          change_reason?: string | null
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          snapshot_data: Json
          version_number: number
        }
        Update: {
          change_reason?: string | null
          change_summary?: string | null
          changed_by?: string | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          snapshot_data?: Json
          version_number?: number
        }
        Relationships: []
      }
      property_facilities: {
        Row: {
          condition: string | null
          created_at: string | null
          facility_id: string
          id: string
          installed_date: string | null
          notes: string | null
          property_id: string
          quantity: number | null
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          facility_id: string
          id?: string
          installed_date?: string | null
          notes?: string | null
          property_id: string
          quantity?: number | null
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          facility_id?: string
          id?: string
          installed_date?: string | null
          notes?: string | null
          property_id?: string
          quantity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "property_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_facilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_facilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_guardians: {
        Row: {
          address: string | null
          created_at: string
          end_date: string | null
          id: string
          id_number: string | null
          merchant_id: string
          name: string
          notes: string | null
          phone: string | null
          photo_url: string | null
          property_id: string
          salary: number | null
          salary_frequency: string | null
          start_date: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          id_number?: string | null
          merchant_id: string
          name: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          property_id: string
          salary?: number | null
          salary_frequency?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          id_number?: string | null
          merchant_id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          photo_url?: string | null
          property_id?: string
          salary?: number | null
          salary_frequency?: string | null
          start_date?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_guardians_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_guardians_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_guardians_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_guardians_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_guardians_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_guardians_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_guardians_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_nearby_facilities: {
        Row: {
          created_at: string
          distance_meters: number | null
          facility_name: string
          facility_type: string
          id: string
          latitude: number | null
          longitude: number | null
          property_id: string
        }
        Insert: {
          created_at?: string
          distance_meters?: number | null
          facility_name: string
          facility_type: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          property_id: string
        }
        Update: {
          created_at?: string
          distance_meters?: number | null
          facility_name?: string
          facility_type?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_nearby_facilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_nearby_facilities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_renovations: {
        Row: {
          category: string | null
          cost: number
          created_at: string
          description: string | null
          id: string
          merchant_id: string
          property_id: string
          renovation_date: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          merchant_id: string
          property_id: string
          renovation_date?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          merchant_id?: string
          property_id?: string
          renovation_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_renovations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_renovations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_renovations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_renovations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_renovations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_renovations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_renovations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      property_vendor_services: {
        Row: {
          created_at: string
          id: string
          merchant_id: string
          monthly_fee: number | null
          notes: string | null
          property_id: string
          service_type: string
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          merchant_id: string
          monthly_fee?: number | null
          notes?: string | null
          property_id: string
          service_type: string
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          merchant_id?: string
          monthly_fee?: number | null
          notes?: string | null
          property_id?: string
          service_type?: string
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_vendor_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_vendor_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_vendor_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "property_vendor_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_vendor_services_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_vendor_services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_vendor_services_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          cancellation_reason: string | null
          commission_amount: number
          commission_rate: number
          created_at: string
          eligible_date: string | null
          id: string
          month_number: number
          paid_at: string | null
          referee_id: string
          referral_id: string
          referrer_id: string
          status: string
          subscription_amount: number
          updated_at: string
        }
        Insert: {
          cancellation_reason?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          eligible_date?: string | null
          id?: string
          month_number?: number
          paid_at?: string | null
          referee_id: string
          referral_id: string
          referrer_id: string
          status?: string
          subscription_amount?: number
          updated_at?: string
        }
        Update: {
          cancellation_reason?: string | null
          commission_amount?: number
          commission_rate?: number
          created_at?: string
          eligible_date?: string | null
          id?: string
          month_number?: number
          paid_at?: string | null
          referee_id?: string
          referral_id?: string
          referrer_id?: string
          status?: string
          subscription_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_rewards: {
        Row: {
          amount: number
          created_at: string
          credited_at: string | null
          expires_at: string | null
          id: string
          referral_id: string | null
          status: string
          type: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          credited_at?: string | null
          expires_at?: string | null
          id?: string
          referral_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          credited_at?: string | null
          expires_at?: string | null
          id?: string
          referral_id?: string | null
          status?: string
          type?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          bonus_paid: boolean | null
          bonus_paid_at: string | null
          completed_at: string | null
          converted_at: string | null
          created_at: string
          first_payment_at: string | null
          id: string
          referee_avg_rating: number | null
          referee_monthly_payment: number | null
          referee_order_count: number | null
          referee_role: string | null
          referee_subscription_tier: string | null
          referee_user_id: string | null
          referral_code: string
          referrer_role: string
          referrer_user_id: string
          reward_amount: number | null
          reward_paid: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          completed_at?: string | null
          converted_at?: string | null
          created_at?: string
          first_payment_at?: string | null
          id?: string
          referee_avg_rating?: number | null
          referee_monthly_payment?: number | null
          referee_order_count?: number | null
          referee_role?: string | null
          referee_subscription_tier?: string | null
          referee_user_id?: string | null
          referral_code: string
          referrer_role: string
          referrer_user_id: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          bonus_paid?: boolean | null
          bonus_paid_at?: string | null
          completed_at?: string | null
          converted_at?: string | null
          created_at?: string
          first_payment_at?: string | null
          id?: string
          referee_avg_rating?: number | null
          referee_monthly_payment?: number | null
          referee_order_count?: number | null
          referee_role?: string | null
          referee_subscription_tier?: string | null
          referee_user_id?: string | null
          referral_code?: string
          referrer_role?: string
          referrer_user_id?: string
          reward_amount?: number | null
          reward_paid?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rls_access_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          ip_address: string | null
          operation: string
          policy_name: string | null
          request_metadata: Json | null
          table_name: string
          user_agent: string | null
          user_id: string | null
          user_role: string | null
          was_denied: boolean
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          operation: string
          policy_name?: string | null
          request_metadata?: Json | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          was_denied?: boolean
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          ip_address?: string | null
          operation?: string
          policy_name?: string | null
          request_metadata?: Json | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
          user_role?: string | null
          was_denied?: boolean
        }
        Relationships: []
      }
      rls_alert_settings: {
        Row: {
          alert_cooldown_minutes: number
          created_at: string
          denial_threshold: number
          id: string
          is_active: boolean
          last_alert_at: string | null
          merchant_id: string | null
          updated_at: string
          window_minutes: number
        }
        Insert: {
          alert_cooldown_minutes?: number
          created_at?: string
          denial_threshold?: number
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          merchant_id?: string | null
          updated_at?: string
          window_minutes?: number
        }
        Update: {
          alert_cooldown_minutes?: number
          created_at?: string
          denial_threshold?: number
          id?: string
          is_active?: boolean
          last_alert_at?: string | null
          merchant_id?: string | null
          updated_at?: string
          window_minutes?: number
        }
        Relationships: [
          {
            foreignKeyName: "rls_alert_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rls_alert_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rls_alert_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rls_alert_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rls_alert_settings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_acknowledgements: {
        Row: {
          acknowledged_at: string | null
          id: string
          rule_id: string
          tenant_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          id?: string
          rule_id: string
          tenant_id: string
        }
        Update: {
          acknowledged_at?: string | null
          id?: string
          rule_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rule_acknowledgements_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "rules"
            referencedColumns: ["id"]
          },
        ]
      }
      rule_types: {
        Row: {
          category: string | null
          created_at: string | null
          default_scope: string | null
          id: string
          merchant_id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_scope?: string | null
          id?: string
          merchant_id: string
          name: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_scope?: string | null
          id?: string
          merchant_id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rule_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rule_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rule_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rule_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rule_types_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      rules: {
        Row: {
          created_at: string | null
          description: string | null
          effective_from: string | null
          effective_until: string | null
          id: string
          is_active: boolean | null
          is_overridable: boolean | null
          merchant_id: string
          property_id: string
          rule_type_id: string | null
          title: string
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          is_overridable?: boolean | null
          merchant_id: string
          property_id: string
          rule_type_id?: string | null
          title: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          effective_from?: string | null
          effective_until?: string | null
          id?: string
          is_active?: boolean | null
          is_overridable?: boolean | null
          merchant_id?: string
          property_id?: string
          rule_type_id?: string | null
          title?: string
          unit_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_rule_type_id_fkey"
            columns: ["rule_type_id"]
            isOneToOne: false
            referencedRelation: "rule_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rules_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          created_at: string
          damage_cost: number | null
          description: string | null
          id: string
          incident_date: string
          incident_type: string
          location_detail: string | null
          merchant_id: string
          police_report_number: string | null
          property_id: string
          reported_by: string | null
          resolution: string | null
          resolved_at: string | null
          severity: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          damage_cost?: number | null
          description?: string | null
          id?: string
          incident_date: string
          incident_type: string
          location_detail?: string | null
          merchant_id: string
          police_report_number?: string | null
          property_id: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          damage_cost?: number | null
          description?: string | null
          id?: string
          incident_date?: string
          incident_type?: string
          location_detail?: string | null
          merchant_id?: string
          police_report_number?: string | null
          property_id?: string
          reported_by?: string | null
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "security_incidents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "security_incidents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "security_incidents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          amount: number
          attempt_count: number | null
          billing_period_end: string
          billing_period_start: string
          created_at: string
          due_date: string
          failure_reason: string | null
          id: string
          invoice_number: string | null
          last_attempt_at: string | null
          merchant_id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string | null
          tier_id: string
          updated_at: string
          xendit_invoice_id: string | null
          xendit_payment_url: string | null
        }
        Insert: {
          amount: number
          attempt_count?: number | null
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          due_date: string
          failure_reason?: string | null
          id?: string
          invoice_number?: string | null
          last_attempt_at?: string | null
          merchant_id: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tier_id: string
          updated_at?: string
          xendit_invoice_id?: string | null
          xendit_payment_url?: string | null
        }
        Update: {
          amount?: number
          attempt_count?: number | null
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          due_date?: string
          failure_reason?: string | null
          id?: string
          invoice_number?: string | null
          last_attempt_at?: string | null
          merchant_id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string | null
          tier_id?: string
          updated_at?: string
          xendit_invoice_id?: string | null
          xendit_payment_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "merchant_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_invoices_tier_id_fkey"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "subscription_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_tiers: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          features: Json | null
          id: string
          is_active: boolean | null
          max_properties: number
          max_tenants: number
          max_units: number
          name: string
          price_monthly: number
          price_yearly: number | null
          sort_order: number | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_properties?: number
          max_tenants?: number
          max_units?: number
          name: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          max_properties?: number
          max_tenants?: number
          max_units?: number
          name?: string
          price_monthly?: number
          price_yearly?: number | null
          sort_order?: number | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      tenant_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          merchant_id: string
          phone: string | null
          property_id: string | null
          status: string | null
          token: string
          unit_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          merchant_id: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
          token?: string
          unit_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          merchant_id?: string
          phone?: string | null
          property_id?: string | null
          status?: string | null
          token?: string
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_invitations_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
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
      tenant_merchant_history: {
        Row: {
          contract_ids: string[] | null
          created_at: string | null
          end_date: string | null
          id: string
          merchant_id: string
          start_date: string
          status: string
          tenant_user_id: string
          transfer_reason: string | null
          updated_at: string | null
        }
        Insert: {
          contract_ids?: string[] | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          merchant_id: string
          start_date: string
          status?: string
          tenant_user_id: string
          transfer_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          contract_ids?: string[] | null
          created_at?: string | null
          end_date?: string | null
          id?: string
          merchant_id?: string
          start_date?: string
          status?: string
          tenant_user_id?: string
          transfer_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_merchant_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_merchant_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_merchant_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_merchant_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_merchant_history_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_payment_metrics: {
        Row: {
          avg_days_late: number | null
          calculated_at: string
          created_at: string
          current_streak_on_time: number | null
          first_invoice_date: string | null
          id: string
          last_invoice_date: string | null
          longest_streak_on_time: number | null
          merchant_id: string
          paid_late: number
          paid_on_time: number
          payment_score: number | null
          renewal_count: number
          tenant_user_id: string
          total_invoices: number
          total_late_fees: number | null
          total_tenure_months: number
          unpaid: number
          updated_at: string
        }
        Insert: {
          avg_days_late?: number | null
          calculated_at?: string
          created_at?: string
          current_streak_on_time?: number | null
          first_invoice_date?: string | null
          id?: string
          last_invoice_date?: string | null
          longest_streak_on_time?: number | null
          merchant_id: string
          paid_late?: number
          paid_on_time?: number
          payment_score?: number | null
          renewal_count?: number
          tenant_user_id: string
          total_invoices?: number
          total_late_fees?: number | null
          total_tenure_months?: number
          unpaid?: number
          updated_at?: string
        }
        Update: {
          avg_days_late?: number | null
          calculated_at?: string
          created_at?: string
          current_streak_on_time?: number | null
          first_invoice_date?: string | null
          id?: string
          last_invoice_date?: string | null
          longest_streak_on_time?: number | null
          merchant_id?: string
          paid_late?: number
          paid_on_time?: number
          payment_score?: number | null
          renewal_count?: number
          tenant_user_id?: string
          total_invoices?: number
          total_late_fees?: number | null
          total_tenure_months?: number
          unpaid?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_payment_metrics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_payment_metrics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_payment_metrics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_payment_metrics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_payment_metrics_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_risk_scores: {
        Row: {
          average_days_late: number | null
          contract_compliance_score: number | null
          created_at: string
          factors: Json | null
          id: string
          late_payment_count: number | null
          merchant_id: string
          ml_model_run_id: string | null
          payment_history_score: number | null
          risk_level: string
          risk_score: number
          tenant_user_id: string
          total_outstanding: number | null
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          average_days_late?: number | null
          contract_compliance_score?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          late_payment_count?: number | null
          merchant_id: string
          ml_model_run_id?: string | null
          payment_history_score?: number | null
          risk_level?: string
          risk_score?: number
          tenant_user_id: string
          total_outstanding?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          average_days_late?: number | null
          contract_compliance_score?: number | null
          created_at?: string
          factors?: Json | null
          id?: string
          late_payment_count?: number | null
          merchant_id?: string
          ml_model_run_id?: string | null
          payment_history_score?: number | null
          risk_level?: string
          risk_score?: number
          tenant_user_id?: string
          total_outstanding?: number | null
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenant_risk_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_risk_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_risk_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenant_risk_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_risk_scores_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_risk_scores_ml_model_run_id_fkey"
            columns: ["ml_model_run_id"]
            isOneToOne: false
            referencedRelation: "ml_model_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          age_group: string | null
          auto_pay_day: number | null
          auto_pay_enabled: boolean | null
          created_at: string
          current_unit_id: string | null
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          gender: string | null
          id: string
          income_range: string | null
          institution: string | null
          ktp_number: string | null
          ktp_photo_url: string | null
          linked_merchant_id: string | null
          notes: string | null
          notification_preferences: Json | null
          occupation: string | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          age_group?: string | null
          auto_pay_day?: number | null
          auto_pay_enabled?: boolean | null
          created_at?: string
          current_unit_id?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
          institution?: string | null
          ktp_number?: string | null
          ktp_photo_url?: string | null
          linked_merchant_id?: string | null
          notes?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          age_group?: string | null
          auto_pay_day?: number | null
          auto_pay_enabled?: boolean | null
          created_at?: string
          current_unit_id?: string | null
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
          institution?: string | null
          ktp_number?: string | null
          ktp_photo_url?: string | null
          linked_merchant_id?: string | null
          notes?: string | null
          notification_preferences?: Json | null
          occupation?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tenants_current_unit_id_fkey"
            columns: ["current_unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_assets: {
        Row: {
          asset_name: string
          barcode_data: string | null
          brand: string | null
          category: string | null
          condition: string | null
          created_at: string | null
          id: string
          merchant_id: string
          model: string | null
          notes: string | null
          photo_url: string | null
          serial_number: string | null
          unit_id: string
          updated_at: string | null
        }
        Insert: {
          asset_name: string
          barcode_data?: string | null
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          merchant_id: string
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          serial_number?: string | null
          unit_id: string
          updated_at?: string | null
        }
        Update: {
          asset_name?: string
          barcode_data?: string | null
          brand?: string | null
          category?: string | null
          condition?: string | null
          created_at?: string | null
          id?: string
          merchant_id?: string
          model?: string | null
          notes?: string | null
          photo_url?: string | null
          serial_number?: string | null
          unit_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_assets_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_assets_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_facilities: {
        Row: {
          condition: string | null
          created_at: string | null
          facility_id: string
          id: string
          installed_date: string | null
          notes: string | null
          quantity: number | null
          unit_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          facility_id: string
          id?: string
          installed_date?: string | null
          notes?: string | null
          quantity?: number | null
          unit_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          facility_id?: string
          id?: string
          installed_date?: string | null
          notes?: string | null
          quantity?: number | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_facilities_facility_id_fkey"
            columns: ["facility_id"]
            isOneToOne: false
            referencedRelation: "facilities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_facilities_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      unit_listings: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          inquiries: number | null
          listed_at: string | null
          merchant_id: string
          monthly_rent: number
          photos: string[] | null
          promoted: boolean | null
          status: string | null
          unit_id: string
          updated_at: string | null
          views: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          inquiries?: number | null
          listed_at?: string | null
          merchant_id: string
          monthly_rent: number
          photos?: string[] | null
          promoted?: boolean | null
          status?: string | null
          unit_id: string
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          inquiries?: number | null
          listed_at?: string | null
          merchant_id?: string
          monthly_rent?: number
          photos?: string[] | null
          promoted?: boolean | null
          status?: string | null
          unit_id?: string
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "unit_listings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_listings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_listings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "unit_listings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_listings_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_listings_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          additional_costs: Json | null
          amenities: string[] | null
          available_from: string | null
          created_at: string
          deposit_amount: number | null
          description: string | null
          electricity_cost: number | null
          electricity_cost_type: string | null
          electricity_included: boolean | null
          floor: number | null
          id: string
          is_listed: boolean | null
          occupancy_type: string | null
          photos: string[] | null
          property_id: string
          rent_amount: number
          size_sqm: number | null
          status: string | null
          unit_number: string
          unit_type: string | null
          updated_at: string
          vacant_since: string | null
          water_cost: number | null
          water_cost_type: string | null
          water_included: boolean | null
          wifi_cost: number | null
          wifi_cost_sharing: string | null
          wifi_included: boolean | null
          wifi_speed_mbps: number | null
        }
        Insert: {
          additional_costs?: Json | null
          amenities?: string[] | null
          available_from?: string | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          electricity_cost?: number | null
          electricity_cost_type?: string | null
          electricity_included?: boolean | null
          floor?: number | null
          id?: string
          is_listed?: boolean | null
          occupancy_type?: string | null
          photos?: string[] | null
          property_id: string
          rent_amount: number
          size_sqm?: number | null
          status?: string | null
          unit_number: string
          unit_type?: string | null
          updated_at?: string
          vacant_since?: string | null
          water_cost?: number | null
          water_cost_type?: string | null
          water_included?: boolean | null
          wifi_cost?: number | null
          wifi_cost_sharing?: string | null
          wifi_included?: boolean | null
          wifi_speed_mbps?: number | null
        }
        Update: {
          additional_costs?: Json | null
          amenities?: string[] | null
          available_from?: string | null
          created_at?: string
          deposit_amount?: number | null
          description?: string | null
          electricity_cost?: number | null
          electricity_cost_type?: string | null
          electricity_included?: boolean | null
          floor?: number | null
          id?: string
          is_listed?: boolean | null
          occupancy_type?: string | null
          photos?: string[] | null
          property_id?: string
          rent_amount?: number
          size_sqm?: number | null
          status?: string | null
          unit_number?: string
          unit_type?: string | null
          updated_at?: string
          vacant_since?: string | null
          water_cost?: number | null
          water_cost_type?: string | null
          water_included?: boolean | null
          wifi_cost?: number | null
          wifi_cost_sharing?: string | null
          wifi_included?: boolean | null
          wifi_speed_mbps?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "units_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "v_properties_with_addresses"
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
      vendor_bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          bank_name: string
          branch_code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_code?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_bank_accounts_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_earnings: {
        Row: {
          amount: number
          created_at: string
          fee_amount: number
          id: string
          net_amount: number
          paid_at: string | null
          status: string
          updated_at: string
          vendor_id: string
          vendor_job_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fee_amount?: number
          id?: string
          net_amount: number
          paid_at?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
          vendor_job_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fee_amount?: number
          id?: string
          net_amount?: number
          paid_at?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
          vendor_job_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_earnings_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_earnings_vendor_job_id_fkey"
            columns: ["vendor_job_id"]
            isOneToOne: false
            referencedRelation: "vendor_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_jobs: {
        Row: {
          agreed_price: number | null
          completed_at: string | null
          created_at: string
          id: string
          maintenance_request_id: string
          merchant_id: string
          notes: string | null
          quoted_price: number | null
          started_at: string | null
          status: string
          updated_at: string
          vendor_id: string
        }
        Insert: {
          agreed_price?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          maintenance_request_id: string
          merchant_id: string
          notes?: string | null
          quoted_price?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vendor_id: string
        }
        Update: {
          agreed_price?: number | null
          completed_at?: string | null
          created_at?: string
          id?: string
          maintenance_request_id?: string
          merchant_id?: string
          notes?: string | null
          quoted_price?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_jobs_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "vendor_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "vendor_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "vendor_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_jobs_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_verifications: {
        Row: {
          created_at: string
          document_type: string
          document_url: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          document_url: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          document_url?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_verifications_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
          disbursement_schedule: string | null
          id: string
          min_payout_threshold: number | null
          notification_settings: Json | null
          province: string | null
          rating: number | null
          referral_earnings: number | null
          referred_by: string | null
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
          disbursement_schedule?: string | null
          id?: string
          min_payout_threshold?: number | null
          notification_settings?: Json | null
          province?: string | null
          rating?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
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
          disbursement_schedule?: string | null
          id?: string
          min_payout_threshold?: number | null
          notification_settings?: Json | null
          province?: string | null
          rating?: number | null
          referral_earnings?: number | null
          referred_by?: string | null
          service_categories?: string[] | null
          total_jobs?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          applicable_to: string | null
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean | null
          max_discount: number | null
          min_order: number | null
          owner_id: string
          referral_id: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          applicable_to?: string | null
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          owner_id: string
          referral_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          applicable_to?: string | null
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_discount?: number | null
          min_order?: number | null
          owner_id?: string
          referral_id?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "vouchers_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      xendit_transactions: {
        Row: {
          amount: number
          callback_data: Json | null
          created_at: string
          expired_at: string | null
          external_id: string
          id: string
          invoice_id: string | null
          order_id: string | null
          paid_at: string | null
          payment_channel: string | null
          payment_id: string | null
          payment_method: string | null
          payment_url: string | null
          qr_code_url: string | null
          status: string
          updated_at: string
          user_id: string
          virtual_account_number: string | null
          xendit_invoice_id: string | null
        }
        Insert: {
          amount: number
          callback_data?: Json | null
          created_at?: string
          expired_at?: string | null
          external_id: string
          id?: string
          invoice_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          qr_code_url?: string | null
          status?: string
          updated_at?: string
          user_id: string
          virtual_account_number?: string | null
          xendit_invoice_id?: string | null
        }
        Update: {
          amount?: number
          callback_data?: Json | null
          created_at?: string
          expired_at?: string | null
          external_id?: string
          id?: string
          invoice_id?: string | null
          order_id?: string | null
          paid_at?: string | null
          payment_channel?: string | null
          payment_id?: string | null
          payment_method?: string | null
          payment_url?: string | null
          qr_code_url?: string | null
          status?: string
          updated_at?: string
          user_id?: string
          virtual_account_number?: string | null
          xendit_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "xendit_transactions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xendit_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      merchant_occupancy_analysis: {
        Row: {
          active_contracts: number | null
          business_name: string | null
          merchant_id: string | null
          monthly_revenue: number | null
          occupancy_rate: number | null
          occupied_units: number | null
          refreshed_at: string | null
          total_properties: number | null
          total_revenue: number | null
          total_units: number | null
        }
        Relationships: []
      }
      merchant_property_summary: {
        Row: {
          active_contracts: number | null
          business_name: string | null
          merchant_id: string | null
          occupied_units: number | null
          property_count: number | null
          subscription_tier: string | null
          total_revenue: number | null
          unit_count: number | null
          verification_status: string | null
        }
        Relationships: []
      }
      merchant_referral_summary: {
        Row: {
          converted_at: string | null
          merchant_id: string | null
          referral_code: string | null
          referral_status: string | null
          referrer_user_id: string | null
          reward_amount: number | null
          total_commissions: number | null
        }
        Relationships: []
      }
      v_maintenance_expenses_with_merchant: {
        Row: {
          created_at: string | null
          currency: string | null
          derived_merchant_id: string | null
          id: string | null
          line_items: Json | null
          maintenance_request_id: string | null
          merchant_id: string | null
          notes: string | null
          ocr_result_id: string | null
          receipt_date: string | null
          receipt_number: string | null
          request_status: string | null
          request_title: string | null
          subtotal: number | null
          tax_amount: number | null
          total_amount: number | null
          updated_at: string | null
          vendor_name: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_expenses_maintenance_request_id_fkey"
            columns: ["maintenance_request_id"]
            isOneToOne: false
            referencedRelation: "maintenance_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_expenses_ocr_result_id_fkey"
            columns: ["ocr_result_id"]
            isOneToOne: false
            referencedRelation: "ocr_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["derived_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["derived_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["derived_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["derived_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_merchant_id_fkey"
            columns: ["derived_merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_merchants_with_addresses: {
        Row: {
          billing_address_id: string | null
          business_name: string | null
          business_type: string | null
          created_at: string | null
          headquarters_address_id: string | null
          id: string | null
          last_disbursement_date: string | null
          merchant_code: string | null
          min_disbursement_amount: number | null
          penalty_rate: number | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_details: string | null
          resolved_address: string | null
          resolved_city: string | null
          resolved_postal_code: string | null
          resolved_province: string | null
          resubmission_count: number | null
          resubmission_instructions: string | null
          search_vector: unknown
          total_disbursed: number | null
          updated_at: string | null
          user_id: string | null
          verification_status: string | null
          verification_submitted_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merchants_address_id_fkey"
            columns: ["headquarters_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merchants_billing_address_id_fkey"
            columns: ["billing_address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      v_properties_with_addresses: {
        Row: {
          address_id: string | null
          amenities: string[] | null
          avg_annual_unexpected_cost: number | null
          building_condition: string | null
          construction_cost: number | null
          construction_year: number | null
          created_at: string | null
          description: string | null
          disaster_risk_level: string | null
          floor_count: number | null
          funding_source: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string | null
          images: string[] | null
          land_ownership: string | null
          marketing_cost: number | null
          merchant_id: string | null
          monthly_amortization: number | null
          monthly_maintenance_cost: number | null
          name: string | null
          nearby_facilities: Json | null
          occupied_units: number | null
          property_code: string | null
          property_type: string | null
          renovation_cost: number | null
          resolved_address: string | null
          resolved_city: string | null
          resolved_latitude: number | null
          resolved_longitude: number | null
          resolved_postal_code: string | null
          resolved_province: string | null
          security_score: number | null
          status: string | null
          total_units: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_occupancy_analysis"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_property_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchant_referral_summary"
            referencedColumns: ["merchant_id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_merchant_id_fkey"
            columns: ["merchant_id"]
            isOneToOne: false
            referencedRelation: "v_merchants_with_addresses"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_sla_deadline: { Args: { priority: string }; Returns: string }
      check_phone_unique_per_role: {
        Args: {
          _exclude_user_id?: string
          _phone: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      generate_merchant_code: { Args: never; Returns: string }
      generate_property_code: { Args: never; Returns: string }
      generate_voucher_code: { Args: never; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"][]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_merchant_analytics: {
        Args: { p_merchant_id?: string }
        Returns: undefined
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
