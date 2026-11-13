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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      disponibilidad: {
        Row: {
          dia: Database["public"]["Enums"]["dia_semana"]
          franja: Database["public"]["Enums"]["franja_horaria"]
          id: string
          perfil_id: string
        }
        Insert: {
          dia: Database["public"]["Enums"]["dia_semana"]
          franja: Database["public"]["Enums"]["franja_horaria"]
          id?: string
          perfil_id: string
        }
        Update: {
          dia?: Database["public"]["Enums"]["dia_semana"]
          franja?: Database["public"]["Enums"]["franja_horaria"]
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "disponibilidad_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      estilos: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      horario_especifico: {
        Row: {
          disponible: boolean
          fecha_fin: string
          fecha_inicio: string
          hora_fin: string | null
          hora_inicio: string | null
          horas_max: number | null
          id: string
          nota: string | null
          perfil_id: string
        }
        Insert: {
          disponible?: boolean
          fecha_fin: string
          fecha_inicio: string
          hora_fin?: string | null
          hora_inicio?: string | null
          horas_max?: number | null
          id?: string
          nota?: string | null
          perfil_id: string
        }
        Update: {
          disponible?: boolean
          fecha_fin?: string
          fecha_inicio?: string
          hora_fin?: string | null
          hora_inicio?: string | null
          horas_max?: number | null
          id?: string
          nota?: string | null
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horario_especifico_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      horario_semanal: {
        Row: {
          dia: Database["public"]["Enums"]["dia_semana"]
          hora_fin: string
          hora_inicio: string
          id: string
          perfil_id: string
        }
        Insert: {
          dia: Database["public"]["Enums"]["dia_semana"]
          hora_fin: string
          hora_inicio: string
          id?: string
          perfil_id: string
        }
        Update: {
          dia?: Database["public"]["Enums"]["dia_semana"]
          hora_fin?: string
          hora_inicio?: string
          id?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "horario_semanal_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instrumentos: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      perfil_estilos: {
        Row: {
          estilo_id: number
          perfil_id: string
        }
        Insert: {
          estilo_id: number
          perfil_id: string
        }
        Update: {
          estilo_id?: number
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_estilos_estilo_id_fkey"
            columns: ["estilo_id"]
            isOneToOne: false
            referencedRelation: "estilos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_estilos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfil_instrumentos: {
        Row: {
          anios_tocando: number
          id: string
          instrumento_id: number
          nivel: Database["public"]["Enums"]["nivel_musical"]
          perfil_id: string
        }
        Insert: {
          anios_tocando?: number
          id?: string
          instrumento_id: number
          nivel?: Database["public"]["Enums"]["nivel_musical"]
          perfil_id: string
        }
        Update: {
          anios_tocando?: number
          id?: string
          instrumento_id?: number
          nivel?: Database["public"]["Enums"]["nivel_musical"]
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_instrumentos_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "instrumentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "perfil_instrumentos_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      perfiles: {
        Row: {
          bio: string | null
          ciudad: string | null
          created_at: string
          foto_url: string | null
          id: string
          nombre: string
          updated_at: string
          zona: string | null
        }
        Insert: {
          bio?: string | null
          ciudad?: string | null
          created_at?: string
          foto_url?: string | null
          id: string
          nombre?: string
          updated_at?: string
          zona?: string | null
        }
        Update: {
          bio?: string | null
          ciudad?: string | null
          created_at?: string
          foto_url?: string | null
          id?: string
          nombre?: string
          updated_at?: string
          zona?: string | null
        }
        Relationships: []
      }
      profesor_detalles: {
        Row: {
          anios_ensenando: number
          estilos_otros: string | null
          experiencia: string | null
          formacion: string | null
          metodologia: string | null
          modalidades: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id: string
          precio_hora: number | null
          titular: string | null
          updated_at: string
        }
        Insert: {
          anios_ensenando?: number
          estilos_otros?: string | null
          experiencia?: string | null
          formacion?: string | null
          metodologia?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos?: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id: string
          precio_hora?: number | null
          titular?: string | null
          updated_at?: string
        }
        Update: {
          anios_ensenando?: number
          estilos_otros?: string | null
          experiencia?: string | null
          formacion?: string | null
          metodologia?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos?: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id?: string
          precio_hora?: number | null
          titular?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profesor_detalles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profesor_evidencias: {
        Row: {
          created_at: string
          id: string
          perfil_id: string
          storage_path: string | null
          tipo: Database["public"]["Enums"]["tipo_evidencia"]
          titulo: string
          url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          perfil_id: string
          storage_path?: string | null
          tipo: Database["public"]["Enums"]["tipo_evidencia"]
          titulo: string
          url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          perfil_id?: string
          storage_path?: string | null
          tipo?: Database["public"]["Enums"]["tipo_evidencia"]
          titulo?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesor_evidencias_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profesor_verificacion: {
        Row: {
          perfil_id: string
          verificado: boolean
          verificado_at: string | null
        }
        Insert: {
          perfil_id: string
          verificado?: boolean
          verificado_at?: string | null
        }
        Update: {
          perfil_id?: string
          verificado?: boolean
          verificado_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profesor_verificacion_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "alumno" | "profesor" | "local" | "admin"
      dia_semana:
        | "lunes"
        | "martes"
        | "miercoles"
        | "jueves"
        | "viernes"
        | "sabado"
        | "domingo"
      franja_horaria: "manana" | "tarde" | "noche"
      modalidad_clase: "presencial" | "online" | "domicilio"
      nivel_musical: "inicial" | "intermedio" | "avanzado"
      tipo_evidencia: "video" | "documento" | "enlace"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["alumno", "profesor", "local", "admin"],
      dia_semana: [
        "lunes",
        "martes",
        "miercoles",
        "jueves",
        "viernes",
        "sabado",
        "domingo",
      ],
      franja_horaria: ["manana", "tarde", "noche"],
      modalidad_clase: ["presencial", "online", "domicilio"],
      nivel_musical: ["inicial", "intermedio", "avanzado"],
      tipo_evidencia: ["video", "documento", "enlace"],
    },
  },
} as const
