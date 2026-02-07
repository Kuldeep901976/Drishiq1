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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      access_control_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          new_access_level: string | null
          old_access_level: string | null
          performed_by: string
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_access_level?: string | null
          old_access_level?: string | null
          performed_by: string
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_access_level?: string | null
          old_access_level?: string | null
          performed_by?: string
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "access_control_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_control_logs_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_control_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "access_control_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_invitations: {
        Row: {
          accepted_at: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          created_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          name: string
          permissions: string[] | null
          role: string
          status: string | null
        }
        Insert: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          invited_by: string
          name: string
          permissions?: string[] | null
          role: string
          status?: string | null
        }
        Update: {
          accepted_at?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          name?: string
          permissions?: string[] | null
          role?: string
          status?: string | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          id: string
          is_active: boolean
          last_login: string | null
          name: string | null
          notes: string | null
          permissions: string[] | null
          phone: string | null
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          notes?: string | null
          permissions?: string[] | null
          phone?: string | null
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          id?: string
          is_active?: boolean
          last_login?: string | null
          name?: string | null
          notes?: string | null
          permissions?: string[] | null
          phone?: string | null
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_admin_users_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_admin_users_user_id"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          affiliate_code: string
          affiliate_email: string
          affiliate_name: string
          commission_rate: number | null
          created_at: string | null
          id: string
          status: string | null
        }
        Insert: {
          affiliate_code: string
          affiliate_email: string
          affiliate_name: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Update: {
          affiliate_code?: string
          affiliate_email?: string
          affiliate_name?: string
          commission_rate?: number | null
          created_at?: string | null
          id?: string
          status?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_comments: {
        Row: {
          author_email: string
          author_name: string
          blog_post_id: string
          content: string
          created_at: string | null
          id: string
          is_approved: boolean | null
          parent_comment_id: string | null
          updated_at: string | null
        }
        Insert: {
          author_email: string
          author_name: string
          blog_post_id: string
          content: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Update: {
          author_email?: string
          author_name?: string
          blog_post_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_approved?: boolean | null
          parent_comment_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_comments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blog_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "blog_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_likes: {
        Row: {
          blog_post_id: string
          created_at: string | null
          id: string
          ip_address: unknown | null
          user_id: string | null
        }
        Insert: {
          blog_post_id: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Update: {
          blog_post_id?: string
          created_at?: string | null
          id?: string
          ip_address?: unknown | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_likes_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_media_attachments: {
        Row: {
          alt_text: string | null
          blog_post_id: string
          created_at: string | null
          id: string
          media_file_id: string | null
          media_type: string
          position_in_content: number | null
        }
        Insert: {
          alt_text?: string | null
          blog_post_id: string
          created_at?: string | null
          id?: string
          media_file_id?: string | null
          media_type: string
          position_in_content?: number | null
        }
        Update: {
          alt_text?: string | null
          blog_post_id?: string
          created_at?: string | null
          id?: string
          media_file_id?: string | null
          media_type?: string
          position_in_content?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_media_attachments_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          admin_notes: string | null
          approval_date: string | null
          author: string
          author_bio: string | null
          author_email: string | null
          author_id: string | null
          category: string
          comments_count: number | null
          content: string
          created_at: string | null
          engagement_score: number | null
          excerpt: string | null
          featured_date: string | null
          featured_image: string | null
          featured_media_id: string | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          is_featured_on_landing: boolean | null
          is_resubmission: boolean | null
          likes_count: number | null
          meta_keywords: string[] | null
          previous_version_id: string | null
          publish_date: string | null
          read_time: number | null
          reading_time_minutes: number | null
          seo_description: string | null
          seo_keywords: string | null
          seo_slug: string | null
          seo_title: string | null
          slug: string
          social_image: string | null
          status: string | null
          submission_date: string | null
          submission_type: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          updated_by: string | null
          version: number | null
          views_count: number | null
          word_count: number | null
        }
        Insert: {
          admin_notes?: string | null
          approval_date?: string | null
          author: string
          author_bio?: string | null
          author_email?: string | null
          author_id?: string | null
          category: string
          comments_count?: number | null
          content: string
          created_at?: string | null
          engagement_score?: number | null
          excerpt?: string | null
          featured_date?: string | null
          featured_image?: string | null
          featured_media_id?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_featured_on_landing?: boolean | null
          is_resubmission?: boolean | null
          likes_count?: number | null
          meta_keywords?: string[] | null
          previous_version_id?: string | null
          publish_date?: string | null
          read_time?: number | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          slug: string
          social_image?: string | null
          status?: string | null
          submission_date?: string | null
          submission_type?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          views_count?: number | null
          word_count?: number | null
        }
        Update: {
          admin_notes?: string | null
          approval_date?: string | null
          author?: string
          author_bio?: string | null
          author_email?: string | null
          author_id?: string | null
          category?: string
          comments_count?: number | null
          content?: string
          created_at?: string | null
          engagement_score?: number | null
          excerpt?: string | null
          featured_date?: string | null
          featured_image?: string | null
          featured_media_id?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_featured_on_landing?: boolean | null
          is_resubmission?: boolean | null
          likes_count?: number | null
          meta_keywords?: string[] | null
          previous_version_id?: string | null
          publish_date?: string | null
          read_time?: number | null
          reading_time_minutes?: number | null
          seo_description?: string | null
          seo_keywords?: string | null
          seo_slug?: string | null
          seo_title?: string | null
          slug?: string
          social_image?: string | null
          status?: string | null
          submission_date?: string | null
          submission_type?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          updated_by?: string | null
          version?: number | null
          views_count?: number | null
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_previous_version_id_fkey"
            columns: ["previous_version_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_suggestions: {
        Row: {
          additional_details: string | null
          allow_contact: boolean | null
          category: string
          contact_email: string | null
          created_at: string | null
          description: string
          id: number
          impact: string
          priority: string
          status: string | null
          submitter_name: string | null
          submitter_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          additional_details?: string | null
          allow_contact?: boolean | null
          category: string
          contact_email?: string | null
          created_at?: string | null
          description: string
          id?: number
          impact: string
          priority: string
          status?: string | null
          submitter_name?: string | null
          submitter_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          additional_details?: string | null
          allow_contact?: boolean | null
          category?: string
          contact_email?: string | null
          created_at?: string | null
          description?: string
          id?: number
          impact?: string
          priority?: string
          status?: string | null
          submitter_name?: string | null
          submitter_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "companies_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "companies_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_permissions_catalog: {
        Row: {
          category: string
          company_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_dangerous: boolean | null
          is_system_permission: boolean | null
          permission_key: string
          permission_name: string
          updated_at: string | null
        }
        Insert: {
          category: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_dangerous?: boolean | null
          is_system_permission?: boolean | null
          permission_key: string
          permission_name: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          company_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_dangerous?: boolean | null
          is_system_permission?: boolean | null
          permission_key?: string
          permission_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      company_user_permissions: {
        Row: {
          company_user_id: string
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          notes: string | null
          permission_key: string
        }
        Insert: {
          company_user_id: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permission_key: string
        }
        Update: {
          company_user_id?: string
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          notes?: string | null
          permission_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_user_permissions_company_user_id_fkey"
            columns: ["company_user_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_user_permissions_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "enterprise_admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      company_users: {
        Row: {
          accepted_at: string | null
          access_level: string | null
          company_id: string
          created_at: string | null
          department: string | null
          email: string
          employee_id: string | null
          first_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          manager_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          access_level?: string | null
          company_id: string
          created_at?: string | null
          department?: string | null
          email: string
          employee_id?: string | null
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          access_level?: string | null
          company_id?: string
          created_at?: string | null
          department?: string | null
          email?: string
          employee_id?: string | null
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          manager_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "enterprise_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_users_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "company_users"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          country_code: string
          country_name: string
          created_at: string | null
          currency_code: string
          currency_symbol: string | null
          drishiq_category: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string | null
          currency_code: string
          currency_symbol?: string | null
          drishiq_category?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string | null
          currency_code?: string
          currency_symbol?: string | null
          drishiq_category?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      currency_rates: {
        Row: {
          created_at: string | null
          currency_code: string
          current_rate: number
          fluctuation_percentage: number | null
          id: string
          last_updated: string | null
          previous_rate: number | null
        }
        Insert: {
          created_at?: string | null
          currency_code: string
          current_rate: number
          fluctuation_percentage?: number | null
          id?: string
          last_updated?: string | null
          previous_rate?: number | null
        }
        Update: {
          created_at?: string | null
          currency_code?: string
          current_rate?: number
          fluctuation_percentage?: number | null
          id?: string
          last_updated?: string | null
          previous_rate?: number | null
        }
        Relationships: []
      }
      demo_invitations: {
        Row: {
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          demo_name: string
          expires_at: string
          features_enabled: string[] | null
          id: string
          max_uses: number | null
          token: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          demo_name: string
          expires_at: string
          features_enabled?: string[] | null
          id?: string
          max_uses?: number | null
          token: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          demo_name?: string
          expires_at?: string
          features_enabled?: string[] | null
          id?: string
          max_uses?: number | null
          token?: string
        }
        Relationships: []
      }
      early_access_requests: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
          requested_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          name?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
          requested_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          email: string
          is_active: boolean
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          email: string
          is_active?: boolean
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          email?: string
          is_active?: boolean
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_admin_roles: {
        Row: {
          company_id: string
          created_at: string | null
          id: string
          is_system_role: boolean | null
          max_assignments: number | null
          permissions: string[]
          role_description: string | null
          role_name: string
          updated_at: string | null
        }
        Insert: {
          company_id: string
          created_at?: string | null
          id?: string
          is_system_role?: boolean | null
          max_assignments?: number | null
          permissions: string[]
          role_description?: string | null
          role_name: string
          updated_at?: string | null
        }
        Update: {
          company_id?: string
          created_at?: string | null
          id?: string
          is_system_role?: boolean | null
          max_assignments?: number | null
          permissions?: string[]
          role_description?: string | null
          role_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      enterprise_admin_users: {
        Row: {
          accepted_at: string | null
          company_id: string
          created_at: string | null
          custom_permissions: string[] | null
          email: string
          first_name: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          is_primary_admin: boolean | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          role_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          company_id: string
          created_at?: string | null
          custom_permissions?: string[] | null
          email: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          company_id?: string
          created_at?: string | null
          custom_permissions?: string[] | null
          email?: string
          first_name?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          is_primary_admin?: boolean | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          role_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_admin_users_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "enterprise_admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_admin_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "enterprise_admin_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      enterprise_user_credits: {
        Row: {
          allocated_credits: number | null
          created_at: string
          id: string
          organization_id: string
          updated_at: string
          used_credits: number | null
          user_id: string
        }
        Insert: {
          allocated_credits?: number | null
          created_at?: string
          id?: string
          organization_id: string
          updated_at?: string
          used_credits?: number | null
          user_id: string
        }
        Update: {
          allocated_credits?: number | null
          created_at?: string
          id?: string
          organization_id?: string
          updated_at?: string
          used_credits?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enterprise_user_credits_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enterprise_user_credits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      global_pricing: {
        Row: {
          base_price: number
          country_id: string | null
          created_at: string | null
          currency_code: string
          id: string
          is_active: boolean | null
          plan_type_id: string | null
          pricing_mode_id: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          country_id?: string | null
          created_at?: string | null
          currency_code: string
          id?: string
          is_active?: boolean | null
          plan_type_id?: string | null
          pricing_mode_id?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          country_id?: string | null
          created_at?: string | null
          currency_code?: string
          id?: string
          is_active?: boolean | null
          plan_type_id?: string | null
          pricing_mode_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "global_pricing_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_pricing_plan_type_id_fkey"
            columns: ["plan_type_id"]
            isOneToOne: false
            referencedRelation: "plan_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "global_pricing_pricing_mode_id_fkey"
            columns: ["pricing_mode_id"]
            isOneToOne: false
            referencedRelation: "pricing_modes"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_credits: {
        Row: {
          created_at: string | null
          created_by: string | null
          credits_allocated: number
          credits_used: number
          id: string
          invitation_id: number
          reason: string
          status: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          credits_allocated?: number
          credits_used?: number
          id?: string
          invitation_id: number
          reason: string
          status?: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          credits_allocated?: number
          credits_used?: number
          id?: string
          invitation_id?: number
          reason?: string
          status?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          approved_at: string | null
          category:
            | Database["public"]["Enums"]["invitation_category_enum"]
            | null
          challenge: string | null
          challenge_domain: string | null
          challenge_specific: string | null
          challenge_sub_category: string | null
          country: string | null
          country_code: string | null
          created_at: string
          email: string
          id: string
          invitation_request: string | null
          invitation_status: string | null
          invited_at: string | null
          language: string
          location: string | null
          name: string
          phone: string
          phone_authentication: string | null
          phone_combined: string
          rejected_at: string | null
          share_challenge: string | null
          status: string
          updated_at: string | null
          used_at: string | null
          video_url: string | null
        }
        Insert: {
          approved_at?: string | null
          category?:
            | Database["public"]["Enums"]["invitation_category_enum"]
            | null
          challenge?: string | null
          challenge_domain?: string | null
          challenge_specific?: string | null
          challenge_sub_category?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email: string
          id?: string
          invitation_request?: string | null
          invitation_status?: string | null
          invited_at?: string | null
          language: string
          location?: string | null
          name: string
          phone: string
          phone_authentication?: string | null
          phone_combined: string
          rejected_at?: string | null
          share_challenge?: string | null
          status?: string
          updated_at?: string | null
          used_at?: string | null
          video_url?: string | null
        }
        Update: {
          approved_at?: string | null
          category?:
            | Database["public"]["Enums"]["invitation_category_enum"]
            | null
          challenge?: string | null
          challenge_domain?: string | null
          challenge_specific?: string | null
          challenge_sub_category?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string
          email?: string
          id?: string
          invitation_request?: string | null
          invitation_status?: string | null
          invited_at?: string | null
          language?: string
          location?: string | null
          name?: string
          phone?: string
          phone_authentication?: string | null
          phone_combined?: string
          rejected_at?: string | null
          share_challenge?: string | null
          status?: string
          updated_at?: string | null
          used_at?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          admin_user_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          settings: Json | null
          total_credits: number | null
          used_credits: number | null
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          settings?: Json | null
          total_credits?: number | null
          used_credits?: number | null
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          settings?: Json | null
          total_credits?: number | null
          used_credits?: number | null
        }
        Relationships: []
      }
      plan_types: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          plan_code: string
          plan_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_code: string
          plan_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          plan_code?: string
          plan_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          credits_included: number
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          name: string
          price_usd: number
          target_region: string[] | null
          validity_days: number
        }
        Insert: {
          created_at?: string | null
          credits_included: number
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          price_usd: number
          target_region?: string[] | null
          validity_days: number
        }
        Update: {
          created_at?: string | null
          credits_included?: number
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          price_usd?: number
          target_region?: string[] | null
          validity_days?: number
        }
        Relationships: []
      }
      pricing_heads: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_additive: boolean | null
          is_percentage: boolean | null
          name: string
          priority: number | null
          type: string
          updated_at: string | null
          value: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_additive?: boolean | null
          is_percentage?: boolean | null
          name: string
          priority?: number | null
          type: string
          updated_at?: string | null
          value: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_additive?: boolean | null
          is_percentage?: boolean | null
          name?: string
          priority?: number | null
          type?: string
          updated_at?: string | null
          value?: number
        }
        Relationships: []
      }
      pricing_history: {
        Row: {
          action: string
          changed_at: string | null
          changed_by: string | null
          id: string
          new_values: Json | null
          old_values: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          changed_at?: string | null
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: []
      }
      pricing_modes: {
        Row: {
          created_at: string | null
          description: string | null
          display_name: string
          id: string
          is_active: boolean | null
          mode_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          mode_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          mode_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          referral_code: string
          referred_email: string
          referred_user_id: string | null
          referrer_id: string | null
          reward_credits: number | null
          status: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code: string
          referred_email: string
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_credits?: number | null
          status?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_credits?: number | null
          status?: string | null
        }
        Relationships: []
      }
      role_templates: {
        Row: {
          created_at: string | null
          id: string
          is_system_template: boolean | null
          permissions: string[]
          role_description: string | null
          template_name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_system_template?: boolean | null
          permissions: string[]
          role_description?: string | null
          template_name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_system_template?: boolean | null
          permissions?: string[]
          role_description?: string | null
          template_name?: string
        }
        Relationships: []
      }
      stories: {
        Row: {
          category: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          language: string | null
          phone: string | null
          status: string | null
          story_content: string | null
          story_title: string | null
          tags: string[] | null
          uniqueness_score: number | null
          updated_at: string | null
          urgency_level: string | null
          views_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          phone?: string | null
          status?: string | null
          story_content?: string | null
          story_title?: string | null
          tags?: string[] | null
          uniqueness_score?: number | null
          updated_at?: string | null
          urgency_level?: string | null
          views_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          language?: string | null
          phone?: string | null
          status?: string | null
          story_content?: string | null
          story_title?: string | null
          tags?: string[] | null
          uniqueness_score?: number | null
          updated_at?: string | null
          urgency_level?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      story_invitations: {
        Row: {
          created_at: string | null
          id: string
          invitation_id: number
          is_featured: boolean | null
          story_category: string | null
          story_summary: string | null
          story_title: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_id: number
          is_featured?: boolean | null
          story_category?: string | null
          story_summary?: string | null
          story_title?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_id?: number
          is_featured?: boolean | null
          story_category?: string | null
          story_summary?: string | null
          story_title?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          created_at: string | null
          credits_remaining: number
          expires_at: string
          id: string
          payment_id: string | null
          plan_id: string | null
          starts_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          created_at?: string | null
          credits_remaining: number
          expires_at: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          created_at?: string | null
          credits_remaining?: number
          expires_at?: string
          id?: string
          payment_id?: string | null
          plan_id?: string | null
          starts_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      support_badges: {
        Row: {
          amount: number
          anonymous: boolean | null
          badge_url: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          support_level: string
          supporter_name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          anonymous?: boolean | null
          badge_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          support_level: string
          supporter_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          anonymous?: boolean | null
          badge_url?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          support_level?: string
          supporter_name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      support_pricing: {
        Row: {
          base_price: number
          country_id: string | null
          created_at: string | null
          currency_code: string
          id: string
          is_active: boolean | null
          support_level: string
          updated_at: string | null
        }
        Insert: {
          base_price: number
          country_id?: string | null
          created_at?: string | null
          currency_code: string
          id?: string
          is_active?: boolean | null
          support_level: string
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          country_id?: string | null
          created_at?: string | null
          currency_code?: string
          id?: string
          is_active?: boolean | null
          support_level?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_pricing_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      supporters: {
        Row: {
          availability: string | null
          created_at: string | null
          domain: string | null
          email: string | null
          id: string
          issue: string | null
          location: string | null
          matched_with: string[] | null
          mode: string
          name: string | null
          notes: string | null
          open_to_all: boolean | null
          other_text: string | null
          phone: string | null
          status: string | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          issue?: string | null
          location?: string | null
          matched_with?: string[] | null
          mode: string
          name?: string | null
          notes?: string | null
          open_to_all?: boolean | null
          other_text?: string | null
          phone?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          created_at?: string | null
          domain?: string | null
          email?: string | null
          id?: string
          issue?: string | null
          location?: string | null
          matched_with?: string[] | null
          mode?: string
          name?: string | null
          notes?: string | null
          open_to_all?: boolean | null
          other_text?: string | null
          phone?: string | null
          status?: string | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      testimonial_invitations: {
        Row: {
          created_at: string | null
          id: string
          invitation_id: number
          is_featured: boolean | null
          rating: number | null
          testimonial_category: string | null
          testimonial_summary: string | null
          testimonial_type: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_id: number
          is_featured?: boolean | null
          rating?: number | null
          testimonial_category?: string | null
          testimonial_summary?: string | null
          testimonial_type?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_id?: number
          is_featured?: boolean | null
          rating?: number | null
          testimonial_category?: string | null
          testimonial_summary?: string | null
          testimonial_type?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          admin_notes: string | null
          consent_given: boolean | null
          content: string
          created_at: string | null
          id: string
          invitation_id: string | null
          is_approved: boolean | null
          is_published: boolean | null
          published_at: string | null
          rating: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          consent_given?: boolean | null
          content: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          is_approved?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          consent_given?: boolean | null
          content?: string
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          is_approved?: boolean | null
          is_published?: boolean | null
          published_at?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_activity_feed: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string | null
          id: string
          is_public: boolean | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_activity_feed_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_analytics: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          ip_address: unknown | null
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      user_dashboard_preferences: {
        Row: {
          created_at: string | null
          dashboard_layout: Json | null
          id: string
          notification_preferences: Json | null
          theme_preference: string | null
          updated_at: string | null
          user_id: string | null
          widget_settings: Json | null
        }
        Insert: {
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          notification_preferences?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
          widget_settings?: Json | null
        }
        Update: {
          created_at?: string | null
          dashboard_layout?: Json | null
          id?: string
          notification_preferences?: Json | null
          theme_preference?: string | null
          updated_at?: string | null
          user_id?: string | null
          widget_settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "user_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_dashboard_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_flow_progress: {
        Row: {
          completed_steps: string[] | null
          created_at: string
          current_step: string
          id: string
          updated_at: string
          user_data: Json | null
          user_id: string | null
        }
        Insert: {
          completed_steps?: string[] | null
          created_at?: string
          current_step: string
          id?: string
          updated_at?: string
          user_data?: Json | null
          user_id?: string | null
        }
        Update: {
          completed_steps?: string[] | null
          created_at?: string
          current_step?: string
          id?: string
          updated_at?: string
          user_data?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_goals: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          progress_percentage: number | null
          status: string | null
          target_date: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          progress_percentage?: number | null
          status?: string | null
          target_date?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          bio: string | null
          company: string | null
          completed_at: string | null
          created_at: string | null
          date_of_birth: string | null
          experience_level: string | null
          full_name: string | null
          id: string
          industry: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          profile_completed: boolean | null
          role: string | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          bio?: string | null
          company?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          bio?: string | null
          company?: string | null
          completed_at?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          experience_level?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_sessions: {
        Row: {
          browser: string | null
          business_metrics: Json | null
          created_at: string | null
          device_info: Json | null
          device_type: string | null
          expires_at: string | null
          id: string
          ip_address: unknown | null
          is_active: boolean | null
          last_activity_at: string | null
          location_city: string | null
          location_country: string | null
          location_info: Json | null
          location_region: string | null
          login_at: string | null
          logout_at: string | null
          os: string | null
          resource_consumption: Json | null
          session_duration_minutes: number | null
          session_token: string | null
          session_type: string
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          browser?: string | null
          business_metrics?: Json | null
          created_at?: string | null
          device_info?: Json | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_info?: Json | null
          location_region?: string | null
          login_at?: string | null
          logout_at?: string | null
          os?: string | null
          resource_consumption?: Json | null
          session_duration_minutes?: number | null
          session_token?: string | null
          session_type: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: string | null
          business_metrics?: Json | null
          created_at?: string | null
          device_info?: Json | null
          device_type?: string | null
          expires_at?: string | null
          id?: string
          ip_address?: unknown | null
          is_active?: boolean | null
          last_activity_at?: string | null
          location_city?: string | null
          location_country?: string | null
          location_info?: Json | null
          location_region?: string | null
          login_at?: string | null
          logout_at?: string | null
          os?: string | null
          resource_consumption?: Json | null
          session_duration_minutes?: number | null
          session_token?: string | null
          session_type?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_admin_view"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          access_level: string | null
          affiliate_id: string | null
          auth_provider: string
          avatar_selection: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          country: string | null
          created_at: string
          credits: number | null
          date_of_birth: string | null
          display_name: string | null
          early_access_date: string | null
          email: string | null
          email_verified: boolean | null
          extended_pricing_until: string | null
          first_name: string | null
          founder_citizen_badge: boolean | null
          gender: string | null
          id: string
          is_active: boolean | null
          is_profile_complete: boolean | null
          last_name: string | null
          last_sign_in: string | null
          location: string | null
          login_method: string | null
          occupation: string | null
          permissions: Json | null
          phone: string | null
          phone_verified: boolean | null
          plan_id: string | null
          preferences: Json | null
          preferred_language: string
          profile_completion_score: number | null
          profile_image: string | null
          referred_by: string | null
          role: string | null
          social_links: Json | null
          special_pricing_applied: boolean | null
          timezone: string | null
          updated_at: string | null
          user_id: string | null
          user_type: string | null
          username: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          access_level?: string | null
          affiliate_id?: string | null
          auth_provider: string
          avatar_selection?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credits?: number | null
          date_of_birth?: string | null
          display_name?: string | null
          early_access_date?: string | null
          email?: string | null
          email_verified?: boolean | null
          extended_pricing_until?: string | null
          first_name?: string | null
          founder_citizen_badge?: boolean | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          last_name?: string | null
          last_sign_in?: string | null
          location?: string | null
          login_method?: string | null
          occupation?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verified?: boolean | null
          plan_id?: string | null
          preferences?: Json | null
          preferred_language?: string
          profile_completion_score?: number | null
          profile_image?: string | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          special_pricing_applied?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          username?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          access_level?: string | null
          affiliate_id?: string | null
          auth_provider?: string
          avatar_selection?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          credits?: number | null
          date_of_birth?: string | null
          display_name?: string | null
          early_access_date?: string | null
          email?: string | null
          email_verified?: boolean | null
          extended_pricing_until?: string | null
          first_name?: string | null
          founder_citizen_badge?: boolean | null
          gender?: string | null
          id?: string
          is_active?: boolean | null
          is_profile_complete?: boolean | null
          last_name?: string | null
          last_sign_in?: string | null
          location?: string | null
          login_method?: string | null
          occupation?: string | null
          permissions?: Json | null
          phone?: string | null
          phone_verified?: boolean | null
          plan_id?: string | null
          preferences?: Json | null
          preferred_language?: string
          profile_completion_score?: number | null
          profile_image?: string | null
          referred_by?: string | null
          role?: string | null
          social_links?: Json | null
          special_pricing_applied?: boolean | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_type?: string | null
          username?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      verification_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          is_used: boolean | null
          phone: string
          user_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          is_used?: boolean | null
          phone: string
          user_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_used?: boolean | null
          phone?: string
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      user_admin_view: {
        Row: {
          admin_is_active: boolean | null
          created_at: string | null
          email: string | null
          id: string | null
          is_profile_complete: boolean | null
          permissions: string[] | null
          phone_verified: boolean | null
          role: string | null
          updated_at: string | null
          user_type: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_new_country: {
        Args: {
          p_country_code: string
          p_country_name: string
          p_currency_code: string
          p_currency_symbol: string
          p_drishiq_category: string
          p_tax_rate?: number
        }
        Returns: undefined
      }
      add_new_plan: {
        Args: {
          p_base_price_usd: number
          p_credits_included?: number
          p_features?: Json
          p_max_sessions_per_month?: number
          p_max_users?: number
          p_plan_code: string
          p_plan_description?: string
          p_plan_name: string
          p_sort_order?: number
        }
        Returns: undefined
      }
      bulk_update_pricing: {
        Args: {
          p_bulk_reason?: string
          p_country_codes: string[]
          p_discount_percentage: number
          p_plan_codes: string[]
          p_pricing_modes: string[]
        }
        Returns: number
      }
      can_access_chat: {
        Args: { chat_id: string; user_id: string } | { user_id: string }
        Returns: boolean
      }
      can_access_feature: {
        Args: { feature_name: string; user_id: string }
        Returns: boolean
      }
      can_access_user_data: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      check_admin_access: {
        Args: { user_email: string }
        Returns: {
          is_admin: boolean
          permissions: string[]
          role: string
          user_type: string
        }[]
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      cleanup_expired_sessions: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_company_with_defaults: {
        Args: {
          p_billing_email: string
          p_company_name: string
          p_company_slug: string
          p_owner_email: string
          p_owner_first_name: string
          p_owner_last_name: string
        }
        Returns: string
      }
      customize_pricing: {
        Args: {
          p_country_code: string
          p_custom_reason: string
          p_discount_percentage: number
          p_local_price: number
          p_plan_code: string
          p_pricing_mode: string
          p_tax_rate: number
        }
        Returns: undefined
      }
      end_user_session: {
        Args: { p_session_token: string }
        Returns: undefined
      }
      enterprise_create_user: {
        Args: { email: string; full_name: string; role?: string }
        Returns: string
      }
      enterprise_get_organization_members: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          credits: number
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      get_company_user_permissions: {
        Args: { p_company_id: string; p_user_email: string }
        Returns: {
          category: string
          is_dangerous: boolean
          permission_key: string
          permission_name: string
          source: string
        }[]
      }
      get_featured_blog_posts: {
        Args: { limit_count?: number }
        Returns: {
          author: string
          created_at: string
          excerpt: string
          id: string
          likes_count: number
          title: string
        }[]
      }
      get_pricing_summary: {
        Args: {
          p_country_code?: string
          p_plan_code?: string
          p_pricing_mode?: string
        }
        Returns: {
          base_price_usd: number
          country_code: string
          country_name: string
          credits_included: number
          currency_symbol: string
          discount_percentage: number
          features: Json
          final_price: number
          local_price: number
          plan_code: string
          plan_name: string
          pricing_mode: string
          tax_rate: number
        }[]
      }
      get_user_access_level: {
        Args: { target_user_id: string }
        Returns: string
      }
      get_user_next_route: {
        Args: { user_id: string }
        Returns: string
      }
      get_user_permissions: {
        Args: { user_email: string }
        Returns: string[]
      }
      get_user_role: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: string
      }
      get_user_role_safe: {
        Args: Record<PropertyKey, never> | { user_id: string }
        Returns: string
      }
      has_company_permission: {
        Args: {
          p_company_id: string
          p_permission_key: string
          p_user_email: string
        }
        Returns: boolean
      }
      log_pricing_changes: {
        Args: {
          change_type: string
          new_values: Json
          old_values: Json
          record_id: string
          table_name: string
        }
        Returns: boolean
      }
      set_admin_user: {
        Args: {
          admin_email: string
          admin_permissions?: Json
          admin_role?: string
        }
        Returns: undefined
      }
      set_location_discount: {
        Args: {
          p_country_code: string
          p_discount_percentage: number
          p_discount_reason?: string
          p_plan_code: string
          p_pricing_mode: string
        }
        Returns: undefined
      }
      track_user_session: {
        Args: {
          p_login_method: string
          p_user_id: string
          p_user_type?: string
        }
        Returns: string
      }
      update_blog_counts: {
        Args: { blog_id: string }
        Returns: boolean
      }
      update_currency_rate: {
        Args: {
          p_currency_code: string
          p_new_rate: number
          p_update_source?: string
        }
        Returns: undefined
      }
      update_session_activity: {
        Args: {
          p_api_calls?: number
          p_conversion_events?: number
          p_credits_used?: number
          p_data_transferred?: number
          p_exit_page?: string
          p_page_views?: number
          p_payment_events?: number
          p_session_token: string
          p_support_requests?: number
        }
        Returns: undefined
      }
      update_user_access_level: {
        Args:
          | {
              new_access_level: string
              performed_by: string
              reason: string
              target_user_id: string
            }
          | { new_level: string; user_id: string }
        Returns: boolean
      }
      upsert_user: {
        Args:
          | {
              user_auth_provider?: string
              user_email: string
              user_email_verified: boolean
              user_id: string
              user_login_method: string
            }
          | {
              user_email: string
              user_email_verified?: boolean
              user_id: string
              user_log?: boolean
            }
          | { user_email: string; user_full_name: string; user_role?: string }
        Returns: undefined
      }
      upsert_user_profile: {
        Args:
          | { profile_data: Json; user_id: string }
          | {
              user_email: string
              user_email_verified: boolean
              user_id: string
              user_login_method: string
            }
        Returns: undefined
      }
    }
    Enums: {
      invitation_category:
        | "story"
        | "testimonial"
        | "general"
        | "trial"
        | "support"
        | "enterprise"
      invitation_category_enum:
        | "trial"
        | "need_support"
        | "testimonials"
        | "bulk_uploaded"
        | "adopter"
        | "builder"
        | "general"
      invitation_request_enum: "success" | "failed"
      invitation_status_enum: "pending" | "approved" | "rejected"
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
      invitation_category: [
        "story",
        "testimonial",
        "general",
        "trial",
        "support",
        "enterprise",
      ],
      invitation_category_enum: [
        "trial",
        "need_support",
        "testimonials",
        "bulk_uploaded",
        "adopter",
        "builder",
        "general",
      ],
      invitation_request_enum: ["success", "failed"],
      invitation_status_enum: ["pending", "approved", "rejected"],
    },
  },
} as const
