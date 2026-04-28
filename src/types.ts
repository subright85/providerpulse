export type ProviderCategory = 'llm' | 'infra' | 'data' | 'payment';

export type IncidentSeverity = 'critical' | 'major' | 'minor' | 'maintenance';

export interface Provider {
  id: string;
  name: string;
  category: ProviderCategory;
  statusPageUrl: string;
  apiUrl: string; // Statuspage API endpoint
  color: string;
  icon: string;
}

export interface Incident {
  id: string;
  providerId: string;
  title: string;
  severity: IncidentSeverity;
  startedAt: string;   // ISO
  resolvedAt: string | null;
  durationMinutes: number | null;
  url: string;
}

export interface ProviderStatus {
  providerId: string;
  indicator: 'none' | 'minor' | 'major' | 'critical' | 'maintenance';
  description: string;
  updatedAt: string;
}

export interface ProviderStats {
  providerId: string;
  uptime30d: number;      // 0-100
  uptime90d: number;
  incidentCount30d: number;
  avgMttr30d: number | null;  // minutes
  lastIncident: string | null; // ISO
  reliabilityScore: number;   // 0-100 composite
}

export interface ProviderData {
  provider: Provider;
  status: ProviderStatus;
  stats: ProviderStats;
  recentIncidents: Incident[];
}

export interface AppData {
  providers: ProviderData[];
  generatedAt: string;
}
