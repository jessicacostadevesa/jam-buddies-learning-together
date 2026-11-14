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
      alumno_detalles: {
        Row: {
          busca: string[]
          distancia_km: number | null
          edad: Database["public"]["Enums"]["publico_edad"] | null
          estilos_otros: string | null
          modalidades: Database["public"]["Enums"]["modalidad_clase"][]
          objetivos: string[]
          perfil_id: string
          presupuesto_mes: number | null
          referentes: string | null
          tiene_instrumento: boolean
          updated_at: string
        }
        Insert: {
          busca?: string[]
          distancia_km?: number | null
          edad?: Database["public"]["Enums"]["publico_edad"] | null
          estilos_otros?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          objetivos?: string[]
          perfil_id: string
          presupuesto_mes?: number | null
          referentes?: string | null
          tiene_instrumento?: boolean
          updated_at?: string
        }
        Update: {
          busca?: string[]
          distancia_km?: number | null
          edad?: Database["public"]["Enums"]["publico_edad"] | null
          estilos_otros?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          objetivos?: string[]
          perfil_id?: string
          presupuesto_mes?: number | null
          referentes?: string | null
          tiene_instrumento?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alumno_detalles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
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
      escuela_datos_fiscales: {
        Row: {
          cif: string | null
          perfil_id: string
          razon_social: string | null
          responsable: string | null
        }
        Insert: {
          cif?: string | null
          perfil_id: string
          razon_social?: string | null
          responsable?: string | null
        }
        Update: {
          cif?: string | null
          perfil_id?: string
          razon_social?: string | null
          responsable?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escuela_datos_fiscales_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escuela_detalles: {
        Row: {
          anio_fundacion: number | null
          clase_prueba: boolean
          codigo_postal: string | null
          direccion: string | null
          email_contacto: string | null
          horario_atencion: string | null
          instagram: string | null
          instalaciones: string | null
          matricula: number | null
          num_alumnos: number | null
          num_profesores: number | null
          num_salas: number | null
          perfil_id: string
          servicios: string[]
          telefono: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          anio_fundacion?: number | null
          clase_prueba?: boolean
          codigo_postal?: string | null
          direccion?: string | null
          email_contacto?: string | null
          horario_atencion?: string | null
          instagram?: string | null
          instalaciones?: string | null
          matricula?: number | null
          num_alumnos?: number | null
          num_profesores?: number | null
          num_salas?: number | null
          perfil_id: string
          servicios?: string[]
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          anio_fundacion?: number | null
          clase_prueba?: boolean
          codigo_postal?: string | null
          direccion?: string | null
          email_contacto?: string | null
          horario_atencion?: string | null
          instagram?: string | null
          instalaciones?: string | null
          matricula?: number | null
          num_alumnos?: number | null
          num_profesores?: number | null
          num_salas?: number | null
          perfil_id?: string
          servicios?: string[]
          telefono?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "escuela_detalles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escuela_equipo: {
        Row: {
          bio: string | null
          created_at: string
          especialidad: string | null
          id: string
          nombre: string
          perfil_id: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre: string
          perfil_id: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre?: string
          perfil_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "escuela_equipo_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: false
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      escuela_programas: {
        Row: {
          created_at: string
          descripcion: string | null
          duracion: string | null
          formato: Database["public"]["Enums"]["formato_clase"]
          id: string
          instrumento_id: number | null
          nivel: Database["public"]["Enums"]["nivel_musical"] | null
          nombre: string
          perfil_id: string
          periodo_precio: string
          plazas: number | null
          precio: number | null
          publico: Database["public"]["Enums"]["publico_edad"] | null
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          duracion?: string | null
          formato?: Database["public"]["Enums"]["formato_clase"]
          id?: string
          instrumento_id?: number | null
          nivel?: Database["public"]["Enums"]["nivel_musical"] | null
          nombre: string
          perfil_id: string
          periodo_precio?: string
          plazas?: number | null
          precio?: number | null
          publico?: Database["public"]["Enums"]["publico_edad"] | null
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          duracion?: string | null
          formato?: Database["public"]["Enums"]["formato_clase"]
          id?: string
          instrumento_id?: number | null
          nivel?: Database["public"]["Enums"]["nivel_musical"] | null
          nombre?: string
          perfil_id?: string
          periodo_precio?: string
          plazas?: number | null
          precio?: number | null
          publico?: Database["public"]["Enums"]["publico_edad"] | null
        }
        Relationships: [
          {
            foreignKeyName: "escuela_programas_instrumento_id_fkey"
            columns: ["instrumento_id"]
            isOneToOne: false
            referencedRelation: "instrumentos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "escuela_programas_perfil_id_fkey"
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
      local_datos_fiscales: {
        Row: {
          cif: string | null
          perfil_id: string
          razon_social: string | null
          responsable: string | null
        }
        Insert: {
          cif?: string | null
          perfil_id: string
          razon_social?: string | null
          responsable?: string | null
        }
        Update: {
          cif?: string | null
          perfil_id?: string
          razon_social?: string | null
          responsable?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_datos_fiscales_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
      }
      local_detalles: {
        Row: {
          accesible: boolean
          aforo: number | null
          backline: string[]
          codigo_postal: string | null
          condiciones_bandas: string | null
          direccion: string | null
          email_contacto: string | null
          equipamiento: string | null
          estilos_otros: string | null
          horario_apertura: string | null
          instagram: string | null
          latitud: number | null
          longitud: number | null
          num_salas: number | null
          organiza_conciertos: boolean
          organiza_jams: boolean
          perfil_id: string
          precio_hora_ensayo: number | null
          servicios: string[]
          telefono: string | null
          tipos: string[]
          titular: string | null
          updated_at: string
          web: string | null
        }
        Insert: {
          accesible?: boolean
          aforo?: number | null
          backline?: string[]
          codigo_postal?: string | null
          condiciones_bandas?: string | null
          direccion?: string | null
          email_contacto?: string | null
          equipamiento?: string | null
          estilos_otros?: string | null
          horario_apertura?: string | null
          instagram?: string | null
          latitud?: number | null
          longitud?: number | null
          num_salas?: number | null
          organiza_conciertos?: boolean
          organiza_jams?: boolean
          perfil_id: string
          precio_hora_ensayo?: number | null
          servicios?: string[]
          telefono?: string | null
          tipos?: string[]
          titular?: string | null
          updated_at?: string
          web?: string | null
        }
        Update: {
          accesible?: boolean
          aforo?: number | null
          backline?: string[]
          codigo_postal?: string | null
          condiciones_bandas?: string | null
          direccion?: string | null
          email_contacto?: string | null
          equipamiento?: string | null
          estilos_otros?: string | null
          horario_apertura?: string | null
          instagram?: string | null
          latitud?: number | null
          longitud?: number | null
          num_salas?: number | null
          organiza_conciertos?: boolean
          organiza_jams?: boolean
          perfil_id?: string
          precio_hora_ensayo?: number | null
          servicios?: string[]
          telefono?: string | null
          tipos?: string[]
          titular?: string | null
          updated_at?: string
          web?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_detalles_perfil_id_fkey"
            columns: ["perfil_id"]
            isOneToOne: true
            referencedRelation: "perfiles"
            referencedColumns: ["id"]
          },
        ]
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
      perfil_spotify_artistas: {
        Row: {
          ejemplo: boolean
          nombre: string
          perfil_id: string
          spotify_id: string
        }
        Insert: {
          ejemplo?: boolean
          nombre: string
          perfil_id: string
          spotify_id: string
        }
        Update: {
          ejemplo?: boolean
          nombre?: string
          perfil_id?: string
          spotify_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "perfil_spotify_artistas_perfil_id_fkey"
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
          es_escuela: boolean
          estilos_otros: string | null
          experiencia: string | null
          formacion: string | null
          metodologia: string | null
          modalidades: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id: string
          precio_hora: number | null
          publico: Database["public"]["Enums"]["publico_edad"][]
          titular: string | null
          updated_at: string
        }
        Insert: {
          anios_ensenando?: number
          es_escuela?: boolean
          estilos_otros?: string | null
          experiencia?: string | null
          formacion?: string | null
          metodologia?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos?: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id: string
          precio_hora?: number | null
          publico?: Database["public"]["Enums"]["publico_edad"][]
          titular?: string | null
          updated_at?: string
        }
        Update: {
          anios_ensenando?: number
          es_escuela?: boolean
          estilos_otros?: string | null
          experiencia?: string | null
          formacion?: string | null
          metodologia?: string | null
          modalidades?: Database["public"]["Enums"]["modalidad_clase"][]
          niveles_alumnos?: Database["public"]["Enums"]["nivel_musical"][]
          perfil_id?: string
          precio_hora?: number | null
          publico?: Database["public"]["Enums"]["publico_edad"][]
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
      spotify_oauth_sessions: {
        Row: {
          expires_at: string
          redirect_uri: string
          state_hash: string
          user_id: string
          verifier: string
        }
        Insert: {
          expires_at: string
          redirect_uri: string
          state_hash: string
          user_id: string
          verifier: string
        }
        Update: {
          expires_at?: string
          redirect_uri?: string
          state_hash?: string
          user_id?: string
          verifier?: string
        }
        Relationships: []
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
      directorio_locales_publico: {
        Args: never
        Returns: {
          ciudad: string
          conciertos: boolean
          id: string
          jams: boolean
          lat: number
          lng: number
          nombre: string
          precio: number
          tipos: string[]
        }[]
      }
      directorio_profes_publico: {
        Args: never
        Returns: {
          anios: number
          bio: string
          ciudad: string
          esEscuela: boolean
          estilos: string[]
          id: string
          instrumentos: string[]
          modalidades: Database["public"]["Enums"]["modalidad_clase"][]
          niveles: Database["public"]["Enums"]["nivel_musical"][]
          nombre: string
          precio: number
          titular: string
          verificado: boolean
          zona: string
        }[]
      }
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
      formato_clase: "individual" | "grupal" | "banda"
      franja_horaria: "manana" | "tarde" | "noche"
      modalidad_clase: "presencial" | "online" | "domicilio"
      nivel_musical: "inicial" | "intermedio" | "avanzado"
      publico_edad: "ninos" | "adolescentes" | "adultos" | "mayores"
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
      formato_clase: ["individual", "grupal", "banda"],
      franja_horaria: ["manana", "tarde", "noche"],
      modalidad_clase: ["presencial", "online", "domicilio"],
      nivel_musical: ["inicial", "intermedio", "avanzado"],
      publico_edad: ["ninos", "adolescentes", "adultos", "mayores"],
      tipo_evidencia: ["video", "documento", "enlace"],
    },
  },
} as const
