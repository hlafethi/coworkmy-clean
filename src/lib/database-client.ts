import { createClient } from '@supabase/supabase-js';
import { executeQuery as executePostgreSQLQuery } from './postgresql';
import { executeQuery as executeMySQLQuery } from './mysql';
import { getCurrentDatabaseConfig } from '../config/database';

export interface DatabaseResult<T = any> {
  data: T[] | null;
  error: string | null;
}

class DatabaseClient {
  private supabaseClient: any = null;

  private getSupabaseClient() {
    if (!this.supabaseClient) {
      const config = getCurrentDatabaseConfig();
      this.supabaseClient = createClient(
        config.url!,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );
    }
    return this.supabaseClient;
  }

  async query<T = any>(query: string, params: any[] = []): Promise<DatabaseResult<T>> {
    const config = getCurrentDatabaseConfig();
    
    try {
      switch (config.type) {
        case 'supabase':
          // Pour Supabase, on utilise les méthodes spécifiques
          return await this.supabaseQuery<T>(query, params);
        
        case 'postgresql':
          const postgresResult = await executePostgreSQLQuery<T>(query, params);
          return { data: postgresResult, error: null };
        
        case 'mysql':
          const mysqlResult = await executeMySQLQuery<T>(query, params);
          return { data: mysqlResult, error: null };
        
        default:
          throw new Error(`Type de base de données non supporté: ${config.type}`);
      }
    } catch (error) {
      console.error(`[Database] Erreur lors de l'exécution de la requête:`, error);
      return { 
        data: null, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      };
    }
  }

  private async supabaseQuery<T = any>(query: string, params: any[] = []): Promise<DatabaseResult<T>> {
    // Pour Supabase, on utilise les méthodes spécifiques selon le type de requête
    const client = this.getSupabaseClient();
    
    // Détecter le type de requête (SELECT, INSERT, UPDATE, DELETE)
    const trimmedQuery = query.trim().toLowerCase();
    
    if (trimmedQuery.startsWith('select')) {
      // Requête SELECT - utiliser .from() et .select()
      const tableMatch = query.match(/from\s+(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const result = await client.from(tableName).select('*');
        return { data: result.data, error: result.error };
      }
    }
    
    // Pour les autres types de requêtes, utiliser .rpc() ou .from()
    try {
      const result = await client.rpc('exec_sql', { sql_query: query, params: params });
      return { data: result.data, error: result.error };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error.message : 'Erreur Supabase' };
    }
  }

  // Méthodes spécifiques pour les opérations courantes
  async select<T = any>(table: string, columns: string[] = ['*'], where?: any): Promise<DatabaseResult<T>> {
    const config = getCurrentDatabaseConfig();
    
    if (config.type === 'supabase') {
      const client = this.getSupabaseClient();
      let query = client.from(table).select(columns.join(','));
      
      if (where) {
        Object.keys(where).forEach(key => {
          query = query.eq(key, where[key]);
        });
      }
      
      const result = await query;
      return { data: result.data, error: result.error };
    } else {
      let query = `SELECT ${columns.join(', ')} FROM ${table}`;
      const params: any[] = [];
      
      if (where) {
        const conditions = Object.keys(where).map((key, index) => {
          params.push(where[key]);
          return `${key} = $${index + 1}`;
        });
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      return await this.query<T>(query, params);
    }
  }

  async insert<T = any>(table: string, data: any): Promise<DatabaseResult<T>> {
    const config = getCurrentDatabaseConfig();
    
    if (config.type === 'supabase') {
      const client = this.getSupabaseClient();
      const result = await client.from(table).insert(data).select();
      return { data: result.data, error: result.error };
    } else {
      const columns = Object.keys(data);
      const values = Object.values(data);
      const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');
      
      const query = `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders}) RETURNING *`;
      return await this.query<T>(query, values);
    }
  }

  async update<T = any>(table: string, data: any, where: any): Promise<DatabaseResult<T>> {
    const config = getCurrentDatabaseConfig();
    
    if (config.type === 'supabase') {
      const client = this.getSupabaseClient();
      let query = client.from(table).update(data);
      
      Object.keys(where).forEach(key => {
        query = query.eq(key, where[key]);
      });
      
      const result = await query.select();
      return { data: result.data, error: result.error };
    } else {
      const setColumns = Object.keys(data).map((key, index) => `${key} = $${index + 1}`);
      const whereColumns = Object.keys(where).map((key, index) => `${key} = $${Object.keys(data).length + index + 1}`);
      
      const query = `UPDATE ${table} SET ${setColumns.join(', ')} WHERE ${whereColumns.join(' AND ')} RETURNING *`;
      const params = [...Object.values(data), ...Object.values(where)];
      
      return await this.query<T>(query, params);
    }
  }

  async delete<T = any>(table: string, where: any): Promise<DatabaseResult<T>> {
    const config = getCurrentDatabaseConfig();
    
    if (config.type === 'supabase') {
      const client = this.getSupabaseClient();
      let query = client.from(table).delete();
      
      Object.keys(where).forEach(key => {
        query = query.eq(key, where[key]);
      });
      
      const result = await query.select();
      return { data: result.data, error: result.error };
    } else {
      const whereColumns = Object.keys(where).map((key, index) => `${key} = $${index + 1}`);
      const query = `DELETE FROM ${table} WHERE ${whereColumns.join(' AND ')} RETURNING *`;
      
      return await this.query<T>(query, Object.values(where));
    }
  }
}

export const databaseClient = new DatabaseClient(); 