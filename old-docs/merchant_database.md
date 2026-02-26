# Merchant Database - Class Diagram & Schema Reference

Diagram lengkap semua tabel dan relasi FK yang terintegrasi dengan merchant, dikelompokkan per domain.
**Last updated**: 2026-02-26 (post-refactoring 1.1–1.7)

```mermaid
classDiagram
    direction TB

    %% ============================================
    %% SHARED / LOOKUP
    %% ============================================
    class addresses {
        UUID id PK
        TEXT street_address
        TEXT city
        TEXT province
        TEXT postal_code
        FLOAT latitude
        FLOAT longitude
        TEXT address_type
        TIMESTAMPTZ created_at
    }

    %% ============================================
    %% CORE MERCHANT
    %% ============================================
    class merchants {
        UUID id PK
        UUID user_id FK
        TEXT business_name
        TEXT business_type
        TEXT merchant_code
        TEXT verification_status
        UUID headquarters_address_id FK
        UUID billing_address_id FK
        TSVECTOR search_vector
        NUMERIC penalty_rate
        NUMERIC total_disbursed
        DATE last_disbursement_date
        NUMERIC min_disbursement_amount
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% VERIFIKASI & SUBSCRIPTION
    %% ============================================
    class merchant_verifications {
        UUID id PK
        UUID merchant_id FK
        TEXT document_type
        TEXT document_url
        TEXT status
        TEXT rejection_reason
        TIMESTAMPTZ reviewed_at
        UUID reviewed_by
        TIMESTAMPTZ created_at
    }

    class merchant_verification_history {
        UUID id PK
        UUID merchant_id FK
        TEXT action
        TEXT old_status
        TEXT new_status
        UUID performed_by
        TEXT approval_notes
        TEXT rejection_reason
        TEXT rejection_details
        TEXT resubmission_instructions
        TIMESTAMPTZ created_at
    }

    class subscription_tiers {
        UUID id PK
        TEXT name
        NUMERIC price
        TEXT billing_cycle
        INT max_properties
        INT max_units
        JSONB features
        BOOL is_active
        INT trial_days
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class merchant_subscriptions {
        UUID id PK
        UUID merchant_id FK
        UUID tier_id FK
        TEXT status
        TEXT payment_status
        TEXT payment_method
        TIMESTAMPTZ current_period_start
        TIMESTAMPTZ current_period_end
        TIMESTAMPTZ next_billing_date
        TIMESTAMPTZ trial_ends_at
        TIMESTAMPTZ grace_period_end
        INT failed_attempts
        TEXT cancellation_reason
        TIMESTAMPTZ cancellation_requested_at
        TIMESTAMPTZ cancellation_effective_date
        TIMESTAMPTZ canceled_at
        TEXT xendit_recurring_id
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class subscription_invoices {
        UUID id PK
        UUID subscription_id FK
        TEXT invoice_number
        NUMERIC amount
        TEXT status
        TIMESTAMPTZ due_date
        TIMESTAMPTZ paid_at
        TEXT payment_method
        TEXT xendit_invoice_id
        TIMESTAMPTZ created_at
    }

    class cancellation_feedback {
        UUID id PK
        UUID merchant_id FK
        UUID subscription_id FK
        TEXT reason
        TEXT feedback
        BOOL would_return
        TIMESTAMPTZ created_at
    }

    class subscription_changes {
        UUID id PK
        UUID merchant_id FK
        UUID from_tier_id FK
        UUID to_tier_id FK
        TEXT change_type
        TEXT status
        TIMESTAMPTZ effective_date
        TIMESTAMPTZ applied_at
        TIMESTAMPTZ cancelled_at
        TEXT cancellation_reason
        TEXT reason
        UUID requested_by FK
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class merchant_feedback {
        UUID id PK
        UUID user_id FK
        UUID merchant_id FK
        TEXT category
        TEXT message
        INT rating
        TEXT screenshot_url
        TEXT status
        TEXT admin_response
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% PROPERTI & UNIT
    %% ============================================
    class properties {
        UUID id PK
        UUID merchant_id FK
        UUID address_id FK
        TEXT name
        TEXT property_type
        TEXT description
        TEXT[] images
        TEXT[] amenities
        INT total_units
        INT occupied_units
        TEXT status
        TEXT guardian_name
        TEXT guardian_phone
        NUMERIC marketing_cost
        INT construction_year
        INT floor_count
        TEXT building_condition
        TEXT land_ownership
        JSONB nearby_facilities
        NUMERIC construction_cost
        NUMERIC renovation_cost
        TEXT funding_source
        NUMERIC monthly_amortization
        NUMERIC monthly_maintenance_cost
        NUMERIC avg_annual_unexpected_cost
        NUMERIC security_score
        TEXT disaster_risk_level
        TEXT property_code
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class units {
        UUID id PK
        UUID property_id FK
        TEXT unit_number
        TEXT unit_type
        INT floor
        NUMERIC size_sqm
        NUMERIC rent_amount
        NUMERIC deposit_amount
        TEXT status
        TEXT description
        TEXT[] amenities
        TEXT[] photos
        TEXT occupancy_type
        BOOL electricity_included
        NUMERIC electricity_cost
        TEXT electricity_cost_type
        BOOL water_included
        NUMERIC water_cost
        TEXT water_cost_type
        BOOL wifi_included
        INT wifi_speed_mbps
        TEXT wifi_cost_sharing
        NUMERIC wifi_cost
        JSONB additional_costs
        BOOL is_listed
        DATE available_from
        DATE vacant_since
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class property_guardians {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT name
        TEXT phone
        TEXT address
        TEXT id_number
        NUMERIC salary
        TEXT salary_frequency
        DATE start_date
        DATE end_date
        TEXT status
        TEXT notes
        TEXT photo_url
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class guardian_property_assignments {
        UUID id PK
        UUID guardian_id FK
        UUID property_id FK
        TEXT role
        TEXT status
        DATE assigned_date
        TIMESTAMPTZ created_at
    }

    class property_nearby_facilities {
        UUID id PK
        UUID property_id FK
        TEXT facility_type
        TEXT facility_name
        INT distance_meters
        FLOAT latitude
        FLOAT longitude
        TIMESTAMPTZ created_at
    }

    class property_renovations {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT category
        TEXT description
        NUMERIC cost
        DATE renovation_date
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class property_vendor_services {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        UUID vendor_id FK
        TEXT service_type
        NUMERIC monthly_fee
        TEXT status
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class property_data_versions {
        UUID id PK
        TEXT entity_type
        UUID entity_id
        JSONB snapshot
        TEXT change_summary
        UUID created_by
        TIMESTAMPTZ created_at
    }

    class property_facilities {
        UUID id PK
        UUID property_id FK
        UUID facility_id FK
        INT quantity
        TEXT condition
        DATE installed_date
        TEXT notes
        TIMESTAMPTZ created_at
    }

    class compliance_documents {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT document_name
        TEXT document_type
        TEXT document_url
        TEXT status
        DATE issue_date
        DATE expiry_date
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class disaster_risk_profiles {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT risk_zone
        TEXT flood_risk
        TEXT earthquake_risk
        TEXT fire_risk
        TEXT landslide_risk
        NUMERIC overall_risk_score
        JSONB disaster_history
        JSONB mitigation_systems
        TEXT notes
        TIMESTAMPTZ last_assessed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class security_incidents {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT incident_type
        TEXT severity
        TEXT description
        TEXT resolution
        TIMESTAMPTZ incident_date
        TIMESTAMPTZ resolved_at
        TEXT reported_by
        TEXT[] photos
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class insurance_policies {
        UUID id PK
        UUID property_id FK
        UUID merchant_id FK
        TEXT policy_number
        TEXT policy_type
        TEXT provider
        NUMERIC coverage_amount
        NUMERIC premium_amount
        TEXT premium_frequency
        JSONB coverage_details
        DATE start_date
        DATE end_date
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class insurance_claims {
        UUID id PK
        UUID policy_id FK
        UUID merchant_id FK
        TEXT incident_type
        DATE incident_date
        DATE claim_date
        NUMERIC claim_amount
        NUMERIC approved_amount
        TEXT description
        JSONB documents
        TEXT status
        TEXT resolution_notes
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% INVENTORI (3-Tier)
    %% ============================================
    class facility_types {
        UUID id PK
        UUID merchant_id FK
        TEXT name
        TEXT nature
        TEXT scope
        TEXT asset_type
        BOOL is_trackable
        INT default_useful_life_months
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class assets {
        UUID id PK
        UUID facility_type_id FK
        UUID merchant_id FK
        UUID property_id FK
        UUID unit_id FK
        TEXT serial_number
        TEXT brand
        TEXT condition
        TEXT status
        NUMERIC purchase_price
        NUMERIC salvage_value
        INT useful_life_months
        DATE purchase_date
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class facility_assignments {
        UUID id PK
        UUID facility_type_id FK
        UUID property_id FK
        UUID unit_id FK
        INT capacity
        TEXT notes
        TIMESTAMPTZ created_at
    }

    class facilities {
        UUID id PK
        UUID merchant_id FK
        TEXT name
        TEXT category
        TEXT asset_type
        TEXT brand
        NUMERIC purchase_price
        NUMERIC salvage_value
        INT useful_life_months
        DATE purchase_date
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% PERATURAN
    %% ============================================
    class rule_types {
        UUID id PK
        UUID merchant_id FK
        TEXT name
        TEXT category
        TEXT default_scope
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class rules {
        UUID id PK
        UUID merchant_id FK
        UUID property_id FK
        UUID unit_id FK
        UUID rule_type_id FK
        TEXT title
        TEXT description
        BOOL is_active
        BOOL is_overridable
        DATE effective_from
        DATE effective_until
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class rule_acknowledgements {
        UUID id PK
        UUID rule_id FK
        UUID tenant_id
        TIMESTAMPTZ acknowledged_at
    }

    %% ============================================
    %% KONTRAK & TENANT
    %% ============================================
    class contracts {
        UUID id PK
        UUID merchant_id FK
        UUID unit_id FK
        UUID tenant_user_id FK
        TEXT contract_number
        NUMERIC rent_amount
        NUMERIC deposit_amount
        DATE start_date
        DATE end_date
        DATE actual_end_date
        TEXT status
        TEXT signature_status
        TEXT terms
        TEXT payment_frequency
        INT billing_day
        INT notice_period_days
        INT grace_period_days
        NUMERIC late_payment_penalty_rate
        TEXT late_fee_type
        NUMERIC early_termination_penalty_rate
        NUMERIC termination_penalty
        TEXT churn_reason
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class tenant_invitations {
        UUID id PK
        UUID merchant_id FK
        UUID unit_id FK
        TEXT email
        TEXT phone
        TEXT tenant_name
        TEXT status
        TEXT invitation_code
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ accepted_at
        UUID accepted_by
        TIMESTAMPTZ created_at
    }

    class tenant_merchant_history {
        UUID id PK
        UUID tenant_user_id FK
        UUID merchant_id FK
        UUID contract_id FK
        TEXT status
        INT rating
        TEXT notes
        TIMESTAMPTZ created_at
    }

    class move_out_notices {
        UUID id PK
        UUID contract_id FK
        UUID tenant_user_id FK
        DATE intended_move_out_date
        DATE notice_date
        TEXT reason
        TEXT status
        BOOL is_early_termination
        TEXT notes
        TIMESTAMPTZ acknowledged_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class move_out_inspections {
        UUID id PK
        UUID move_out_notice_id FK
        UUID inspector_id
        DATE scheduled_date
        TEXT status
        JSONB inspection_report
        JSONB deduction_details
        NUMERIC total_deductions
        NUMERIC deposit_refund_amount
        TEXT[] photos
        BOOL tenant_confirmed
        TEXT tenant_signature
        TEXT inspector_signature
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class move_out_tasks {
        UUID id PK
        UUID move_out_notice_id FK
        TEXT task_name
        TEXT description
        BOOL completed
        INT order_index
        DATE due_date
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
    }

    class move_out_timeline {
        UUID id PK
        UUID move_out_notice_id FK
        TEXT step
        BOOL completed
        TEXT notes
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
    }

    class deposit_refunds {
        UUID id PK
        UUID contract_id FK
        UUID inspection_id FK
        UUID tenant_user_id FK
        NUMERIC original_deposit
        NUMERIC deductions
        NUMERIC refund_amount
        JSONB deduction_details
        TEXT status
        DATE due_date
        TEXT bank_name
        TEXT bank_account_number
        TEXT account_holder_name
        TEXT xendit_disbursement_id
        TIMESTAMPTZ refunded_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class deposit_disputes {
        UUID id PK
        UUID deposit_refund_id FK
        UUID tenant_user_id FK
        TEXT dispute_reason
        NUMERIC disputed_amount
        TEXT[] evidence_photos
        TEXT merchant_response
        TEXT status
        TEXT resolution
        NUMERIC resolved_amount
        UUID resolved_by
        TEXT admin_notes
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class early_termination_requests {
        UUID id PK
        UUID contract_id FK
        UUID tenant_user_id FK
        DATE requested_date
        TEXT reason
        NUMERIC penalty_amount
        NUMERIC counter_offer_amount
        TEXT merchant_response
        TEXT status
        TEXT[] supporting_docs
        TIMESTAMPTZ approved_at
        TIMESTAMPTZ denied_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class disputes {
        UUID id PK
        UUID merchant_id FK
        UUID tenant_user_id FK
        UUID contract_id FK
        TEXT title
        TEXT description
        TEXT priority
        TEXT status
        TEXT resolution
        UUID resolved_by
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% BILLING & KEUANGAN
    %% ============================================
    class invoices {
        UUID id PK
        UUID contract_id FK
        UUID merchant_id FK
        UUID tenant_user_id FK
        UUID property_id FK
        UUID unit_id FK
        TEXT invoice_number
        NUMERIC amount
        NUMERIC original_amount
        NUMERIC tax_amount
        NUMERIC total_amount
        NUMERIC late_fee
        JSONB line_items
        TEXT description
        TEXT status
        DATE due_date
        TEXT tenant_name
        TEXT unit_number
        BOOL grace_period_active
        TIMESTAMPTZ overdue_since
        TIMESTAMPTZ late_fee_applied_at
        TIMESTAMPTZ issued_at
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class invoice_status_history {
        UUID id PK
        UUID invoice_id FK
        TEXT old_status
        TEXT new_status
        TEXT changed_by
        TIMESTAMPTZ created_at
    }

    class payments {
        UUID id PK
        UUID invoice_id FK
        UUID tenant_user_id FK
        NUMERIC amount
        TEXT payment_method
        TEXT status
        TEXT reference
        TEXT notes
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ created_at
    }

    class payment_plans {
        UUID id PK
        UUID invoice_id FK
        UUID merchant_id FK
        UUID tenant_user_id FK
        TEXT plan_type
        NUMERIC original_amount
        NUMERIC installment_amount
        INT installment_count
        TEXT frequency
        DATE start_date
        TEXT status
        TEXT terms
        NUMERIC waived_amount
        BOOL late_fee_waived
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ defaulted_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class payment_plan_installments {
        UUID id PK
        UUID payment_plan_id FK
        UUID invoice_id FK
        INT installment_number
        NUMERIC amount
        DATE due_date
        TEXT status
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ created_at
    }

    class late_fee_records {
        UUID id PK
        UUID invoice_id FK
        NUMERIC original_amount
        NUMERIC late_fee_amount
        INT days_overdue
        TEXT calculation_method
        TIMESTAMPTZ applied_at
        TIMESTAMPTZ created_at
    }

    class collections_cases {
        UUID id PK
        UUID invoice_id FK
        UUID merchant_id FK
        UUID tenant_user_id FK
        NUMERIC total_due
        INT days_overdue
        INT escalation_level
        TEXT status
        TEXT notes
        TEXT resolution_type
        DATE next_action_date
        TIMESTAMPTZ last_contact_at
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class payment_verifications {
        UUID id PK
        UUID merchant_id FK
        UUID tenant_user_id FK
        UUID invoice_id FK
        UUID ocr_result_id FK
        NUMERIC declared_amount
        NUMERIC matched_amount
        NUMERIC amount_difference
        NUMERIC match_confidence
        TEXT bank_name
        TEXT sender_name
        TEXT recipient_name
        TEXT reference_number
        DATE transfer_date
        TEXT status
        TEXT rejection_reason
        UUID confirmed_by
        TIMESTAMPTZ confirmed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class bank_accounts {
        UUID id PK
        UUID merchant_id FK
        TEXT bank_name
        TEXT account_number
        TEXT account_name
        TEXT branch_code
        BOOL is_primary
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class escrow_accounts {
        UUID id PK
        UUID merchant_id FK
        NUMERIC balance
        NUMERIC pending_balance
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class escrow_transactions {
        UUID id PK
        UUID escrow_account_id FK
        UUID contract_id FK
        TEXT type
        NUMERIC amount
        NUMERIC gross_amount
        NUMERIC platform_fee
        NUMERIC gateway_fee
        TEXT description
        TEXT reference
        TEXT status
        TIMESTAMPTZ processed_at
        TIMESTAMPTZ created_at
    }

    class disbursements {
        UUID id PK
        UUID escrow_account_id FK
        UUID bank_account_id FK
        UUID vendor_id FK
        TEXT type
        NUMERIC amount
        NUMERIC fee_amount
        NUMERIC net_amount
        TEXT status
        DATE scheduled_for
        BOOL requires_manual_review
        TEXT review_notes
        UUID reviewed_by
        TEXT failure_reason
        TEXT xendit_disbursement_id
        TEXT xendit_reference
        TIMESTAMPTZ processed_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ reviewed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class xendit_transactions {
        UUID id PK
        UUID invoice_id FK
        UUID order_id FK
        UUID user_id FK
        TEXT external_id
        TEXT xendit_invoice_id
        NUMERIC amount
        TEXT status
        TEXT payment_method
        TEXT payment_channel
        TEXT payment_url
        TEXT payment_id
        TEXT qr_code_url
        TEXT virtual_account_number
        JSONB callback_data
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ expired_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% MAINTENANCE
    %% ============================================
    class maintenance_requests {
        UUID id PK
        UUID merchant_id FK
        UUID unit_id FK
        UUID tenant_user_id FK
        UUID assigned_vendor_id FK
        TEXT title
        TEXT category
        TEXT priority
        TEXT status
        TEXT description
        TEXT[] images
        TEXT assigned_to
        TEXT preferred_schedule
        NUMERIC estimated_cost
        TEXT completion_notes
        TEXT[] completion_photos
        TIMESTAMPTZ sla_deadline
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ started_at
        TIMESTAMPTZ resolved_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class maintenance_updates {
        UUID id PK
        UUID maintenance_request_id FK
        UUID author_id FK
        TEXT author_role
        TEXT content
        TEXT[] photos
        TEXT status_change_to
        TIMESTAMPTZ created_at
    }

    class maintenance_timeline {
        UUID id PK
        UUID maintenance_request_id FK
        TEXT status
        TEXT message
        UUID actor_id
        TEXT actor_role
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    class maintenance_reviews {
        UUID id PK
        UUID maintenance_request_id FK
        UUID tenant_user_id FK
        UUID vendor_id FK
        INT rating
        TEXT review_text
        TEXT[] photos
        TIMESTAMPTZ created_at
    }

    class maintenance_expenses {
        UUID id PK
        UUID maintenance_request_id FK
        UUID merchant_id FK
        UUID ocr_result_id FK
        TEXT vendor_name
        TEXT receipt_number
        DATE receipt_date
        NUMERIC subtotal
        NUMERIC tax_amount
        NUMERIC total_amount
        TEXT currency
        JSONB line_items
        TEXT notes
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% ANALYTICS & METRICS
    %% ============================================
    class occupancy_snapshots {
        UUID id PK
        UUID merchant_id FK
        UUID property_id FK
        TEXT snapshot_month
        INT total_units
        INT occupied_units
        INT available_units
        INT maintenance_units
        NUMERIC occupancy_rate
        NUMERIC avg_rent_amount
        INT avg_vacancy_days
        INT new_move_ins
        INT move_outs
        TIMESTAMPTZ created_at
    }

    class tenant_payment_metrics {
        UUID id PK
        UUID merchant_id FK
        UUID tenant_user_id FK
        UUID contract_id FK
        INT total_invoices
        INT paid_on_time
        INT paid_late
        INT unpaid
        NUMERIC on_time_rate
        NUMERIC avg_days_late
        NUMERIC total_late_fees
        TIMESTAMPTZ last_calculated_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class tenant_risk_scores {
        UUID id PK
        UUID merchant_id FK
        UUID tenant_user_id FK
        NUMERIC risk_score
        TEXT risk_level
        JSONB risk_factors
        TEXT recommendation
        TIMESTAMPTZ calculated_at
        TIMESTAMPTZ created_at
    }

    class data_quality_checks {
        UUID id PK
        UUID merchant_id FK
        TEXT entity_type
        UUID entity_id
        NUMERIC quality_score
        JSONB validation_results
        JSONB overrides
        BOOL is_final_validated
        UUID validated_by
        TIMESTAMPTZ validated_at
        TIMESTAMPTZ created_at
    }

    class dss_recommendations {
        UUID id PK
        UUID merchant_id FK
        UUID ml_model_run_id FK
        TEXT type
        TEXT title
        TEXT description
        TEXT status
        NUMERIC confidence_score
        JSONB recommendation_data
        JSONB impact_estimate
        JSONB measured_impact
        TEXT rejection_reason
        TIMESTAMPTZ accepted_at
        TIMESTAMPTZ rejected_at
        TIMESTAMPTZ expires_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class ml_model_runs {
        UUID id PK
        UUID merchant_id FK
        UUID user_id FK
        TEXT model_name
        TEXT function_name
        TEXT input_summary
        TEXT output_summary
        INT tokens_used
        INT execution_time_ms
        NUMERIC confidence_score
        NUMERIC cost_estimate
        TEXT error_message
        JSONB metadata
        TIMESTAMPTZ created_at
    }

    class ocr_results {
        UUID id PK
        UUID merchant_id FK
        UUID user_id FK
        UUID ml_model_run_id FK
        TEXT document_type
        TEXT document_url
        TEXT status
        JSONB extracted_data
        NUMERIC confidence_score
        INT processing_time_ms
        BOOL requires_review
        TEXT review_notes
        UUID reviewed_by
        TEXT error_message
        TIMESTAMPTZ reviewed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% VENDOR INTEGRATION
    %% ============================================
    class vendor_jobs {
        UUID id PK
        UUID maintenance_request_id FK
        UUID merchant_id FK
        UUID vendor_id FK
        NUMERIC quoted_price
        NUMERIC agreed_price
        TEXT status
        TEXT notes
        TIMESTAMPTZ started_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% LAINNYA
    %% ============================================
    class live_chat_conversations {
        UUID id PK
        UUID merchant_id FK
        UUID user_id FK
        TEXT user_role
        TEXT subject
        TEXT status
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class live_chat_messages {
        UUID id PK
        UUID conversation_id FK
        UUID sender_id FK
        TEXT sender_role
        TEXT message
        TIMESTAMPTZ created_at
    }

    class referrals {
        UUID id PK
        UUID referrer_user_id FK
        UUID referee_user_id FK
        TEXT referral_code
        TEXT referrer_role
        TEXT referee_role
        TEXT status
        NUMERIC reward_amount
        BOOL reward_paid
        BOOL bonus_paid
        TIMESTAMPTZ converted_at
        TIMESTAMPTZ completed_at
        TIMESTAMPTZ first_payment_at
        TIMESTAMPTZ bonus_paid_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class referral_commissions {
        UUID id PK
        UUID referral_id FK
        UUID referrer_id FK
        UUID referee_id FK
        INT month_number
        NUMERIC subscription_amount
        NUMERIC commission_rate
        NUMERIC commission_amount
        TEXT status
        DATE eligible_date
        TEXT cancellation_reason
        TIMESTAMPTZ paid_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    class rls_alert_settings {
        UUID id PK
        UUID merchant_id FK
        INT denial_threshold
        INT window_minutes
        INT alert_cooldown_minutes
        BOOL is_active
        TIMESTAMPTZ last_alert_at
        TIMESTAMPTZ created_at
        TIMESTAMPTZ updated_at
    }

    %% ============================================
    %% RELASI - Shared
    %% ============================================
    merchants --> addresses : "headquarters_address_id"
    merchants --> addresses : "billing_address_id"
    properties --> addresses : "address_id"

    %% ============================================
    %% RELASI - Core Merchant
    %% ============================================
    merchants --> merchant_verifications : "1..*"
    merchants --> merchant_verification_history : "1..*"
    merchants --> merchant_subscriptions : "1..1"
    merchants --> cancellation_feedback : "1..*"
    merchants --> subscription_changes : "1..*"
    merchants --> merchant_feedback : "1..*"

    merchant_subscriptions --> subscription_tiers : "tier_id"
    subscription_invoices --> merchant_subscriptions : "subscription_id"
    cancellation_feedback --> merchant_subscriptions : "subscription_id"
    subscription_changes --> subscription_tiers : "from_tier_id"
    subscription_changes --> subscription_tiers : "to_tier_id"

    %% ============================================
    %% RELASI - Properti & Unit
    %% ============================================
    merchants --> properties : "1..*"
    properties --> units : "1..*"
    merchants --> property_guardians : "1..*"
    properties --> property_guardians : "1..*"
    property_guardians --> guardian_property_assignments : "1..*"
    properties --> guardian_property_assignments : "1..*"
    properties --> property_nearby_facilities : "1..*"
    merchants --> property_renovations : "1..*"
    properties --> property_renovations : "1..*"
    merchants --> property_vendor_services : "1..*"
    properties --> property_vendor_services : "1..*"
    properties --> property_facilities : "1..*"
    facilities --> property_facilities : "facility_id"
    merchants --> compliance_documents : "1..*"
    properties --> compliance_documents : "1..*"
    merchants --> disaster_risk_profiles : "1..*"
    properties --> disaster_risk_profiles : "1..*"
    merchants --> security_incidents : "1..*"
    properties --> security_incidents : "1..*"
    merchants --> insurance_policies : "1..*"
    properties --> insurance_policies : "1..*"
    insurance_policies --> insurance_claims : "1..*"
    merchants --> insurance_claims : "1..*"

    %% ============================================
    %% RELASI - Inventori
    %% ============================================
    merchants --> facility_types : "1..*"
    facility_types --> assets : "1..*"
    merchants --> assets : "1..*"
    properties --> assets : "0..*"
    units --> assets : "0..*"
    facility_types --> facility_assignments : "1..*"
    properties --> facility_assignments : "0..*"
    units --> facility_assignments : "0..*"
    merchants --> facilities : "1..*"

    %% ============================================
    %% RELASI - Peraturan
    %% ============================================
    merchants --> rule_types : "1..*"
    merchants --> rules : "1..*"
    properties --> rules : "1..*"
    units --> rules : "0..*"
    rule_types --> rules : "0..*"
    rules --> rule_acknowledgements : "1..*"

    %% ============================================
    %% RELASI - Kontrak & Tenant
    %% ============================================
    merchants --> contracts : "1..*"
    units --> contracts : "1..*"
    contracts --> move_out_notices : "1..*"
    move_out_notices --> move_out_inspections : "1..*"
    move_out_notices --> move_out_tasks : "1..*"
    move_out_notices --> move_out_timeline : "1..*"
    contracts --> deposit_refunds : "1..*"
    deposit_refunds --> deposit_disputes : "1..*"
    move_out_inspections --> deposit_refunds : "inspection_id"
    contracts --> early_termination_requests : "1..*"
    merchants --> disputes : "1..*"
    contracts --> disputes : "0..*"
    merchants --> tenant_invitations : "1..*"
    units --> tenant_invitations : "0..*"
    merchants --> tenant_merchant_history : "1..*"
    contracts --> tenant_merchant_history : "0..*"

    %% ============================================
    %% RELASI - Billing & Keuangan
    %% ============================================
    contracts --> invoices : "1..*"
    merchants --> invoices : "1..*"
    properties --> invoices : "property_id"
    units --> invoices : "unit_id"
    invoices --> invoice_status_history : "1..*"
    invoices --> payments : "1..*"
    invoices --> late_fee_records : "1..*"
    invoices --> payment_plans : "0..*"
    merchants --> payment_plans : "1..*"
    payment_plans --> payment_plan_installments : "1..*"
    payment_plan_installments --> invoices : "invoice_id"
    merchants --> collections_cases : "1..*"
    invoices --> collections_cases : "1..*"
    merchants --> payment_verifications : "1..*"
    ocr_results --> payment_verifications : "ocr_result_id"
    invoices --> payment_verifications : "0..*"
    merchants --> bank_accounts : "1..*"
    merchants --> escrow_accounts : "1..1"
    escrow_accounts --> escrow_transactions : "1..*"
    contracts --> escrow_transactions : "0..*"
    escrow_accounts --> disbursements : "0..*"
    invoices --> xendit_transactions : "0..*"

    %% ============================================
    %% RELASI - Maintenance
    %% ============================================
    merchants --> maintenance_requests : "1..*"
    units --> maintenance_requests : "1..*"
    maintenance_requests --> maintenance_updates : "1..*"
    maintenance_requests --> maintenance_timeline : "1..*"
    maintenance_requests --> maintenance_reviews : "1..1"
    maintenance_requests --> maintenance_expenses : "1..*"
    merchants --> maintenance_expenses : "1..*"
    ocr_results --> maintenance_expenses : "ocr_result_id"

    %% ============================================
    %% RELASI - Analytics
    %% ============================================
    merchants --> occupancy_snapshots : "1..*"
    properties --> occupancy_snapshots : "0..*"
    merchants --> tenant_payment_metrics : "1..*"
    merchants --> tenant_risk_scores : "1..*"
    merchants --> data_quality_checks : "1..*"
    merchants --> dss_recommendations : "1..*"
    ml_model_runs --> dss_recommendations : "0..*"
    merchants --> ml_model_runs : "0..*"
    merchants --> ocr_results : "0..*"
    ml_model_runs --> ocr_results : "0..*"

    %% ============================================
    %% RELASI - Vendor Integration
    %% ============================================
    merchants --> vendor_jobs : "1..*"
    maintenance_requests --> vendor_jobs : "1..*"

    %% ============================================
    %% RELASI - Lainnya
    %% ============================================
    merchants --> live_chat_conversations : "0..*"
    live_chat_conversations --> live_chat_messages : "1..*"
    merchants --> rls_alert_settings : "0..*"
    referrals --> referral_commissions : "1..*"
```

