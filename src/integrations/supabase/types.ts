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
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          billing_day: number | null
          churn_reason: string | null
          contract_document_url: string | null
          created_at: string
          deposit_amount: number | null
          end_date: string
          grace_period_days: number | null
          id: string
          late_fee_type: string | null
          late_payment_penalty_rate: number | null
          merchant_id: string
          merchant_signature_url: string | null
          merchant_signed_at: string | null
          referral_bonus_amount: number | null
          referral_bonus_applied: boolean | null
          rent_amount: number
          signature_status: string | null
          start_date: string
          status: string | null
          tenant_signature_url: string | null
          tenant_signed_at: string | null
          tenant_user_id: string
          terms: string | null
          unit_id: string
          updated_at: string
        }
        Insert: {
          billing_day?: number | null
          churn_reason?: string | null
          contract_document_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          end_date: string
          grace_period_days?: number | null
          id?: string
          late_fee_type?: string | null
          late_payment_penalty_rate?: number | null
          merchant_id: string
          merchant_signature_url?: string | null
          merchant_signed_at?: string | null
          referral_bonus_amount?: number | null
          referral_bonus_applied?: boolean | null
          rent_amount: number
          signature_status?: string | null
          start_date: string
          status?: string | null
          tenant_signature_url?: string | null
          tenant_signed_at?: string | null
          tenant_user_id: string
          terms?: string | null
          unit_id: string
          updated_at?: string
        }
        Update: {
          billing_day?: number | null
          churn_reason?: string | null
          contract_document_url?: string | null
          created_at?: string
          deposit_amount?: number | null
          end_date?: string
          grace_period_days?: number | null
          id?: string
          late_fee_type?: string | null
          late_payment_penalty_rate?: number | null
          merchant_id?: string
          merchant_signature_url?: string | null
          merchant_signed_at?: string | null
          referral_bonus_amount?: number | null
          referral_bonus_applied?: boolean | null
          rent_amount?: number
          signature_status?: string | null
          start_date?: string
          status?: string | null
          tenant_signature_url?: string | null
          tenant_signed_at?: string | null
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
          id: string
          images: string[] | null
          merchant_id: string
          preferred_schedule: string | null
          priority: string
          resolved_at: string | null
          sla_deadline: string | null
          started_at: string | null
          status: string
          tenant_user_id: string
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
          id?: string
          images?: string[] | null
          merchant_id: string
          preferred_schedule?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_user_id: string
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
          id?: string
          images?: string[] | null
          merchant_id?: string
          preferred_schedule?: string | null
          priority?: string
          resolved_at?: string | null
          sla_deadline?: string | null
          started_at?: string | null
          status?: string
          tenant_user_id?: string
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
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
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
          billing_day: number | null
          business_name: string
          business_type: string | null
          city: string | null
          created_at: string
          disbursement_schedule: string | null
          id: string
          last_disbursement_date: string | null
          merchant_code: string | null
          min_disbursement_amount: number | null
          penalty_rate: number | null
          postal_code: string | null
          province: string | null
          referral_discount: number | null
          referral_discount_months: number | null
          referred_by: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_details: string | null
          resubmission_count: number | null
          resubmission_instructions: string | null
          subscription_tier: string | null
          total_disbursed: number | null
          updated_at: string
          user_id: string
          verification_status: string | null
          verification_submitted_at: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          address?: string | null
          billing_day?: number | null
          business_name: string
          business_type?: string | null
          city?: string | null
          created_at?: string
          disbursement_schedule?: string | null
          id?: string
          last_disbursement_date?: string | null
          merchant_code?: string | null
          min_disbursement_amount?: number | null
          penalty_rate?: number | null
          postal_code?: string | null
          province?: string | null
          referral_discount?: number | null
          referral_discount_months?: number | null
          referred_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_details?: string | null
          resubmission_count?: number | null
          resubmission_instructions?: string | null
          subscription_tier?: string | null
          total_disbursed?: number | null
          updated_at?: string
          user_id: string
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          address?: string | null
          billing_day?: number | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          created_at?: string
          disbursement_schedule?: string | null
          id?: string
          last_disbursement_date?: string | null
          merchant_code?: string | null
          min_disbursement_amount?: number | null
          penalty_rate?: number | null
          postal_code?: string | null
          province?: string | null
          referral_discount?: number | null
          referral_discount_months?: number | null
          referred_by?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_details?: string | null
          resubmission_count?: number | null
          resubmission_instructions?: string | null
          subscription_tier?: string | null
          total_disbursed?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: string | null
          verification_submitted_at?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
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
      tenants: {
        Row: {
          auto_pay_day: number | null
          auto_pay_enabled: boolean | null
          created_at: string
          date_of_birth: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          gender: string | null
          id: string
          income_range: string | null
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
          auto_pay_day?: number | null
          auto_pay_enabled?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
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
          auto_pay_day?: number | null
          auto_pay_enabled?: boolean | null
          created_at?: string
          date_of_birth?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          gender?: string | null
          id?: string
          income_range?: string | null
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
            foreignKeyName: "tenants_linked_merchant_id_fkey"
            columns: ["linked_merchant_id"]
            isOneToOne: false
            referencedRelation: "merchants"
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
            referencedRelation: "merchants"
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
      [_ in never]: never
    }
    Functions: {
      calculate_sla_deadline: { Args: { priority: string }; Returns: string }
      generate_merchant_code: { Args: never; Returns: string }
      generate_voucher_code: { Args: never; Returns: string }
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
