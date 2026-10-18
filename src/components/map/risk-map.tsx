'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Marker, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SEVERITY_COLORS, type Severity } from '@/lib/types';

export interface MapAssessment {
  id: string;
  assetId: string | null;
  assetName?: string;
  city: string;
  lat: number;
  lon: number;
  score: number;
  severity: string;
  confidence: number;
  isDemo: boolean;
}

export interface MapIncident {
  id: string;
  title: string;
  category: string;
  severity: string;
  status: string;
  lat: number;
  lon: number;
  city: string;
  isDemo: boolean;
}

export interface MapTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  lat: number;
  lon: number;
  city: string | null;
  isDemo: boolean;
}

export interface FlyTarget {
  lat: number;
  lon: number;
  zoom?: number;
  key: number;
}

function FlyController({ target }: { target: FlyTarget | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lon], target.zoom ?? 11, { duration: 0.8 });
    }
  }, [target, map]);
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 250);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function incidentIcon(sev: string) {
  const color = SEVERITY_COLORS[(sev as Severity) ?? 'MODERATE'] ?? '#F59E0B';
  return L.divIcon({
    className: '',
    iconSize: [18, 22],
    iconAnchor: [9, 20],
    html: `<svg width="18" height="22" viewBox="0 0 18 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 1.5C9 1.5 2 9.2 2 13.7a7 7 0 1 0 14 0C16 9.2 9 1.5 9 1.5Z" fill="${color}" stroke="#FFFFFF" stroke-width="1.4"/>
    </svg>`,
  });
}

function taskIcon(status: string) {
  const done = ['APPROVED', 'DONE'].includes(status);
  const active = ['IN_PROGRESS', 'SUBMITTED'].includes(status);
  const color = done ? '#10B981' : active ? '#38D9D6' : '#F59E0B';
  return L.divIcon({
    className: '',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
    html: `<svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <rect x="2.5" y="2.5" width="11" height="11" rx="2.5" fill="${color}" stroke="#FFFFFF" stroke-width="1.4"/>
    </svg>`,
  });
}

export interface RiskMapProps {
  assessments: MapAssessment[];
  incidents: MapIncident[];
  tasks: MapTask[];
  showRisk: boolean;
  showIncidents: boolean;
  showTasks: boolean;
  minSeverity: Severity; // 'LOW' shows all
  flyTarget: FlyTarget | null;
  onSelectAsset?: (assetId: string | null) => void;
  compact?: boolean;
  theme: 'light' | 'dark';
}

const SEV_ORDER: Record<string, number> = { LOW: 0, MODERATE: 1, HIGH: 2, CRITICAL: 3 };

export default function RiskMap({
  assessments, incidents, tasks,
  showRisk, showIncidents, showTasks,
  minSeverity, flyTarget, onSelectAsset, compact, theme,
}: RiskMapProps) {
  const dark = theme === 'dark';
  return (
    <MapContainer
      center={compact ? [22.8, 82] : [22.9, 81.5]}
      zoom={compact ? 4 : 5}
      minZoom={4}
      maxZoom={14}
      scrollWheelZoom={!compact}
      zoomControl={!compact}
      attributionControl={!compact}
      className="h-full w-full"
      style={{ borderRadius: compact ? undefined : '0.75rem' }}
      maxBounds={[[5.5, 66], [37.5, 99]]}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked={dark} name="Night (OSM)">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer checked={!dark} name="Standard (OSM)">
          <TileLayer
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
      </LayersControl>

      <FlyController target={flyTarget} />

      {/* Night tile styling rendered inline so it never depends on the CSS pipeline */}
      {dark && (
        <style>{`.leaflet-container .leaflet-tile{filter:brightness(0.55) invert(0.92) sepia(0.4) hue-rotate(185deg) saturate(1.7) brightness(0.78) contrast(1.18)!important}`}</style>
      )}

      {showRisk &&
        assessments
          .filter((a) => SEV_ORDER[a.severity] >= SEV_ORDER[minSeverity])
          .map((a) => {
            const color = SEVERITY_COLORS[(a.severity as Severity) ?? 'LOW'];
            const radius = a.severity === 'CRITICAL' ? 11 : a.severity === 'HIGH' ? 9 : a.severity === 'MODERATE' ? 7 : 5;
            return (
              <CircleMarker
                key={`r-${a.id}`}
                center={[a.lat, a.lon]}
                radius={radius}
                pathOptions={{
                  color: '#FFFFFF',
                  weight: 1.2,
                  fillColor: color,
                  fillOpacity: 0.85,
                }}
                eventHandlers={{ click: () => onSelectAsset?.(a.assetId) }}
              >
                <Tooltip direction="top" offset={[0, -6]} opacity={1}>
                  <div className="text-[11px] leading-snug">
                    <strong>{a.assetName ?? a.city}</strong>
                    <br />
                    Risk {a.score}/100 · {a.severity}
                    {a.isDemo && <em> · demo</em>}
                  </div>
                </Tooltip>
              </CircleMarker>
            );
          })}

      {showIncidents &&
        incidents
          .filter((i) => SEV_ORDER[i.severity] >= SEV_ORDER[minSeverity])
          .map((i) => (
            <Marker key={`i-${i.id}`} position={[i.lat, i.lon]} icon={incidentIcon(i.severity)}>
              <Tooltip direction="top" offset={[0, -16]} opacity={1}>
                <div className="text-[11px] leading-snug max-w-44">
                  <strong>{i.title}</strong>
                  <br />
                  {i.category} · {i.status}
                  {i.isDemo && <em> · demo</em>}
                </div>
              </Tooltip>
            </Marker>
          ))}

      {showTasks &&
        tasks.map((t) => (
          <Marker key={`t-${t.id}`} position={[t.lat, t.lon]} icon={taskIcon(t.status)}>
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="text-[11px] leading-snug max-w-44">
                <strong>{t.title}</strong>
                <br />
                {t.status} · {t.priority}
                {t.isDemo && <em> · demo</em>}
              </div>
            </Tooltip>
          </Marker>
        ))}
    </MapContainer>
  );
}