## Ringkasan Tabel per Domain

| Domain | Tabel | Jumlah |
|--------|-------|--------|
| Shared/Lookup | `addresses` | 1 |
| Core Merchant | `merchants` | 1 |
| Verifikasi & Subscription | `merchant_verifications`, `merchant_verification_history`, `subscription_tiers`, `merchant_subscriptions`, `subscription_invoices`, `cancellation_feedback`, `subscription_changes`, `merchant_feedback` | 8 |
| Properti & Unit | `properties`, `units`, `property_guardians`, `guardian_property_assignments`, `property_nearby_facilities`, `property_renovations`, `property_vendor_services`, `property_data_versions`, `property_facilities`, `compliance_documents`, `disaster_risk_profiles`, `security_incidents`, `insurance_policies`, `insurance_claims` | 14 |
| Inventori (3-Tier) | `facility_types`, `assets`, `facility_assignments`, `facilities` | 4 |
| Peraturan | `rule_types`, `rules`, `rule_acknowledgements` | 3 |
| Kontrak & Tenant | `contracts`, `tenant_invitations`, `tenant_merchant_history`, `move_out_notices`, `move_out_inspections`, `move_out_tasks`, `move_out_timeline`, `deposit_refunds`, `deposit_disputes`, `early_termination_requests`, `disputes` | 11 |
| Billing & Keuangan | `invoices`, `invoice_status_history`, `payments`, `payment_plans`, `payment_plan_installments`, `late_fee_records`, `collections_cases`, `payment_verifications`, `bank_accounts`, `escrow_accounts`, `escrow_transactions`, `disbursements`, `xendit_transactions` | 13 |
| Maintenance | `maintenance_requests`, `maintenance_updates`, `maintenance_timeline`, `maintenance_reviews`, `maintenance_expenses` | 5 |
| Analytics & Metrics | `occupancy_snapshots`, `tenant_payment_metrics`, `tenant_risk_scores`, `data_quality_checks`, `dss_recommendations`, `ml_model_runs`, `ocr_results` | 7 |
| Vendor Integration | `vendor_jobs` | 1 |
| Lainnya | `live_chat_conversations`, `live_chat_messages`, `referrals`, `referral_commissions`, `rls_alert_settings` | 5 |
| **Total** | | **73** |

