import { SupabaseClient, PostgrestError, AuthError, PostgrestSingleResponse } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface WebSocketError {
  code: string;
  message: string;
  details?: string;
}

export async function handleApiResponse<T>(
  promise: Promise<PostgrestSingleResponse<T>> | Promise<Response>
): Promise<ApiResponse<T>> {
  try {
    const response = await promise;
    
    // Gestion des réponses fetch
    if (response instanceof Response) {
      const contentType = response.headers.get('content-type');
      
      // Vérifier si la réponse est HTML
      if (contentType?.includes('text/html')) {
        console.error('[SUPABASE ERROR] Réponse HTML reçue au lieu de JSON');
        return { 
          data: null, 
          error: 'Erreur serveur: Réponse HTML reçue au lieu de JSON' 
        };
      }
      
      // Vérifier le statut HTTP
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[SUPABASE ERROR]', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        return { 
          data: null, 
          error: `Erreur HTTP ${response.status}: ${response.statusText}` 
        };
      }
      
      // Parser la réponse JSON
      try {
        const data = await response.json();
        return { data, error: null };
      } catch (parseError) {
        console.error('[SUPABASE ERROR] Erreur de parsing JSON:', parseError);
        return { 
          data: null, 
          error: 'Erreur de parsing de la réponse JSON' 
        };
      }
    }
    
    // Gestion des réponses Supabase
    const { data, error } = response as PostgrestSingleResponse<T>;
    
    if (error) {
      console.error('[SUPABASE ERROR]', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      return { data: null, error: error.message };
    }
    
    return { data, error: null };
  } catch (error) {
    // Gestion des erreurs réseau
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('[SUPABASE ERROR] Erreur réseau:', error);
      return { 
        data: null, 
        error: 'Erreur de connexion réseau. Vérifiez votre connexion internet.' 
      };
    }
    
    // Gestion des erreurs JWT
    if (isJwtError(error)) {
      console.error('[SUPABASE ERROR] Erreur JWT:', error);
      return { 
        data: null, 
        error: 'Session expirée. Veuillez vous reconnecter.' 
      };
    }
    
    // Gestion des erreurs de timeout
    if (error instanceof Error && error.message.includes('timeout')) {
      console.error('[SUPABASE ERROR] Timeout:', error);
      return { 
        data: null, 
        error: 'La requête a expiré. Veuillez réessayer.' 
      };
    }
    
    // Gestion des autres erreurs
    if (error instanceof Error) {
      console.error('[SUPABASE ERROR]', error);
      return { data: null, error: error.message };
    }
    
    return { 
      data: null, 
      error: 'Une erreur inconnue est survenue' 
    };
  }
}

export function isApiError(error: unknown): error is PostgrestError | AuthError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    ('code' in error || 'status' in error)
  );
}

export function isWebSocketError(error: unknown): error is WebSocketError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error
  );
}

export function handleApiError(error: unknown): string {
  if (isApiError(error)) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Une erreur inconnue est survenue';
}

export function handleWebSocketError(error: unknown): WebSocketError {
  if (isWebSocketError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message
    };
  }
  return {
    code: 'UNKNOWN_ERROR',
    message: 'Une erreur inconnue est survenue'
  };
}

export function isJwtError(error: unknown): boolean {
  if (isApiError(error)) {
    return error.message.includes('JWT') || error.message.includes('token');
  }
  if (error instanceof Error) {
    return error.message.includes('JWT') || error.message.includes('token');
  }
  return false;
}

export function isConnectionError(error: unknown): boolean {
  if (isWebSocketError(error)) {
    return error.code === 'CONNECTION_ERROR' || error.code === 'TIMEOUT';
  }
  if (error instanceof Error) {
    return error.message.includes('connection') || error.message.includes('timeout');
  }
  return false;
}

export function shouldRetryConnection(error: unknown): boolean {
  return isConnectionError(error) || isJwtError(error);
}

export function formatWebSocketStatus(status: string): string {
  switch (status) {
    case 'SUBSCRIBED':
      return '✅ Connecté';
    case 'CLOSED':
      return '🔒 Fermé';
    case 'CHANNEL_ERROR':
      return '❌ Erreur';
    case 'TIMED_OUT':
      return '⏰ Timeout';
    default:
      return `❓ ${status}`;
  }
}

export type Tables = Database["public"]["Tables"];
export type Enums = Database["public"]["Enums"];

