export interface DatabaseConfig {
  id: string;
  name: string;
  type: 'supabase' | 'postgresql' | 'mysql';
  host?: string;
  port?: number;
  database: string;
  username: string;
  password: string;
  url?: string;
  ssl?: boolean;
}

export const DATABASE_CONFIGS: DatabaseConfig[] = [
  {
    id: 'vps-postgresql',
    name: 'VPS PostgreSQL (Production)',
    type: 'postgresql',
    host: '147.93.58.155',
    port: 5432,
    database: 'coworkmy',
    username: 'vpshostinger',
    password: 'Fethi@2025!',
    ssl: false,
  },
  {
    id: 'supabase',
    name: 'Supabase (Cloud)',
    type: 'supabase',
    url: 'https://exffryodynkyizbeesbt.supabase.co',
    database: 'postgres',
    username: 'postgres',
    password: '', // Utilise les variables d'environnement
  },
  {
    id: 'o2switch',
    name: 'O2Switch PostgreSQL',
    type: 'postgresql',
    host: '109.234.166.71',
    port: 5432,
    database: 'sc2rafi0640_coworkmy',
    username: 'sc2rafi0640_rafi0640',
    password: 'Hla2025Cowork*',
    ssl: false,
  },
  {
    id: 'mysql-local',
    name: 'MySQL Local',
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    database: 'coworkmy',
    username: 'root',
    password: '',
    ssl: false,
  },
  {
    id: 'mysql-production',
    name: 'MySQL Production',
    type: 'mysql',
    host: import.meta.env.VITE_MYSQL_HOST || 'localhost',
    port: parseInt(import.meta.env.VITE_MYSQL_PORT || '3306'),
    database: import.meta.env.VITE_MYSQL_DATABASE || 'coworkmy',
    username: import.meta.env.VITE_MYSQL_USER || 'root',
    password: import.meta.env.VITE_MYSQL_PASSWORD || '',
    ssl: import.meta.env.VITE_MYSQL_SSL === 'true',
  }
];

export const getCurrentDatabaseConfig = (): DatabaseConfig => {
  // Utiliser PostgreSQL VPS par défaut
  const currentDb = localStorage.getItem('selected_database') || 'vps-postgresql';
  const config = DATABASE_CONFIGS.find(config => config.id === currentDb);
  
  if (config) {
    return config;
  }
  
  // Fallback sur PostgreSQL VPS si la configuration n'est pas trouvée
  return DATABASE_CONFIGS.find(config => config.id === 'vps-postgresql') || DATABASE_CONFIGS[0];
};

export const setCurrentDatabase = (databaseId: string) => {
  localStorage.setItem('selected_database', databaseId);
};

export const getDatabaseConnectionString = (config: DatabaseConfig): string => {
  if (config.type === 'supabase') {
    return config.url || '';
  }
  
  if (config.type === 'postgresql') {
    const ssl = config.ssl ? '?sslmode=require' : '';
    return `postgresql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}${ssl}`;
  }
  
  if (config.type === 'mysql') {
    return `mysql://${config.username}:${config.password}@${config.host}:${config.port}/${config.database}`;
  }
  
  return '';
}; 