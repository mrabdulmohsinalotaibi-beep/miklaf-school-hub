export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      announcements: {
        Row: {
          audience: string;
          author_id: string | null;
          body: string;
          created_at: string;
          id: string;
          is_demo: boolean;
          title: string;
        };
        Insert: {
          audience?: string;
          author_id?: string | null;
          body: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          title: string;
        };
        Update: {
          audience?: string;
          author_id?: string | null;
          body?: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
          title?: string;
        };
        Relationships: [];
      };
      appointments: {
        Row: {
          created_at: string;
          created_by: string | null;
          id: string;
          is_demo: boolean;
          location: string | null;
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
          starts_at?: string;
          status?: string;
          student_id?: string | null;
          title?: string;
          type?: string;
          with_person?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "appointments_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
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
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
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
        };
        Insert: {
          author_id?: string | null;
          body: string;
          case_id: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
        };
        Update: {
          author_id?: string | null;
          body?: string;
          case_id?: string;
          created_at?: string;
          id?: string;
          is_demo?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey";
            columns: ["case_id"];
            isOneToOne: false;
            referencedRelation: "counseling_cases";
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
          teacher_name: string | null;
        };
        Insert: {
          created_at?: string;
          grade: string;
          id?: string;
          is_demo?: boolean;
          name: string;
          teacher_name?: string | null;
        };
        Update: {
          created_at?: string;
          grade?: string;
          id?: string;
          is_demo?: boolean;
          name?: string;
          teacher_name?: string | null;
        };
        Relationships: [];
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
          status?: Database["public"]["Enums"]["case_status"];
          student_id?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "counseling_cases_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
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
          form_data: Json;
          id: string;
          is_demo: boolean;
          owner: string | null;
          progress: number;
          recurrence: string | null;
          school_id: string | null;
          status: Database["public"]["Enums"]["task_status"];
          supervisor_id: string | null;
          title: string;
          topic: string;
          template_id: string | null;
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
          form_data?: Json;
          id?: string;
          is_demo?: boolean;
          owner?: string | null;
          progress?: number;
          recurrence?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          supervisor_id?: string | null;
          title: string;
          topic?: string;
          template_id?: string | null;
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
          form_data?: Json;
          id?: string;
          is_demo?: boolean;
          owner?: string | null;
          progress?: number;
          recurrence?: string | null;
          school_id?: string | null;
          status?: Database["public"]["Enums"]["task_status"];
          supervisor_id?: string | null;
          title?: string;
          topic?: string;
          template_id?: string | null;
          updated_at?: string;
          workflow_status?: string;
        };
        Relationships: [];
      };
      workflow_templates: {
        Row: {
          created_at: string;
          created_by: string | null;
          field_schema: Json;
          id: string;
          is_default: boolean;
          school_id: string | null;
          signature_roles: Json;
          template_key: string;
          title: string;
          topic: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          field_schema?: Json;
          id?: string;
          is_default?: boolean;
          school_id?: string | null;
          signature_roles?: Json;
          template_key: string;
          title: string;
          topic: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          field_schema?: Json;
          id?: string;
          is_default?: boolean;
          school_id?: string | null;
          signature_roles?: Json;
          template_key?: string;
          title?: string;
          topic?: string;
          updated_at?: string;
        };
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
        Relationships: [];
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
      school_settings: {
        Row: {
          academic_year: string;
          city: string;
          id: string;
          ministry_id: string;
          name: string;
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
          stage?: string;
          term?: string;
          updated_at?: string;
        };
        Relationships: [];
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

      schools: {
        Row: {
          id: string;
          name: string;
          education_stage: string | null;
          education_type: string | null;
          city: string | null;
          education_department: string | null;
          district: string | null;
          school_year: string | null;
          code: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          education_stage?: string | null;
          education_type?: string | null;
          city?: string | null;
          education_department?: string | null;
          district?: string | null;
          school_year?: string | null;
          code: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          education_stage?: string | null;
          education_type?: string | null;
          city?: string | null;
          education_department?: string | null;
          district?: string | null;
          school_year?: string | null;
          code?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      school_members: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          role: string;
          manager_id: string | null;
          acting_manager_id: string | null;
          status: string;
          joined_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          role?: string;
          manager_id?: string | null;
          acting_manager_id?: string | null;
          status?: string;
          joined_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          role?: string;
          manager_id?: string | null;
          acting_manager_id?: string | null;
          status?: string;
          joined_at?: string;
        };
        Relationships: [];
      };
      membership_requests: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          requested_role: string;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          requested_role?: string;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          requested_role?: string;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      school_schedules: {
        Row: {
          id: string;
          school_id: string | null;
          title: string;
          schedule_type: string;
          schedule_date: string | null;
          details: string | null;
          status: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          title: string;
          schedule_type?: string;
          schedule_date?: string | null;
          details?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          title?: string;
          schedule_type?: string;
          schedule_date?: string | null;
          details?: string | null;
          status?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      student_accountability: {
        Row: {
          id: string;
          school_id: string | null;
          student_id: string | null;
          title: string;
          category: string;
          details: string | null;
          status: string;
          due_date: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          student_id?: string | null;
          title: string;
          category?: string;
          details?: string | null;
          status?: string;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          student_id?: string | null;
          title?: string;
          category?: string;
          details?: string | null;
          status?: string;
          due_date?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      circulars: {
        Row: {
          id: string;
          school_id: string | null;
          title: string;
          body: string | null;
          audience: string;
          issued_date: string;
          status: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          title: string;
          body?: string | null;
          audience?: string;
          issued_date?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          title?: string;
          body?: string | null;
          audience?: string;
          issued_date?: string;
          status?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      student_pledges: {
        Row: {
          id: string;
          school_id: string | null;
          student_id: string | null;
          title: string;
          pledge_type: string;
          pledge_date: string;
          status: string;
          notes: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          student_id?: string | null;
          title: string;
          pledge_type?: string;
          pledge_date?: string;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          student_id?: string | null;
          title?: string;
          pledge_type?: string;
          pledge_date?: string;
          status?: string;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_read_workflow_task: {
        Args: { target_task_id: string };
        Returns: boolean;
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

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

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
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
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
      app_role: ["administrator", "counselor", "teacher"],
      attendance_status: ["present", "absent", "late", "excused"],
      case_priority: ["low", "medium", "high"],
      case_status: ["new", "in_progress", "closed"],
      task_status: ["not_started", "in_progress", "done"],
    },
  },
} as const;
