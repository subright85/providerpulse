export type ProviderCategory = 'llm' | 'infra' | 'data' | 'payment';

export type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance';

export type IncidentTag =
  | 'inference' | 'api' | 'availability' | 'performance'
  | 'auth' | 'rate-limit' | 'billing' | 'database'
  | 'network' | 'webhook' | 'deployment' | 'other';

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  statusPageUrl: string;
  apiUrl: string;
  color: string;
  icon: string;
  domain: string;
}

export interface Incident {
  id: string;
  providerId: string;
  title: string;
  severity: IncidentSeverity;
  tags: IncidentTag[];
  startedAt: string;
  resolvedAt: string | null;
  durationMinutes: number | null;
  url: string;
}

export interface MonthlyTrend {
  month: string;   // "2026-01"
  label: string;   // "Jan '26"
  incidentCount: number;
  uptime: number;  // 0-100
}

export interface TagSummaryItem {
  tag: IncidentTag;
  count30d: number;
  count90d: number;
}

export interface CategoryTagTrendItem {
  tag: IncidentTag;
  count30d: number;
  count90d: number;
  trend: 'up' | 'down' | 'stable';
  providers: string[];  // provider IDs
}

export interface CategoryTagTrend {
  category: string;
  tags: CategoryTagTrendItem[];
}

export interface NewsItem {
  id: string;
  title: string;
  url: string;
  source: 'hackernews';
  publishedAt: string;
  points: number;
  commentCount: number;
}

export interface ProviderStatus {
  providerId: string;
  indicator: 'none' | 'minor' | 'major' | 'critical' | 'maintenance';
  description: string;
  updatedAt: string;
}

export interface ProviderStats {
  providerId: string;
  uptime30d: number | null;
  uptime90d: number | null;
  incidentCount30d: number;
  avgMttr30d: number | null;
  lastIncident: string | null;
  reliabilityScore: number | null;
  reliabilityScore90d: number | null;
  monthlyTrend: MonthlyTrend[];
  tagSummary: TagSummaryItem[];
}

export interface ProviderData {
  provider: Provider;
  status: ProviderStatus;
  stats: ProviderStats;
  recentIncidents: Incident[];
  news: NewsItem[];
}

export interface AppData {
  providers: ProviderData[];
  categoryTagTrends: CategoryTagTrend[];
  generatedAt: string;
}
