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
            alerts: {
                Row: {
                    camera_id: string
                    confidence: number
                    created_at: string | null
                    id: string
                    is_read: boolean | null
                    metadata: Json | null
                    snapshot_url: string | null
                    type: string
                    user_id: string
                    video_clip_url: string | null
                }
                Insert: {
                    camera_id: string
                    confidence: number
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    metadata?: Json | null
                    snapshot_url?: string | null
                    type: string
                    user_id: string
                    video_clip_url?: string | null
                }
                Update: {
                    camera_id?: string
                    confidence?: number
                    created_at?: string | null
                    id?: string
                    is_read?: boolean | null
                    metadata?: Json | null
                    snapshot_url?: string | null
                    type?: string
                    user_id?: string
                    video_clip_url?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "alerts_camera_id_fkey"
                        columns: ["camera_id"]
                        isOneToOne: false
                        referencedRelation: "cameras"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "alerts_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            cameras: {
                Row: {
                    created_at: string | null
                    detection_settings: Json | null
                    id: string
                    is_active: boolean | null
                    name: string
                    password: string | null
                    rtsp_url: string
                    thumbnail_url: string | null
                    updated_at: string | null
                    user_id: string
                    username: string | null
                }
                Insert: {
                    created_at?: string | null
                    detection_settings?: Json | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    password?: string | null
                    rtsp_url: string
                    thumbnail_url?: string | null
                    updated_at?: string | null
                    user_id: string
                    username?: string | null
                }
                Update: {
                    created_at?: string | null
                    detection_settings?: Json | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    password?: string | null
                    rtsp_url?: string
                    thumbnail_url?: string | null
                    updated_at?: string | null
                    user_id?: string
                    username?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "cameras_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            detection_zones: {
                Row: {
                    camera_id: string
                    created_at: string | null
                    id: string
                    is_active: boolean | null
                    name: string
                    polygon: Json
                }
                Insert: {
                    camera_id: string
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name: string
                    polygon: Json
                }
                Update: {
                    camera_id?: string
                    created_at?: string | null
                    id?: string
                    is_active?: boolean | null
                    name?: string
                    polygon?: Json
                }
                Relationships: [
                    {
                        foreignKeyName: "detection_zones_camera_id_fkey"
                        columns: ["camera_id"]
                        isOneToOne: false
                        referencedRelation: "cameras"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payment_history: {
                Row: {
                    amount: number
                    created_at: string | null
                    currency: string
                    id: string
                    payment_request_id: string | null
                    period_end: string
                    period_start: string
                    plan_id: string
                    user_id: string
                }
                Insert: {
                    amount: number
                    created_at?: string | null
                    currency?: string
                    id?: string
                    payment_request_id?: string | null
                    period_end: string
                    period_start: string
                    plan_id: string
                    user_id: string
                }
                Update: {
                    amount?: number
                    created_at?: string | null
                    currency?: string
                    id?: string
                    payment_request_id?: string | null
                    period_end?: string
                    period_start?: string
                    plan_id?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_history_payment_request_id_fkey"
                        columns: ["payment_request_id"]
                        isOneToOne: false
                        referencedRelation: "payment_requests"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "payment_history_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "auth"
                        referencedColumns: ["id"]
                    },
                ]
            }
            payment_requests: {
                Row: {
                    amount: number
                    completed_at: string | null
                    created_at: string
                    currency: string
                    id: string
                    notes: string | null
                    payment_proof_url: string | null
                    plan_id: string
                    provider: string
                    status: string
                    transaction_id: string | null
                    updated_at: string
                    user_id: string
                }
                Insert: {
                    amount: number
                    completed_at?: string | null
                    created_at?: string
                    currency?: string
                    id?: string
                    notes?: string | null
                    payment_proof_url?: string | null
                    plan_id: string
                    provider: string
                    status?: string
                    transaction_id?: string | null
                    updated_at?: string
                    user_id: string
                }
                Update: {
                    amount?: number
                    completed_at?: string | null
                    created_at?: string
                    currency?: string
                    id?: string
                    notes?: string | null
                    payment_proof_url?: string | null
                    plan_id?: string
                    provider?: string
                    status?: string
                    transaction_id?: string | null
                    updated_at?: string
                    user_id?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "payment_requests_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "auth"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar_url: string | null
                    created_at: string | null
                    display_name: string | null
                    email: string
                    fcm_token: string | null
                    id: string
                    last_payment_date: string | null
                    subscription_auto_renew: boolean | null
                    subscription_expires_at: string | null
                    subscription_payment_method: string | null
                    subscription_tier: string | null
                    updated_at: string | null
                }
                Insert: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    email: string
                    fcm_token?: string | null
                    id: string
                    last_payment_date?: string | null
                    subscription_auto_renew?: boolean | null
                    subscription_expires_at?: string | null
                    subscription_payment_method?: string | null
                    subscription_tier?: string | null
                    updated_at?: string | null
                }
                Update: {
                    avatar_url?: string | null
                    created_at?: string | null
                    display_name?: string | null
                    email?: string
                    fcm_token?: string | null
                    id?: string
                    last_payment_date?: string | null
                    subscription_auto_renew?: boolean | null
                    subscription_expires_at?: string | null
                    subscription_payment_method?: string | null
                    subscription_tier?: string | null
                    updated_at?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_id_fkey"
                        columns: ["id"]
                        isOneToOne: true
                        referencedRelation: "auth"
                        referencedColumns: ["id"]
                    },
                ]
            }
            subscription_features: {
                Row: {
                    feature_key: string
                    feature_value: string | null
                    id: string
                    is_enabled: boolean | null
                    tier: string
                }
                Insert: {
                    feature_key: string
                    feature_value?: string | null
                    id?: string
                    is_enabled?: boolean | null
                    tier: string
                }
                Update: {
                    feature_key?: string
                    feature_value?: string | null
                    id?: string
                    is_enabled?: boolean | null
                    tier?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            confirm_payment: {
                Args: {
                    p_payment_request_id: string
                    p_transaction_id?: string
                }
                Returns: Json
            }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

export type Tables<
    PublicTableNameOrOptions extends
    | keyof (DatabaseWithoutInternals["public"]["Tables"] &
        DatabaseWithoutInternals["public"]["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? (DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : PublicTableNameOrOptions extends keyof (DatabaseWithoutInternals["public"]["Tables"] &
        DatabaseWithoutInternals["public"]["Views"])
    ? (DatabaseWithoutInternals["public"]["Tables"] &
        DatabaseWithoutInternals["public"]["Views"])[PublicTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
    ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    PublicTableNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : PublicTableNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Tables"]
    ? DatabaseWithoutInternals["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    PublicEnumNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? keyof DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : PublicEnumNameOrOptions extends keyof DatabaseWithoutInternals["public"]["Enums"]
    ? DatabaseWithoutInternals["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DatabaseWithoutInternals["public"]["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DatabaseWithoutInternals["public"]["CompositeTypes"]
    ? DatabaseWithoutInternals["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