> **Catatan**: Tabel-tabel non-merchant (e.g. `profiles`, `user_roles`, `tenants`, `vendors`, `products`, `orders`, `forum_*`, `chat_*`, `notifications`, `provinces`, `cities`, `vouchers`, dll.) tidak ditampilkan dalam diagram ini karena fokus dokumen adalah ekosistem data merchant.

---

## Views & Materialized Views

### Views (5)

| View | Deskripsi |
|------|-----------|
| `v_merchants_with_addresses` | JOIN `merchants` + `addresses` (via `headquarters_address_id`) — meng-resolve alamat merchant ke kolom flat (`resolved_address`, `resolved_city`, `resolved_province`, `resolved_postal_code`) |
| `v_properties_with_addresses` | JOIN `properties` + `addresses` (via `address_id`) — meng-resolve alamat properti + koordinat GPS |
| `v_maintenance_expenses_with_merchant` | JOIN `maintenance_expenses` + `maintenance_requests` — menambahkan `derived_merchant_id`, `request_title`, `request_status` |
| `merchant_property_summary` | Agregasi per merchant: jumlah properti, unit, unit occupied, kontrak aktif, total revenue |
| `merchant_referral_summary` | Agregasi referral per merchant: kode, status, reward, total commissions |

### Materialized Views (1)

