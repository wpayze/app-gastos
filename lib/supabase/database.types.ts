// Tipos de la base de datos — reflejan supabase/migrations/0001_init.sql.
//
// Escrito a mano porque generarlo de verdad requiere `supabase gen types`
// con el CLI enlazado (login interactivo). Si más adelante se enlaza el
// proyecto, este archivo puede sustituirse por el resultado real de:
//
//   supabase gen types typescript --project-id <ref> --schema public
//
// Las columnas con check constraint (no enum real de Postgres) se tipan
// como `string`, igual que lo haría el generador — el estrechamiento a
// uniones literales pasa en lib/models/mappers.ts, no aquí.

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nombre: string;
          email: string;
          iniciales: string;
          color: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nombre: string;
          email: string;
          iniciales: string;
          color: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          email?: string;
          iniciales?: string;
          color?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          nombre: string;
          descripcion: string;
          emoji: string;
          moneda: string;
          estado: string;
          limite_mensual: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nombre: string;
          descripcion?: string;
          emoji?: string;
          moneda?: string;
          estado?: string;
          limite_mensual?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          descripcion?: string;
          emoji?: string;
          moneda?: string;
          estado?: string;
          limite_mensual?: number | null;
          created_at?: string;
        };
        Relationships: [];
      };
      budget_members: {
        Row: {
          budget_id: string;
          user_id: string;
          rol: string;
          estado: string;
          fecha_incorporacion: string;
          ultima_actividad: string;
        };
        Insert: {
          budget_id: string;
          user_id: string;
          rol: string;
          estado?: string;
          fecha_incorporacion?: string;
          ultima_actividad?: string;
        };
        Update: {
          budget_id?: string;
          user_id?: string;
          rol?: string;
          estado?: string;
          fecha_incorporacion?: string;
          ultima_actividad?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_members_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_members_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: string;
          nombre: string;
          tipo: string;
          emoji: string;
        };
        Insert: {
          id: string;
          nombre: string;
          tipo: string;
          emoji: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          tipo?: string;
          emoji?: string;
        };
        Relationships: [];
      };
      category_limits: {
        Row: {
          budget_id: string;
          category_id: string;
          limite_mensual: number;
        };
        Insert: {
          budget_id: string;
          category_id: string;
          limite_mensual: number;
        };
        Update: {
          budget_id?: string;
          category_id?: string;
          limite_mensual?: number;
        };
        Relationships: [
          {
            foreignKeyName: "category_limits_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "category_limits_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      recurrents: {
        Row: {
          id: string;
          budget_id: string;
          tipo: string;
          nombre: string;
          cantidad: number;
          category_id: string;
          frecuencia: string;
          proxima_fecha: string;
          estado: string;
          fecha_inicio: string;
          fecha_fin: string | null;
          user_id: string;
          metodo_pago: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          tipo: string;
          nombre: string;
          cantidad: number;
          category_id: string;
          frecuencia: string;
          proxima_fecha: string;
          estado?: string;
          fecha_inicio: string;
          fecha_fin?: string | null;
          user_id: string;
          metodo_pago?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          tipo?: string;
          nombre?: string;
          cantidad?: number;
          category_id?: string;
          frecuencia?: string;
          proxima_fecha?: string;
          estado?: string;
          fecha_inicio?: string;
          fecha_fin?: string | null;
          user_id?: string;
          metodo_pago?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "recurrents_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurrents_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurrents_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      movements: {
        Row: {
          id: string;
          budget_id: string;
          tipo: string;
          concepto: string;
          cantidad: number;
          category_id: string;
          fecha: string;
          user_id: string;
          metodo_pago: string | null;
          nota: string | null;
          recurrent_id: string | null;
          moneda_original: string | null;
          cantidad_original: number | null;
          tasa_cambio: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          tipo: string;
          concepto: string;
          cantidad: number;
          category_id: string;
          fecha: string;
          user_id: string;
          metodo_pago?: string | null;
          nota?: string | null;
          recurrent_id?: string | null;
          moneda_original?: string | null;
          cantidad_original?: number | null;
          tasa_cambio?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          tipo?: string;
          concepto?: string;
          cantidad?: number;
          category_id?: string;
          fecha?: string;
          user_id?: string;
          metodo_pago?: string | null;
          nota?: string | null;
          recurrent_id?: string | null;
          moneda_original?: string | null;
          cantidad_original?: number | null;
          tasa_cambio?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "movements_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movements_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movements_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "movements_recurrent_id_fkey";
            columns: ["recurrent_id"];
            isOneToOne: false;
            referencedRelation: "recurrents";
            referencedColumns: ["id"];
          },
        ];
      };
      activity: {
        Row: {
          id: string;
          budget_id: string;
          user_id: string;
          tipo: string;
          texto: string;
          fecha: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          user_id: string;
          tipo: string;
          texto: string;
          fecha?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          user_id?: string;
          tipo?: string;
          texto?: string;
          fecha?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_budget_id_fkey";
            columns: ["budget_id"];
            isOneToOne: false;
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      exchange_rates: {
        Row: {
          moneda: string;
          tasa_eur: number;
          actualizado_at: string;
        };
        Insert: {
          moneda: string;
          tasa_eur: number;
          actualizado_at?: string;
        };
        Update: {
          moneda?: string;
          tasa_eur?: number;
          actualizado_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      budget_activity: {
        Row: {
          id: string;
          budget_id: string;
          tipo: string;
          fecha: string;
          user_id: string;
          texto: string | null;
          concepto: string | null;
          cantidad: number | null;
          movimiento_tipo: string | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      is_budget_member: {
        Args: { target_budget_id: string };
        Returns: boolean;
      };
      can_edit_budget: {
        Args: { target_budget_id: string };
        Returns: boolean;
      };
      is_budget_admin: {
        Args: { target_budget_id: string };
        Returns: boolean;
      };
      create_budget_with_owner: {
        Args: {
          p_nombre: string;
          p_descripcion?: string;
          p_emoji?: string;
          p_limite_mensual?: number | null;
        };
        Returns: Database["public"]["Tables"]["budgets"]["Row"];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