export type TableName = keyof Tables;
export type TableRow<T extends TableName> = Tables[T]["Row"];
export type TableInsert<T extends TableName> = Tables[T]["Insert"];
export type TableUpdate<T extends TableName> = Tables[T]["Update"];

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "is" | "in" | "cs" | "cd" | "sl" | "sr" | "nxl" | "nxr" | "adj" | "ov" | "fts" | "plfts" | "phfts" | "wfts";

export type Filter<T extends TableName> = {
  column: keyof TableRow<T>;
  operator: FilterOperator;
  value: any;
};

export type Order<T extends TableName> = {
  column: keyof TableRow<T>;
  ascending?: boolean;
};

export type QueryOptions<T extends TableName> = {
  filters?: Filter<T>[];
  order?: Order<T>[];
  limit?: number;
  offset?: number;
  select?: (keyof TableRow<T>)[];
};

export async function queryTable<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  options: QueryOptions<T> = {}
): Promise<TableRow<T>[]> {
  let query = client.from(table).select(options.select?.join(",") || "*");

  if (options.filters) {
    options.filters.forEach((filter) => {
      query = query.filter(filter.column as string, filter.operator, filter.value);
    });
  }

  if (options.order) {
    options.order.forEach((order) => {
      query = query.order(order.column as string, { ascending: order.ascending ?? true });
    });
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error("Les données retournées ne sont pas un tableau");
  }

  return data as unknown as TableRow<T>[];
}

export async function insertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  row: TableInsert<T>
): Promise<TableRow<T>> {
  const { data, error } = await client.from(table).insert(row).select().single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Aucune donnée retournée");
  }

  return data as unknown as TableRow<T>;
}

export async function updateRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string,
  updates: TableUpdate<T>
): Promise<TableRow<T>> {
  const { data, error } = await client.from(table).update(updates).eq("id", id).select().single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Aucune donnée retournée");
  }

  return data as unknown as TableRow<T>;
}

export async function deleteRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string
): Promise<void> {
  const { error } = await client.from(table).delete().eq("id", id);

  if (error) {
    throw error;
  }
}

export async function getRowById<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  id: string
): Promise<TableRow<T> | null> {
  const { data, error } = await client.from(table).select("*").eq("id", id).single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as unknown as TableRow<T>;
}

export async function countRows<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  filters?: Filter<T>[]
): Promise<number> {
  let query = client.from(table).select("*", { count: "exact", head: true });

  if (filters) {
    filters.forEach((filter) => {
      query = query.filter(filter.column as string, filter.operator, filter.value);
    });
  }

  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count || 0;
}

export async function upsertRow<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  row: TableInsert<T>,
  onConflict?: string
): Promise<TableRow<T>> {
  const { data, error } = await client
    .from(table)
    .upsert(row, { onConflict })
    .select()
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("Aucune donnée retournée");
  }

  return data as unknown as TableRow<T>;
}

export async function batchInsert<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  rows: TableInsert<T>[]
): Promise<TableRow<T>[]> {
  const { data, error } = await client.from(table).insert(rows).select();

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error("Les données retournées ne sont pas un tableau");
  }

  return data as unknown as TableRow<T>[];
}

export async function batchUpdate<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  updates: { id: string; data: TableUpdate<T> }[]
): Promise<TableRow<T>[]> {
  const { data, error } = await client.from(table).upsert(
    updates.map((update) => ({
      id: update.id,
      ...update.data,
    }))
  ).select();

  if (error) {
    throw error;
  }

  if (!Array.isArray(data)) {
    throw new Error("Les données retournées ne sont pas un tableau");
  }

  return data as unknown as TableRow<T>[];
}

export async function batchDelete<T extends TableName>(
  client: SupabaseClient<Database>,
  table: T,
  ids: string[]
): Promise<void> {
  const { error } = await client.from(table).delete().in("id", ids);

  if (error) {
    throw error;
  }
}

export async function transaction<T>(
  client: SupabaseClient<Database>,
  callback: (client: SupabaseClient<Database>) => Promise<T>
): Promise<T> {
  const { error } = await client.rpc("begin_transaction");

  if (error) {
    throw error;
  }

  try {
    const result = await callback(client);
    await client.rpc("commit_transaction");
    return result;
  } catch (error) {
    await client.rpc("rollback_transaction");
    throw error;
  }
} 