| Materialized View | Deskripsi | Refresh |
|-------------------|-----------|---------|
| `merchant_occupancy_analysis` | Analisis okupansi: total properties, units, occupied_units, occupancy_rate, monthly_revenue, total_revenue, active_contracts. Digunakan untuk dashboard analytics. | Via `refresh_merchant_analytics()` function |

---

## Database Functions (30)

| Function | Deskripsi |
|----------|-----------|
| `calculate_sla_deadline` | Hitung deadline SLA untuk maintenance request |
| `check_phone_unique_per_role` | Validasi keunikan nomor telepon per role |
| `create_merchant_escrow` | Auto-create escrow account saat merchant baru dibuat |
| `generate_contract_number` | Auto-generate nomor kontrak |
| `generate_invoice_number` | Auto-generate nomor invoice |
| `generate_merchant_code` | Auto-generate kode merchant |
| `generate_order_number` | Auto-generate nomor order |
| `generate_property_code` | Auto-generate kode properti |
| `generate_referral_code` | Auto-generate kode referral |
| `generate_subscription_invoice_number` | Auto-generate nomor invoice subscription |
| `generate_voucher_code` | Auto-generate kode voucher |
| `get_user_role` | Ambil role user (single) |
| `get_user_roles` | Ambil semua role user |
| `handle_new_user` | Handler untuk user baru dari auth |
| `has_role` | Cek apakah user memiliki role tertentu |
| `merchants_search_update` | Update search_vector pada merchants (FTS) |
| `populate_invoice_denorm` | Auto-populate `property_id`, `unit_id`, `tenant_name`, `unit_number` pada invoice baru |
| `refresh_merchant_analytics` | Refresh materialized view `merchant_occupancy_analysis` |
| `set_cancellation_effective_date` | Set tanggal efektif pembatalan subscription |
| `set_maintenance_sla_deadline` | Set SLA deadline pada maintenance request |
| `set_merchant_code` | Trigger function untuk set merchant code |
| `set_property_code` | Trigger function untuk set property code |
| `sync_merchant_verification_status` | Sinkronisasi status verifikasi merchant dari history |
| `track_invoice_status_change` | Catat perubahan status invoice ke `invoice_status_history` |
| `update_property_renovation_total` | Update total biaya renovasi properti |
| `update_property_unit_counts` | Update jumlah unit pada properti |
| `update_unit_status_on_contract_sign` | Update status unit saat kontrak ditandatangani |
| `update_updated_at_column` | Generic trigger function untuk auto-update kolom `updated_at` |
| `update_vendor_maintenance_rating` | Update rating vendor dari maintenance review |
| `validate_facility_category` | Validasi kategori fasilitas |

