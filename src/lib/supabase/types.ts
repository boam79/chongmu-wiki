export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      analytics_snapshots: {
        Row: {
          active_months: number | null;
          amount_analysis: Json | null;
          auto_insights: Json | null;
          community_health: Json | null;
          created_at: string | null;
          first_date: string | null;
          id: string;
          industry_dist: Json | null;
          is_active: boolean | null;
          last_date: string | null;
          law_mentions: Json | null;
          member_count: number | null;
          member_profiles: Json | null;
          monthly_stats: Json | null;
          questions: Json | null;
          recent_batch: Json | null;
          season: number;
          season_end: string | null;
          season_label: string | null;
          season_start: string | null;
          snapshot_date: string;
          time_analysis: Json | null;
          top_members: Json | null;
          topic_counts: Json | null;
          topic_trends: Json | null;
          total_messages: number | null;
          url_analysis: Json | null;
          vendor_mentions: Json | null;
        };
        Insert: {
          active_months?: number | null;
          amount_analysis?: Json | null;
          auto_insights?: Json | null;
          community_health?: Json | null;
          created_at?: string | null;
          first_date?: string | null;
          id?: string;
          industry_dist?: Json | null;
          is_active?: boolean | null;
          last_date?: string | null;
          law_mentions?: Json | null;
          member_count?: number | null;
          member_profiles?: Json | null;
          monthly_stats?: Json | null;
          questions?: Json | null;
          recent_batch?: Json | null;
          season?: number;
          season_end?: string | null;
          season_label?: string | null;
          season_start?: string | null;
          snapshot_date: string;
          time_analysis?: Json | null;
          top_members?: Json | null;
          topic_counts?: Json | null;
          topic_trends?: Json | null;
          total_messages?: number | null;
          url_analysis?: Json | null;
          vendor_mentions?: Json | null;
        };
        Update: {
          active_months?: number | null;
          amount_analysis?: Json | null;
          auto_insights?: Json | null;
          community_health?: Json | null;
          created_at?: string | null;
          first_date?: string | null;
          id?: string;
          industry_dist?: Json | null;
          is_active?: boolean | null;
          last_date?: string | null;
          law_mentions?: Json | null;
          member_count?: number | null;
          member_profiles?: Json | null;
          monthly_stats?: Json | null;
          questions?: Json | null;
          recent_batch?: Json | null;
          season?: number;
          season_end?: string | null;
          season_label?: string | null;
          season_start?: string | null;
          snapshot_date?: string;
          time_analysis?: Json | null;
          top_members?: Json | null;
          topic_counts?: Json | null;
          topic_trends?: Json | null;
          total_messages?: number | null;
          url_analysis?: Json | null;
          vendor_mentions?: Json | null;
        };
        Relationships: [];
      };
      quotes: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          score: number | null;
          season: number | null;
          section_id: string | null;
          speaker: string | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          score?: number | null;
          season?: number | null;
          section_id?: string | null;
          speaker?: string | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          score?: number | null;
          season?: number | null;
          section_id?: string | null;
          speaker?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "quotes_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "wiki_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      wiki_content_blocks: {
        Row: {
          accent_color: string | null;
          block_order: number | null;
          block_type: string;
          content: Json;
          id: string;
          is_verified: boolean | null;
          season_added: number | null;
          section_id: string | null;
          title: string | null;
          updated_at: string | null;
          verified_year: number | null;
        };
        Insert: {
          accent_color?: string | null;
          block_order?: number | null;
          block_type: string;
          content: Json;
          id?: string;
          is_verified?: boolean | null;
          season_added?: number | null;
          section_id?: string | null;
          title?: string | null;
          updated_at?: string | null;
          verified_year?: number | null;
        };
        Update: {
          accent_color?: string | null;
          block_order?: number | null;
          block_type?: string;
          content?: Json;
          id?: string;
          is_verified?: boolean | null;
          season_added?: number | null;
          section_id?: string | null;
          title?: string | null;
          updated_at?: string | null;
          verified_year?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "wiki_content_blocks_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "wiki_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      wiki_sections: {
        Row: {
          description: string | null;
          icon: string | null;
          id: string;
          is_published: boolean | null;
          nav_group: string | null;
          nav_order: number | null;
          slug: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_published?: boolean | null;
          nav_group?: string | null;
          nav_order?: number | null;
          slug: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_published?: boolean | null;
          nav_group?: string | null;
          nav_order?: number | null;
          slug?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type WikiSection = Database["public"]["Tables"]["wiki_sections"]["Row"];
export type AnalyticsSnapshot =
  Database["public"]["Tables"]["analytics_snapshots"]["Row"];
