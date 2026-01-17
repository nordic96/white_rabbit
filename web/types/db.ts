export type DBStatus = 'healthy' | 'unhealthy' | 'unknown';

export interface DBHealthResponse {
  api: string;
  database: {
    status: 'healthy' | 'unhealthy';
    database?: string;
    uri?: string;
    error?: string;
  };
}