---

## Triggers

### Business Logic Triggers

| Trigger | Table | Function | Deskripsi |
|---------|-------|----------|-----------|
| `on_merchant_created_create_escrow` | `merchants` | `create_merchant_escrow` | Auto-create escrow account |
| `trg_merchants_search_update` | `merchants` | `merchants_search_update` | Update FTS search_vector |
| `trigger_set_merchant_code` | `merchants` | `set_merchant_code` | Auto-generate merchant code |
| `trg_sync_merchant_verification_status` | `merchant_verification_history` | `sync_merchant_verification_status` | Sync status verifikasi |
| `trigger_set_cancellation_effective_date` | `merchant_subscriptions` | `set_cancellation_effective_date` | Set tanggal efektif cancel |
| `tr_set_contract_number` | `contracts` | `generate_contract_number` | Auto-generate nomor kontrak |
| `trigger_update_unit_on_contract_sign` | `contracts` | `update_unit_status_on_contract_sign` | Update status unit |
| `generate_invoice_number_trigger` | `invoices` | `generate_invoice_number` | Auto-generate nomor invoice |
| `tr_populate_invoice_denorm` | `invoices` | `populate_invoice_denorm` | Auto-populate denormalisasi |
| `trg_track_invoice_status` | `invoices` | `track_invoice_status_change` | Catat history status |
| `trigger_set_sla_deadline` | `maintenance_requests` | `set_maintenance_sla_deadline` | Set SLA deadline |
| `trigger_update_vendor_maintenance_rating` | `maintenance_reviews` | `update_vendor_maintenance_rating` | Update rating vendor |
| `trg_validate_facility_category` | `facilities` | `validate_facility_category` | Validasi kategori |
| `generate_order_number_trigger` | `orders` | `generate_order_number` | Auto-generate nomor order |
| `trigger_set_property_code` | `properties` | `set_property_code` | Auto-generate property code |
| `trigger_update_property_unit_counts` | `units` | `update_property_unit_counts` | Update jumlah unit |
| `trigger_update_renovation_total` | `property_renovations` | `update_property_renovation_total` | Update total renovasi |

