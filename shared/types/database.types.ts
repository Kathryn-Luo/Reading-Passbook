export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      books: {
        Row: {
          author: string | null
          cover_url: string | null
          created_at: string
          first_finished_at: string | null
          id: string
          isbn: string | null
          source: Database['public']['Enums']['book_source']
          status: Database['public']['Enums']['book_status']
          title: string
          total_pages: number | null
          user_id: string
          visibility: Database['public']['Enums']['visibility']
        }
        Insert: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          first_finished_at?: string | null
          id?: string
          isbn?: string | null
          source?: Database['public']['Enums']['book_source']
          status?: Database['public']['Enums']['book_status']
          title: string
          total_pages?: number | null
          user_id: string
          visibility?: Database['public']['Enums']['visibility']
        }
        Update: {
          author?: string | null
          cover_url?: string | null
          created_at?: string
          first_finished_at?: string | null
          id?: string
          isbn?: string | null
          source?: Database['public']['Enums']['book_source']
          status?: Database['public']['Enums']['book_status']
          title?: string
          total_pages?: number | null
          user_id?: string
          visibility?: Database['public']['Enums']['visibility']
        }
        Relationships: []
      }
      deposits: {
        Row: {
          book_id: string
          chapter_label: string | null
          coins_delta: number
          counts_as_book: boolean
          created_at: string
          exp_delta: number
          id: string
          is_voided: boolean
          kind: Database['public']['Enums']['deposit_kind']
          pages_delta: number
          reverses_deposit_id: string | null
          to_page: number | null
          user_id: string
        }
        Insert: {
          book_id: string
          chapter_label?: string | null
          coins_delta?: number
          counts_as_book?: boolean
          created_at?: string
          exp_delta?: number
          id?: string
          is_voided?: boolean
          kind: Database['public']['Enums']['deposit_kind']
          pages_delta?: number
          reverses_deposit_id?: string | null
          to_page?: number | null
          user_id: string
        }
        Update: {
          book_id?: string
          chapter_label?: string | null
          coins_delta?: number
          counts_as_book?: boolean
          created_at?: string
          exp_delta?: number
          id?: string
          is_voided?: boolean
          kind?: Database['public']['Enums']['deposit_kind']
          pages_delta?: number
          reverses_deposit_id?: string | null
          to_page?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'deposits_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'deposits_reverses_deposit_id_fkey'
            columns: ['reverses_deposit_id']
            isOneToOne: false
            referencedRelation: 'deposits'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      book_source: 'google_books' | 'manual'
      book_status: 'reading' | 'finished'
      deposit_kind:
        | 'progress_pages'
        | 'progress_chapter'
        | 'finish_first'
        | 'reread'
        | 'void'
      visibility: 'public' | 'private'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      book_source: ['google_books', 'manual'],
      book_status: ['reading', 'finished'],
      deposit_kind: [
        'progress_pages',
        'progress_chapter',
        'finish_first',
        'reread',
        'void',
      ],
      visibility: ['public', 'private'],
    },
  },
} as const
