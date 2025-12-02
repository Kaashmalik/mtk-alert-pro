// Shared types between packages

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          avatar_url: string | null;
          subscription_tier: string;
          subscription_expires_at: string | null;
          fcm_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };
      cameras: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          rtsp_url: string;
          username: string | null;
          password: string | null;
          is_active: boolean;
          thumbnail_url: string | null;
          detection_settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['cameras']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['cameras']['Insert']>;
      };
      alerts: {
        Row: {
          id: string;
          camera_id: string;
          user_id: string;
          type: string;
          confidence: number;
          snapshot_url: string | null;
          video_clip_url: string | null;
          metadata: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['alerts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['alerts']['Insert']>;
      };
      detection_zones: {
        Row: {
          id: string;
          camera_id: string;
          name: string;
          polygon: Record<string, unknown>;
          is_active: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['detection_zones']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['detection_zones']['Insert']>;
      };
    };
  };
}
