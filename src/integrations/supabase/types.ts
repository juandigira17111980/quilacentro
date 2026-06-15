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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      calificaciones: {
        Row: {
          cliente_id: string
          comentario: string | null
          comercio_id: string
          created_at: string
          id: string
          producto_id: string | null
          rating: number
        }
        Insert: {
          cliente_id: string
          comentario?: string | null
          comercio_id: string
          created_at?: string
          id?: string
          producto_id?: string | null
          rating: number
        }
        Update: {
          cliente_id?: string
          comentario?: string | null
          comercio_id?: string
          created_at?: string
          id?: string
          producto_id?: string | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "calificaciones_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calificaciones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          activa: boolean
          color: string | null
          created_at: string
          icono_url: string | null
          id: number
          nombre: string
          orden: number
          padre_id: number | null
          slug: string
        }
        Insert: {
          activa?: boolean
          color?: string | null
          created_at?: string
          icono_url?: string | null
          id?: number
          nombre: string
          orden?: number
          padre_id?: number | null
          slug: string
        }
        Update: {
          activa?: boolean
          color?: string | null
          created_at?: string
          icono_url?: string | null
          id?: number
          nombre?: string
          orden?: number
          padre_id?: number | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_padre_id_fkey"
            columns: ["padre_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
        ]
      }
      comercios: {
        Row: {
          banner_url: string | null
          categoria_id: number | null
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          direccion: string | null
          email: string | null
          estado: string
          horarios: Json | null
          id: string
          lat: number | null
          lng: number | null
          logo_url: string | null
          nombre: string
          owner_id: string
          plan_id: number | null
          rating_avg: number
          slug: string
          telefono: string | null
          total_reviews: number
          updated_at: string
          whatsapp: string | null
          zona_id: number | null
        }
        Insert: {
          banner_url?: string | null
          categoria_id?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string
          horarios?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          nombre: string
          owner_id: string
          plan_id?: number | null
          rating_avg?: number
          slug: string
          telefono?: string | null
          total_reviews?: number
          updated_at?: string
          whatsapp?: string | null
          zona_id?: number | null
        }
        Update: {
          banner_url?: string | null
          categoria_id?: number | null
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          direccion?: string | null
          email?: string | null
          estado?: string
          horarios?: Json | null
          id?: string
          lat?: number | null
          lng?: number | null
          logo_url?: string | null
          nombre?: string
          owner_id?: string
          plan_id?: number | null
          rating_avg?: number
          slug?: string
          telefono?: string | null
          total_reviews?: number
          updated_at?: string
          whatsapp?: string | null
          zona_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "comercios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comercios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comercios_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comercios_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "planes_suscripcion"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comercios_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      consultas: {
        Row: {
          canal: string
          cliente_id: string | null
          comercio_id: string
          created_at: string
          estado: string
          id: string
          mensaje: string
          producto_id: string | null
        }
        Insert: {
          canal?: string
          cliente_id?: string | null
          comercio_id: string
          created_at?: string
          estado?: string
          id?: string
          mensaje: string
          producto_id?: string | null
        }
        Update: {
          canal?: string
          cliente_id?: string | null
          comercio_id?: string
          created_at?: string
          estado?: string
          id?: string
          mensaje?: string
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consultas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultas_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      favoritos: {
        Row: {
          cliente_id: string
          comercio_id: string | null
          created_at: string
          id: string
          producto_id: string | null
        }
        Insert: {
          cliente_id: string
          comercio_id?: string | null
          created_at?: string
          id?: string
          producto_id?: string | null
        }
        Update: {
          cliente_id?: string
          comercio_id?: string | null
          created_at?: string
          id?: string
          producto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favoritos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favoritos_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      historial_busquedas: {
        Row: {
          cliente_id: string | null
          created_at: string
          id: string
          resultados: number
          termino: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          resultados?: number
          termino: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          id?: string
          resultados?: number
          termino?: string
        }
        Relationships: [
          {
            foreignKeyName: "historial_busquedas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      planes_suscripcion: {
        Row: {
          activo: boolean
          created_at: string
          descripcion: string | null
          destacados_mes: number
          id: number
          max_productos: number
          nombre: string
          permite_ia: boolean
          permite_stats: boolean
          precio_mes: number
        }
        Insert: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          destacados_mes?: number
          id?: number
          max_productos?: number
          nombre: string
          permite_ia?: boolean
          permite_stats?: boolean
          precio_mes?: number
        }
        Update: {
          activo?: boolean
          created_at?: string
          descripcion?: string | null
          destacados_mes?: number
          id?: number
          max_productos?: number
          nombre?: string
          permite_ia?: boolean
          permite_stats?: boolean
          precio_mes?: number
        }
        Relationships: []
      }
      productos: {
        Row: {
          atributos: Json
          categoria_id: number | null
          comercio_id: string
          created_at: string
          created_by: string | null
          deleted_at: string | null
          descripcion: string | null
          destacado: boolean
          disponible: boolean
          id: string
          imagen_url: string | null
          imagenes: Json
          marca: string | null
          nombre: string
          precio_base: number
          precio_oferta: number | null
          sku: string | null
          slug: string
          stock: number | null
          tags: string[] | null
          updated_at: string
          vistas: number
        }
        Insert: {
          atributos?: Json
          categoria_id?: number | null
          comercio_id: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          destacado?: boolean
          disponible?: boolean
          id?: string
          imagen_url?: string | null
          imagenes?: Json
          marca?: string | null
          nombre: string
          precio_base: number
          precio_oferta?: number | null
          sku?: string | null
          slug: string
          stock?: number | null
          tags?: string[] | null
          updated_at?: string
          vistas?: number
        }
        Update: {
          atributos?: Json
          categoria_id?: number | null
          comercio_id?: string
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          descripcion?: string | null
          destacado?: boolean
          disponible?: boolean
          id?: string
          imagen_url?: string | null
          imagenes?: Json
          marca?: string | null
          nombre?: string
          precio_base?: number
          precio_oferta?: number | null
          sku?: string | null
          slug?: string
          stock?: number | null
          tags?: string[] | null
          updated_at?: string
          vistas?: number
        }
        Relationships: [
          {
            foreignKeyName: "productos_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      promociones: {
        Row: {
          activa: boolean
          comercio_id: string
          created_at: string
          descripcion: string | null
          destacada: boolean
          fecha_fin: string
          fecha_inicio: string
          id: string
          imagen_url: string | null
          producto_id: string | null
          tipo: string
          titulo: string
          updated_at: string
          valor: number | null
        }
        Insert: {
          activa?: boolean
          comercio_id: string
          created_at?: string
          descripcion?: string | null
          destacada?: boolean
          fecha_fin: string
          fecha_inicio: string
          id?: string
          imagen_url?: string | null
          producto_id?: string | null
          tipo: string
          titulo: string
          updated_at?: string
          valor?: number | null
        }
        Update: {
          activa?: boolean
          comercio_id?: string
          created_at?: string
          descripcion?: string | null
          destacada?: boolean
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          imagen_url?: string | null
          producto_id?: string | null
          tipo?: string
          titulo?: string
          updated_at?: string
          valor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promociones_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promociones_producto_id_fkey"
            columns: ["producto_id"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      publicidad: {
        Row: {
          activa: boolean
          comercio_id: string
          created_at: string
          fecha_fin: string
          fecha_inicio: string
          id: string
          imagen_url: string | null
          tipo: string
          url_destino: string | null
          zona_id: number | null
        }
        Insert: {
          activa?: boolean
          comercio_id: string
          created_at?: string
          fecha_fin: string
          fecha_inicio: string
          id?: string
          imagen_url?: string | null
          tipo: string
          url_destino?: string | null
          zona_id?: number | null
        }
        Update: {
          activa?: boolean
          comercio_id?: string
          created_at?: string
          fecha_fin?: string
          fecha_inicio?: string
          id?: string
          imagen_url?: string | null
          tipo?: string
          url_destino?: string | null
          zona_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "publicidad_comercio_id_fkey"
            columns: ["comercio_id"]
            isOneToOne: false
            referencedRelation: "comercios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "publicidad_zona_id_fkey"
            columns: ["zona_id"]
            isOneToOne: false
            referencedRelation: "zonas"
            referencedColumns: ["id"]
          },
        ]
      }
      zonas: {
        Row: {
          activa: boolean
          ciudad: string
          created_at: string
          departamento: string
          id: number
          nombre: string
          pais: string
        }
        Insert: {
          activa?: boolean
          ciudad: string
          created_at?: string
          departamento: string
          id?: number
          nombre: string
          pais?: string
        }
        Update: {
          activa?: boolean
          ciudad?: string
          created_at?: string
          departamento?: string
          id?: number
          nombre?: string
          pais?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_comercio_owner: {
        Args: { _comercio_id: string; _user_id: string }
        Returns: boolean
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
    Enums: {},
  },
} as const
