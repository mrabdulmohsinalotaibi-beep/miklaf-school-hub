export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

/**
 * Database schema types for the Miklaf school platform.
 *
 * Regenerate after every migration so the client stays type-safe against the
 * real columns, enums and functions:
 *
 *   npx supabase gen types typescript --db-url "$DATABASE_URL" > src/integrations/supabase/types.ts
 */
export type Database = {
  public: {
    Tables: {
      academic_years: {
        Row: {
          ends_on: string | null;
          id: string;
          is_current: boolean;
          name: string;
          school_id: string;
          starts_on: string | null;
        };
        Insert: {
          ends_on?: string | null;
          id?: string;
          is_current?: boolean;
          name: string;
          school_id: string;
          starts_on?: string | null;
        };
        Update: {
          ends_on?: string | null;
          id?: string;
          is_current?: boolean;
          name?: string;
          school_id?: string;
          starts_on?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "academic_years_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      announcements: {
        Row: {
          audience: string;
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_demo: boolean;
          school_id: string | null;
          title: string;
        };
        Insert: {
          audience?: string;
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          school_id?: string | null;
          title: string;
        };
        Update: {
          audience?: string;
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          school_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      appointments: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_demo: boolean;
          location: string | null;
          school_id: string | null;
          starts_at: string;
          status: string;
          student_id: string | null;
          title: string;
          type: string;
          with_person: string | null;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_demo?: boolean;
          location?: string | null;
          school_id?: string | null;
          starts_at?: string;
          status?: string;
          student_id?: string | null;
          title: string;
          type?: string;
          with_person?: string | null;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          is_demo?: boolean;
          location?: string | null;
          school_id?: string | null;
          starts_at?: string;
          status?: string;
          student_id?: string | null;
          title?: string;
          type?: string;
          with_person?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "appointments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      approvals: {
        Row: {
          comment: string | null;
          created_at: string;
          entity_id: string;
          entity_type: string;
          id: string;
          reviewed_at: string | null;
          reviewer_id: string | null;
          school_id: string | null;
          sender_id: string;
          status: string;
        };
        Insert: {
          comment?: string | null;
          created_at?: string;
          entity_id: string;
          entity_type: string;
          id?: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          school_id?: string | null;
          sender_id: string;
          status?: string;
        };
        Update: {
          comment?: string | null;
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          id?: string;
          reviewed_at?: string | null;
          reviewer_id?: string | null;
          school_id?: string | null;
          sender_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "approvals_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      attachments: {
        Row: {
          created_at: string;
          entity_id: string;
          entity_type: string;
          file_name: string;
          file_type: string | null;
          file_url: string;
          id: string;
          school_id: string | null;
          uploaded_by: string;
        };
        Insert: {
          created_at?: string;
          entity_id: string;
          entity_type: string;
          file_name: string;
          file_type?: string | null;
          file_url: string;
          id?: string;
          school_id?: string | null;
          uploaded_by: string;
        };
        Update: {
          created_at?: string;
          entity_id?: string;
          entity_type?: string;
          file_name?: string;
          file_type?: string | null;
          file_url?: string;
          id?: string;
          school_id?: string | null;
          uploaded_by?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attachments_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance: {
        Row: {
          created_at: string;
          date: string;
          id: string;
          is_demo: boolean;
          note: string | null;
          recorded_by: string | null;
          school_id: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        Insert: {
          created_at?: string;
          date?: string;
          id?: string;
          is_demo?: boolean;
          note?: string | null;
          recorded_by?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
        };
        Update: {
          created_at?: string;
          date?: string;
          id?: string;
          is_demo?: boolean;
          note?: string | null;
          recorded_by?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          entity_id: string | null;
          entity_type: string;
          id: string;
          new_data: Json | null;
          old_data: Json | null;
          school_id: string | null;
          user_id: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          school_id?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          new_data?: Json | null;
          old_data?: Json | null;
          school_id?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "audit_logs_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      case_notes: {
        Row: {
          author_id: string | null;
          body: string;
          case_id: string;
          created_at: string;
          id: string;
          is_demo: boolean;
          school_id: string | null;
        };
        Insert: {
          author_id?: string | null;
          body: string;
          case_id: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          school_id?: string | null;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          case_id?: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          school_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "counseling_cases";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "case_notes_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      circulars: {
        Row: {
          audience: string;
          body: string | null;
          created_at: string;
          created_by: string | null;
          id: string;
          issued_date: string;
          school_id: string | null;
          status: string;
          title: string;
        };
        Insert: {
          audience?: string;
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issued_date?: string;
          school_id?: string | null;
          status?: string;
          title: string;
        };
        Update: {
          audience?: string;
          body?: string | null;
          created_at?: string;
          created_by?: string | null;
          id?: string;
          issued_date?: string;
          school_id?: string | null;
          status?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "circulars_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      classes: {
        Row: {
          created_at: string;
          grade: string;
          id: string;
          is_demo: boolean;
          name: string;
          school_id: string | null;
          teacher_name: string | null;
        };
        Insert: {
          created_at?: string;
          grade: string;
          id?: string;
          is_demo?: boolean;
          name: string;
          school_id?: string | null;
          teacher_name?: string | null;
        };
        Update: {
          created_at?: string;
          grade?: string;
          id?: string;
          is_demo?: boolean;
          name?: string;
          school_id?: string | null;
          teacher_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "classes_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      counseling_cases: {
        Row: {
          category: string;
          counselor_id: string | null;
          created_at: string;
          follow_up_date: string | null;
          id: string;
          is_demo: boolean;
          priority: Database["public"]["Enums"]["case_priority"];
          progress: number;
          school_id: string | null;
          status: Database["public"]["Enums"]["case_status"];
          student_id: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          category?: string;
          counselor_id?: string | null;
          created_at?: string;
          follow_up_date?: string | null;
          id?: string;
          is_demo?: boolean;
          priority?: Database["public"]["Enums"]["case_priority"];
          progress?: number;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          student_id?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          category?: string;
          counselor_id?: string | null;
          created_at?: string;
          follow_up_date?: string | null;
          id?: string;
          is_demo?: boolean;
          priority?: Database["public"]["Enums"]["case_priority"];
          progress?: number;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["case_status"];
          student_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counseling_cases_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "counseling_cases_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      internal_messages: {
        Row: {
          attachment_name: string | null;
          attachment_path: string | null;
          body: string;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          school_id: string;
          sender_id: string;
          title: string;
        };
        Insert: {
          attachment_name?: string | null;
          attachment_path?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          school_id: string;
          sender_id: string;
          title: string;
        };
        Update: {
          attachment_name?: string | null;
          attachment_path?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          school_id?: string;
          sender_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "internal_messages_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      member_permissions: {
        Row: {
          allowed: boolean;
          id: string;
          member_id: string;
          permission_key: string;
          scope: string;
        };
        Insert: {
          allowed?: boolean;
          id?: string;
          member_id: string;
          permission_key: string;
          scope?: string;
        };
        Update: {
          allowed?: boolean;
          id?: string;
          member_id?: string;
          permission_key?: string;
          scope?: string;
        };
        Relationships: [
          {
            foreignKeyName: "member_permissions_member_id_fkey";
            columns: ["member_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "member_permissions_permission_key_fkey";
            columns: ["permission_key"];
            isOneToOne: false;
            referencedRelation: "permissions";
            referencedColumns: ["key"];
          },
        ];
      };
      membership_requests: {
        Row: {
          created_at: string;
          id: string;
          requested_role: string;
          reviewed_at: string | null;
          reviewed_by: string | null;
          school_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          requested_role?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          school_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          requested_role?: string;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          school_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "membership_requests_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          body: string | null;
          created_at: string;
          id: string;
          read_at: string | null;
          recipient_id: string;
          school_id: string | null;
          title: string;
          type: string;
        };
        Insert: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id: string;
          school_id?: string | null;
          title: string;
          type?: string;
        };
        Update: {
          body?: string | null;
          created_at?: string;
          id?: string;
          read_at?: string | null;
          recipient_id?: string;
          school_id?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      permissions: {
        Row: {
          category: string;
          id: string;
          key: string;
          label: string;
        };
        Insert: {
          category: string;
          id?: string;
          key: string;
          label: string;
        };
        Update: {
          category?: string;
          id?: string;
          key?: string;
          label?: string;
        };
        Relationships: [];
      };
      plan_tasks: {
        Row: {
          assigned_to: string | null;
          completed_at: string | null;
          created_at: string;
          created_by: string | null;
          description: string | null;
          due_date: string | null;
          evidence_required: boolean;
          form_data: NonNullable<Json>;
          id: string;
          is_demo: boolean;
          owner: string | null;
          progress: number;
          recurrence: string | null;
          school_id: string | null;
          status: Database["public"]["Enums"]["task_status"];
          supervisor_id: string | null;
          template_id: string | null;
          title: string;
          topic: string;
          updated_at: string;
          workflow_status: string;
        };
        Insert: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          evidence_required?: boolean;
          form_data?: NonNullable<Json>;
          id?: string;
          is_demo?: boolean;
          owner?: string | null;
          progress?: number;
          recurrence?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          supervisor_id?: string | null;
          template_id?: string | null;
          title: string;
          topic?: string;
          updated_at?: string;
          workflow_status?: string;
        };
        Update: {
          assigned_to?: string | null;
          completed_at?: string | null;
          created_at?: string;
          created_by?: string | null;
          description?: string | null;
          due_date?: string | null;
          evidence_required?: boolean;
          form_data?: NonNullable<Json>;
          id?: string;
          is_demo?: boolean;
          owner?: string | null;
          progress?: number;
          recurrence?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          supervisor_id?: string | null;
          template_id?: string | null;
          title?: string;
          topic?: string;
          updated_at?: string;
          workflow_status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "plan_tasks_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "plan_tasks_template_id_fkey";
            columns: ["template_id"];
            isOneToOne: false;
            referencedRelation: "workflow_templates";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string;
          full_name: string;
          id: string;
          phone: string | null;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id: string;
          phone?: string | null;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string;
          full_name?: string;
          id?: string;
          phone?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      report_items: {
        Row: {
          entity_id: string | null;
          entity_type: string;
          id: string;
          report_id: string;
          sort_order: number;
          summary: string | null;
          title: string | null;
        };
        Insert: {
          entity_id?: string | null;
          entity_type: string;
          id?: string;
          report_id: string;
          sort_order?: number;
          summary?: string | null;
          title?: string | null;
        };
        Update: {
          entity_id?: string | null;
          entity_type?: string;
          id?: string;
          report_id?: string;
          sort_order?: number;
          summary?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "report_items_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "reports";
            referencedColumns: ["id"];
          },
        ];
      };
      reports: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          period_end: string | null;
          period_start: string | null;
          report_type: string;
          school_id: string | null;
          status: string;
          submitted_to: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          report_type?: string;
          school_id?: string | null;
          status?: string;
          submitted_to?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          period_end?: string | null;
          period_start?: string | null;
          report_type?: string;
          school_id?: string | null;
          status?: string;
          submitted_to?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      school_members: {
        Row: {
          acting_manager_id: string | null;
          id: string;
          joined_at: string;
          manager_id: string | null;
          role: string;
          school_id: string;
          status: string;
          user_id: string;
        };
        Insert: {
          acting_manager_id?: string | null;
          id?: string;
          joined_at?: string;
          manager_id?: string | null;
          role?: string;
          school_id: string;
          status?: string;
          user_id: string;
        };
        Update: {
          acting_manager_id?: string | null;
          id?: string;
          joined_at?: string;
          manager_id?: string | null;
          role?: string;
          school_id?: string;
          status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_members_acting_manager_id_fkey";
            columns: ["acting_manager_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_members_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "school_members";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "school_members_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      school_schedules: {
        Row: {
          created_at: string;
          created_by: string | null;
          details: string | null;
          id: string;
          schedule_date: string | null;
          schedule_type: string;
          school_id: string | null;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          id?: string;
          schedule_date?: string | null;
          schedule_type?: string;
          school_id?: string | null;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          id?: string;
          schedule_date?: string | null;
          schedule_type?: string;
          school_id?: string | null;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_schedules_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      school_settings: {
        Row: {
          academic_year: string;
          city: string;
          id: string;
          ministry_id: string;
          name: string;
          school_id: string | null;
          stage: string;
          term: string;
          updated_at: string;
        };
        Insert: {
          academic_year?: string;
          city?: string;
          id?: string;
          ministry_id?: string;
          name?: string;
          school_id?: string | null;
          stage?: string;
          term?: string;
          updated_at?: string;
        };
        Update: {
          academic_year?: string;
          city?: string;
          id?: string;
          ministry_id?: string;
          name?: string;
          school_id?: string | null;
          stage?: string;
          term?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "school_settings_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      schools: {
        Row: {
          city: string | null;
          code: string;
          created_at: string;
          created_by: string | null;
          district: string | null;
          education_department: string | null;
          education_stage: string | null;
          education_type: string | null;
          id: string;
          name: string;
          school_year: string | null;
          updated_at: string;
        };
        Insert: {
          city?: string | null;
          code: string;
          created_at?: string;
          created_by?: string | null;
          district?: string | null;
          education_department?: string | null;
          education_stage?: string | null;
          education_type?: string | null;
          id?: string;
          name: string;
          school_year?: string | null;
          updated_at?: string;
        };
        Update: {
          city?: string | null;
          code?: string;
          created_at?: string;
          created_by?: string | null;
          district?: string | null;
          education_department?: string | null;
          education_stage?: string | null;
          education_type?: string | null;
          id?: string;
          name?: string;
          school_year?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_accountability: {
        Row: {
          category: string;
          created_at: string;
          created_by: string | null;
          details: string | null;
          due_date: string | null;
          id: string;
          school_id: string | null;
          status: string;
          student_id: string | null;
          title: string;
        };
        Insert: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          due_date?: string | null;
          id?: string;
          school_id?: string | null;
          status?: string;
          student_id?: string | null;
          title: string;
        };
        Update: {
          category?: string;
          created_at?: string;
          created_by?: string | null;
          details?: string | null;
          due_date?: string | null;
          id?: string;
          school_id?: string | null;
          status?: string;
          student_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_accountability_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_accountability_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      student_pledges: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          notes: string | null;
          pledge_date: string;
          pledge_type: string;
          school_id: string | null;
          status: string;
          student_id: string | null;
          title: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          pledge_date?: string;
          pledge_type?: string;
          school_id?: string | null;
          status?: string;
          student_id?: string | null;
          title: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          id?: string;
          notes?: string | null;
          pledge_date?: string;
          pledge_type?: string;
          school_id?: string | null;
          status?: string;
          student_id?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_pledges_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_pledges_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      students: {
        Row: {
          average: number;
          class_id: string | null;
          created_at: string;
          created_by: string | null;
          full_name: string;
          grade: string;
          guardian_name: string | null;
          guardian_phone: string | null;
          id: string;
          is_demo: boolean;
          nationality: string | null;
          notes: string | null;
          school_id: string | null;
          status: string;
          student_no: string;
          updated_at: string;
        };
        Insert: {
          average?: number;
          class_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          full_name: string;
          grade: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          is_demo?: boolean;
          nationality?: string | null;
          notes?: string | null;
          school_id?: string | null;
          status?: string;
          student_no: string;
          updated_at?: string;
        };
        Update: {
          average?: number;
          class_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          full_name?: string;
          grade?: string;
          guardian_name?: string | null;
          guardian_phone?: string | null;
          id?: string;
          is_demo?: boolean;
          nationality?: string | null;
          notes?: string | null;
          school_id?: string | null;
          status?: string;
          student_no?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "students_class_id_fkey";
            columns: ["class_id"];
            isOneToOne: false;
            referencedRelation: "classes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      task_comments: {
        Row: {
          body: string;
          created_at: string;
          id: string;
          task_id: string;
          user_id: string;
        };
        Insert: {
          body: string;
          created_at?: string;
          id?: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          id?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_comments_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "plan_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_events: {
        Row: {
          actor_id: string | null;
          created_at: string;
          event: string;
          from_status: string | null;
          id: string;
          note: string | null;
          school_id: string;
          task_id: string;
          to_status: string | null;
        };
        Insert: {
          actor_id?: string | null;
          created_at?: string;
          event: string;
          from_status?: string | null;
          id?: string;
          note?: string | null;
          school_id: string;
          task_id: string;
          to_status?: string | null;
        };
        Update: {
          actor_id?: string | null;
          created_at?: string;
          event?: string;
          from_status?: string | null;
          id?: string;
          note?: string | null;
          school_id?: string;
          task_id?: string;
          to_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "task_events_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_events_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "plan_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_shares: {
        Row: {
          access: string;
          created_at: string;
          id: string;
          recipient_id: string;
          reviewed_at: string | null;
          sender_id: string;
          status: string;
          task_id: string;
        };
        Insert: {
          access?: string;
          created_at?: string;
          id?: string;
          recipient_id: string;
          reviewed_at?: string | null;
          sender_id: string;
          status?: string;
          task_id: string;
        };
        Update: {
          access?: string;
          created_at?: string;
          id?: string;
          recipient_id?: string;
          reviewed_at?: string | null;
          sender_id?: string;
          status?: string;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_shares_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "plan_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_signatures: {
        Row: {
          assigned_by: string;
          comment: string | null;
          created_at: string;
          id: string;
          school_id: string;
          signature_text: string | null;
          signed_at: string | null;
          signer_id: string;
          signer_name: string | null;
          signer_role: string;
          status: string;
          step_order: number;
          task_id: string;
        };
        Insert: {
          assigned_by: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          school_id: string;
          signature_text?: string | null;
          signed_at?: string | null;
          signer_id: string;
          signer_name?: string | null;
          signer_role: string;
          status?: string;
          step_order: number;
          task_id: string;
        };
        Update: {
          assigned_by?: string;
          comment?: string | null;
          created_at?: string;
          id?: string;
          school_id?: string;
          signature_text?: string | null;
          signed_at?: string | null;
          signer_id?: string;
          signer_name?: string | null;
          signer_role?: string;
          status?: string;
          step_order?: number;
          task_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_signatures_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_signatures_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "plan_tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      workflow_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          field_schema: NonNullable<Json>;
          id: string;
          is_default: boolean;
          school_id: string | null;
          signature_roles: NonNullable<Json>;
          template_key: string;
          title: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          field_schema?: NonNullable<Json>;
          id?: string;
          is_default?: boolean;
          school_id?: string | null;
          signature_roles?: NonNullable<Json>;
          template_key: string;
          title: string;
          topic: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          field_schema?: NonNullable<Json>;
          id?: string;
          is_default?: boolean;
          school_id?: string | null;
          signature_roles?: NonNullable<Json>;
          template_key?: string;
          title?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_templates_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_school: { Args: { target_school: string }; Returns: boolean };
      can_read_counselling: {
        Args: { target_school: string };
        Returns: boolean;
      };
      can_read_workflow_task: {
        Args: { target_task_id: string };
        Returns: boolean;
      };
      can_supervise_school: {
        Args: { target_school: string };
        Returns: boolean;
      };
      has_workspace_role: {
        Args: { allowed_roles: string[]; target_school: string };
        Returns: boolean;
      };
      is_any_school_member: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_school_manager: { Args: { target_school: string }; Returns: boolean };
      is_school_member: { Args: { target_school: string }; Returns: boolean };
      queue_due_reminders: {
        Args: Record<PropertyKey, never>;
        Returns: number;
      };
      set_member_role: {
        Args: {
          direct_manager?: string;
          new_role: string;
          target_school: string;
          target_user: string;
        };
        Returns: string;
      };
    };
    Enums: {
      app_role:
        | "administrator"
        | "counselor"
        | "teacher"
        | "educational_deputy"
        | "school_deputy"
        | "student_affairs_deputy";
      attendance_status: "present" | "absent" | "late" | "excused";
      case_priority: "low" | "medium" | "high";
      case_status: "new" | "in_progress" | "closed";
      task_status: "not_started" | "in_progress" | "done";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "administrator",
        "counselor",
        "teacher",
        "educational_deputy",
        "school_deputy",
        "student_affairs_deputy",
      ],
      attendance_status: ["present", "absent", "late", "excused"],
      case_priority: ["low", "medium", "high"],
      case_status: ["new", "in_progress", "closed"],
      task_status: ["not_started", "in_progress", "done"],
    },
  },
} as const;;