### Auto-Updated Timestamps (update_updated_at_column)

Tabel-tabel berikut memiliki trigger `update_*_updated_at` yang otomatis meng-update kolom `updated_at`:

`assets`, `bank_accounts`, `chat_conversations`, `chatbot_knowledge`, `collections_cases`, `compliance_documents`, `contracts`, `disaster_risk_profiles`, `disbursements`, `disputes`, `dss_recommendations`, `escrow_accounts`, `facilities`, `facility_types`, `forum_comments`, `forum_posts`, `insurance_claims`, `insurance_policies`, `invoices`, `live_chat_conversations`, `maintenance_expenses`, `maintenance_requests`, `merchant_feedback`, `merchant_subscriptions`, `merchants`, `ocr_results`, `order_reviews`, `orders`, `payment_verifications`, `products`, `properties`, `property_guardians`, `property_renovations`, `property_vendor_services`, `referral_commissions`, `referrals`, `rls_alert_settings`, `rules`, `rule_types`, `security_incidents`, `subscription_changes`, `tenant_payment_metrics`, `units`, `vendor_jobs`, `vendors`, `vouchers`, `xendit_transactions`

---

## Index Strategy

### Shared / Lookup
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_addresses_city_province` | `addresses` | `(city, province)` | B-tree |
| `idx_addresses_coordinates` | `addresses` | `(latitude, longitude)` | B-tree partial (`WHERE latitude IS NOT NULL`) |

### Core Merchant
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_merchants_search_vector` | `merchants` | `search_vector` | GIN |
| `idx_merchants_verification_status` | `merchants` | `verification_status` | B-tree |
| `idx_merchants_user_id` | `merchants` | `user_id` | B-tree |
| `idx_merchants_hq_address` | `merchants` | `headquarters_address_id` | B-tree |
| `idx_merchants_billing_address` | `merchants` | `billing_address_id` | B-tree |

