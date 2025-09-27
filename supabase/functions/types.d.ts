// Type definitions for Deno modules

declare module "std/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "supabase" {
  export function createClient(supabaseUrl: string, supabaseKey: string): any;
}

declare module "postgres" {
  export class Client {
    constructor(config: {
      hostname: string;
      port: number;
      database: string;
      user: string;
      password: string;
    });
    connect(): Promise<void>;
    queryArray: any;
    end(): Promise<void>;
  }
}

declare module "mysql" {
  export class Client {
    connect(config: {
      hostname: string;
      port: number;
      username: string;
      password: string;
      db: string;
    }): Promise<Client>;
    execute(query: string): Promise<any>;
    close(): Promise<void>;
  }
}
