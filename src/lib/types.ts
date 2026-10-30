// ============ JALGUARD shared types ============

export type Role =
  | 'citizen'
  | 'municipal'
  | 'disaster'
  | 'field'
  | 'infra'
  | 'analyst'
  | 'org_admin'
  | 'super_admin';

export type Severity = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export const PRIVILEGED_ROLES: Role[] = [
  'municipal',
  'disaster',
  'field',
  'infra',
  'analyst',
  'org_admin',
  'super_admin',
];

export const ROLE_KEYS: Role[] = [
  'citizen',
  'municipal',
  'disaster',
  'field',
  'infra',
  'analyst',
  'org_admin',
  'super_admin',
];

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role | null;
  roleStatus: string | null;
  emailVerified: boolean;
  onboarded: boolean;
  language: string;
  organization: string | null;
  regionState: string | null;
  regionCity: string | null;
  notificationsEnabled: boolean;
  mustChangePassword: boolean;
  isDemo: boolean;
}

export interface RiskFactor {
  key: string;
  label: string;
  labelHi: string;
  weight: number; // contribution to score
  detail: string;
}

export interface WeatherData {
  status: 'LIVE' | 'SIMULATED';
  source: string;
  fetchedAt: string;
  location: string;
  lat: number;
  lon: number;
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    weatherCode: number;
    windSpeed: number;
  };
  hourly: { time: string; precip: number }[];
  daily: { date: string; rainSum: number; rainMax: number }[];
  note: string;
}

export interface AssessmentDTO {
  id: string;
  assetId: string | null;
  assetName?: string;
  city: string;
  lat: number;
  lon: number;
  score: number;
  severity: Severity;
  factors: RiskFactor[];
  confidence: number;
  horizon: string;
  source: string;
  dataFreshness: string;
  isDemo: boolean;
  createdAt: string;
}

export const SEVERITY_COLORS: Record<Severity, string> = {
  LOW: '#10B981',
  MODERATE: '#F59E0B',
  HIGH: '#F97316',
  CRITICAL: '#EF4444',
};

export const CITIES = [
  { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lon: 72.8777 },
  { city: 'Delhi', state: 'Delhi', lat: 28.6139, lon: 77.209 },
  { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lon: 80.2707 },
  { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lon: 88.3639 },
  { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946 },
  { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867 },
  { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lon: 72.5714 },
  { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lon: 73.8567 },
  { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873 },
  { city: 'Kochi', state: 'Kerala', lat: 9.9312, lon: 76.2673 },
  { city: 'Guwahati', state: 'Assam', lat: 26.1445, lon: 91.7362 },
  { city: 'Patna', state: 'Bihar', lat: 25.5941, lon: 85.1376 },
];

export const INCIDENT_CATEGORIES = [
  'WATERLOGGING',
  'FLOODING',
  'DRAIN_BLOCKAGE',
  'INFRA_DAMAGE',
  'CONTAMINATION',
  'OTHER',
] as const;

export const TASK_TYPES = [
  'DRAIN_INSPECTION',
  'DRAIN_CLEANING',
  'CULVERT_INSPECTION',
  'WATER_LEVEL_MONITORING',
  'FIELD_INSPECTION',
  'PUMPING_ASSESSMENT',
  'PREVENTIVE_MAINTENANCE',
] as const;