### Verifikasi & Subscription
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_merchant_verifications_merchant_id` | `merchant_verifications` | `merchant_id` | B-tree |
| `idx_merchant_verifications_status` | `merchant_verifications` | `status` | B-tree |
| `idx_merchant_verification_history_merchant_id` | `merchant_verification_history` | `merchant_id` | B-tree |
| `idx_merchant_subscriptions_merchant_id` | `merchant_subscriptions` | `merchant_id` | B-tree |
| `idx_merchant_subscriptions_tier_id` | `merchant_subscriptions` | `tier_id` | B-tree |
| `idx_merchant_subscriptions_status` | `merchant_subscriptions` | `status` | B-tree |
| `idx_subscription_invoices_subscription_id` | `subscription_invoices` | `subscription_id` | B-tree |
| `idx_cancellation_feedback_merchant_id` | `cancellation_feedback` | `merchant_id` | B-tree |
| `idx_subscription_changes_merchant` | `subscription_changes` | `merchant_id` | B-tree |
| `idx_subscription_changes_status` | `subscription_changes` | `status` | B-tree |

### Properti & Unit
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_properties_merchant_id` | `properties` | `merchant_id` | B-tree |
| `idx_properties_status` | `properties` | `status` | B-tree |
| `idx_properties_address` | `properties` | `address_id` | B-tree |
| `idx_properties_amenities` | `properties` | `amenities` | GIN |
| `idx_properties_images` | `properties` | `images` | GIN |
| `idx_properties_nearby_facilities` | `properties` | `nearby_facilities` | GIN |
| `idx_units_property_id` | `units` | `property_id` | B-tree |
| `idx_units_status` | `units` | `status` | B-tree |
| `idx_units_amenities` | `units` | `amenities` | GIN |
| `idx_units_additional_costs` | `units` | `additional_costs` | GIN |
| `idx_property_guardians_merchant` | `property_guardians` | `merchant_id` | B-tree |
| `idx_property_guardians_property` | `property_guardians` | `property_id` | B-tree |

