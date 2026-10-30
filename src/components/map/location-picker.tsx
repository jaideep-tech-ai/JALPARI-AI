'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, useMapEvents, CircleMarker, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export interface LocationPickerProps {
  assessments: never[];
  incidents: never[];
  tasks: never[];
  showRisk: false;
  showIncidents: false;
  showTasks: false;
  minSeverity: 'LOW';
  compact: true;
  theme: 'dark';
  flyTarget: null;
  pickPoint: { lat: number; lon: number };
  onPick: (lat: number, lon: number) => void;
}

function ClickCatcher({ onPick }: { onPick: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function LocationPicker({ pickPoint, onPick }: LocationPickerProps) {
  // pan to picked point
  const Recenter = () => {
    const map = useMapEvents({});
    useEffect(() => {
      map.panTo([pickPoint.lat, pickPoint.lon], { animate: true });
    }, [pickPoint.lat, pickPoint.lon, map]);
    return null;
  };
  return (
    <MapContainer
      center={[pickPoint.lat, pickPoint.lon]}
      zoom={10}
      minZoom={5}
      maxZoom={16}
      className="jg-tiles-dark h-full w-full"
      attributionControl={false}
    >
      <TileLayer
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <ClickCatcher onPick={onPick} />
      <Recenter />
      <style>{`.leaflet-container .leaflet-tile{filter:brightness(0.55) invert(0.92) sepia(0.4) hue-rotate(185deg) saturate(1.7) brightness(0.78) contrast(1.18)!important}`}</style>
      <CircleMarker
        center={[pickPoint.lat, pickPoint.lon]}
        radius={9}
        pathOptions={{ color: '#FFFFFF', weight: 1.5, fillColor: '#10B981', fillOpacity: 0.95 }}
      >
        <Tooltip permanent direction="top" offset={[0, -8]}>
          picked
        </Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