### Kontrak & Tenant
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_contracts_merchant_id` | `contracts` | `merchant_id` | B-tree |
| `idx_contracts_tenant_user_id` | `contracts` | `tenant_user_id` | B-tree |
| `idx_contracts_unit_id` | `contracts` | `unit_id` | B-tree |
| `idx_contracts_status` | `contracts` | `status` | B-tree |
| `idx_contracts_dates` | `contracts` | `start_date, end_date` | B-tree |
| `idx_tenant_invitations_merchant` | `tenant_invitations` | `merchant_id` | B-tree |
| `idx_tenant_invitations_unit` | `tenant_invitations` | `unit_id` | B-tree |
| `idx_move_out_notices_contract` | `move_out_notices` | `contract_id` | B-tree |

### Billing & Keuangan
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_invoices_contract_id` | `invoices` | `contract_id` | B-tree |
| `idx_invoices_merchant_id` | `invoices` | `merchant_id` | B-tree |
| `idx_invoices_tenant_user_id` | `invoices` | `tenant_user_id` | B-tree |
| `idx_invoices_status` | `invoices` | `status` | B-tree |
| `idx_invoices_due_date` | `invoices` | `due_date` | B-tree |
| `idx_invoices_merchant_due` | `invoices` | `(merchant_id, due_date)` | B-tree |
| `idx_invoices_status_due` | `invoices` | `(status, due_date)` | B-tree |
| `idx_invoices_property` | `invoices` | `property_id` | B-tree |
| `idx_invoices_unit` | `invoices` | `unit_id` | B-tree |
| `idx_invoice_status_history_invoice` | `invoice_status_history` | `invoice_id` | B-tree |
| `idx_payments_invoice_id` | `payments` | `invoice_id` | B-tree |
| `idx_payments_tenant_user_id` | `payments` | `tenant_user_id` | B-tree |
| `idx_payment_plans_invoice` | `payment_plans` | `invoice_id` | B-tree |
| `idx_payment_plans_merchant` | `payment_plans` | `merchant_id` | B-tree |
| `idx_collections_cases_merchant_id` | `collections_cases` | `merchant_id` | B-tree |
| `idx_collections_cases_status` | `collections_cases` | `status` | B-tree |
| `idx_escrow_transactions_account` | `escrow_transactions` | `escrow_account_id` | B-tree |
| `idx_disbursements_escrow` | `disbursements` | `escrow_account_id` | B-tree |
| `idx_disbursements_status` | `disbursements` | `status` | B-tree |
| `idx_xendit_transactions_invoice` | `xendit_transactions` | `invoice_id` | B-tree |
| `idx_xendit_transactions_status` | `xendit_transactions` | `status` | B-tree |

### Maintenance
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_maintenance_requests_merchant` | `maintenance_requests` | `merchant_id` | B-tree |
| `idx_maintenance_requests_unit` | `maintenance_requests` | `unit_id` | B-tree |
| `idx_maintenance_requests_status` | `maintenance_requests` | `status` | B-tree |
| `idx_maintenance_requests_priority` | `maintenance_requests` | `priority` | B-tree |
| `idx_maintenance_updates_request` | `maintenance_updates` | `maintenance_request_id` | B-tree |
| `idx_maintenance_expenses_request` | `maintenance_expenses` | `maintenance_request_id` | B-tree |
| `idx_maintenance_expenses_merchant` | `maintenance_expenses` | `merchant_id` | B-tree |

### Analytics & System
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_audit_logs_user_id` | `audit_logs` | `user_id` | B-tree |
| `idx_audit_logs_entity_type` | `audit_logs` | `entity_type` | B-tree |
| `idx_audit_logs_action` | `audit_logs` | `action` | B-tree |
| `idx_audit_logs_created_at` | `audit_logs` | `created_at DESC` | B-tree |
| `idx_chatbot_analytics_user_id` | `chatbot_analytics` | `user_id` | B-tree |
| `idx_chatbot_analytics_created_at` | `chatbot_analytics` | `created_at DESC` | B-tree |
| `idx_occupancy_snapshots_merchant` | `occupancy_snapshots` | `merchant_id` | B-tree |
| `idx_occupancy_snapshots_property` | `occupancy_snapshots` | `property_id` | B-tree |
| `idx_tenant_payment_metrics_merchant` | `tenant_payment_metrics` | `merchant_id` | B-tree |

### Inventori
| Index | Table | Columns | Type |
|-------|-------|---------|------|
| `idx_assets_facility_type` | `assets` | `facility_type_id` | B-tree |
| `idx_assets_merchant` | `assets` | `merchant_id` | B-tree |
| `idx_assets_property` | `assets` | `property_id` | B-tree |
| `idx_assets_unit` | `assets` | `unit_id` | B-tree |
| `idx_facility_types_merchant` | `facility_types` | `merchant_id` | B-tree |

> **Catatan**: Tabel di atas hanya menampilkan **custom indexes** (non-PK). Setiap tabel juga memiliki PK index `*_pkey` dan beberapa memiliki unique constraint indexes.

---

## Refactoring History

| Section | Deskripsi | Status |
|---------|-----------|--------|
| 1.1 | Normalisasi alamat merchant → `addresses` + FK `headquarters_address_id`, `billing_address_id` | ✅ DONE |
| 1.2 | Normalisasi alamat properti → `addresses` + FK `address_id`, `nearby_facilities` JSONB | ✅ DONE |
| 1.3 | Normalisasi subscription merchant → drop `subscription_tier`, `disbursement_schedule`, `billing_day` → baca dari `merchant_subscriptions` | ✅ DONE |
| 1.4 | Normalisasi referral merchant → drop `referred_by`, `referral_discount`, `referral_discount_months` → baca dari `referrals` + `referral_commissions` | ✅ DONE |
| 1.5 | Normalisasi verifikasi merchant → drop `verification_submitted_at`, `verified_at`, `verified_by`, `rejected_at`, `rejected_by`, `rejection_details`, `resubmission_count`, `resubmission_instructions` → baca dari `merchant_verification_history` | ✅ DONE |
| 1.6 | Cleanup invoices → drop `payment_plan_id` → relasi via `payment_plans.invoice_id`. Denormalisasi `property_id`, `unit_id`, `tenant_name`, `unit_number`. | ✅ DONE |
| 1.7 | Rename `pending_subscription_changes` → `subscription_changes` + kolom baru | ✅ DONE |
