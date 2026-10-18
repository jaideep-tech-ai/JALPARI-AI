// ============ Demo geographic dataset for JALGUARD ============
// Clearly-labelled DEMO asset registry covering 12 Indian cities.
// Coordinates are approximate city-internal locations for demonstration only.

export interface DemoAsset {
  code: string;
  name: string;
  category: 'DRAIN' | 'CULVERT' | 'PUMP_STATION' | 'RESERVOIR' | 'LOW_LYING_ZONE' | 'RETENTION_POND';
  lat: number;
  lon: number;
  city: string;
  district: string;
  state: string;
  vulnerability: number;
  drainage: 'LOW' | 'MODERATE' | 'HIGH';
  elevationM: number;
  notes: string;
  lastInspectedDaysAgo: number;
}

export const DEMO_ASSETS: DemoAsset[] = [
  // Mumbai
  { code: 'MUM-DR-001', name: 'Hindmata Stormwater Drain', category: 'DRAIN', lat: 19.0297, lon: 72.8407, city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', vulnerability: 5, drainage: 'LOW', elevationM: 6, notes: 'Chronic waterlogging point near railway underpass.', lastInspectedDaysAgo: 120 },
  { code: 'MUM-PS-002', name: 'Haji Ali Pumping Station', category: 'PUMP_STATION', lat: 18.979, lon: 72.8153, city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', vulnerability: 3, drainage: 'HIGH', elevationM: 3, notes: '6 pumps; 2 due for servicing.', lastInspectedDaysAgo: 25 },
  { code: 'MUM-LL-003', name: 'Kurla West Low-Lying Zone', category: 'LOW_LYING_ZONE', lat: 19.0726, lon: 72.8875, city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', vulnerability: 5, drainage: 'LOW', elevationM: 2, notes: 'Tidal influence; dense settlement.', lastInspectedDaysAgo: 60 },
  // Delhi
  { code: 'DEL-DR-010', name: 'IIT Gate Drain Outfall', category: 'DRAIN', lat: 28.5473, lon: 77.1921, city: 'Delhi', district: 'South West Delhi', state: 'Delhi', vulnerability: 4, drainage: 'MODERATE', elevationM: 216, notes: 'Silt accumulation reported after monsoon spells.', lastInspectedDaysAgo: 95 },
  { code: 'DEL-CU-011', name: 'Ring Road Culvert 7', category: 'CULVERT', lat: 28.5688, lon: 77.2353, city: 'Delhi', district: 'New Delhi', state: 'Delhi', vulnerability: 3, drainage: 'MODERATE', elevationM: 213, notes: 'Periodic debris blockage.', lastInspectedDaysAgo: 40 },
  { code: 'DEL-RS-012', name: 'Sudarshan Retention Pond', category: 'RETENTION_POND', lat: 28.6219, lon: 77.3155, city: 'Delhi', district: 'East Delhi', state: 'Delhi', vulnerability: 2, drainage: 'HIGH', elevationM: 208, notes: 'Recently desilted.', lastInspectedDaysAgo: 15 },
  // Chennai
  { code: 'CHE-DR-020', name: 'Anna Nagar Main Channel', category: 'DRAIN', lat: 13.085, lon: 80.2101, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 5, drainage: 'LOW', elevationM: 6, notes: 'Historic flood corridor.', lastInspectedDaysAgo: 30 },
  { code: 'CHE-PS-021', name: 'Kodungaiyur Pump House', category: 'PUMP_STATION', lat: 13.1187, lon: 80.2341, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 3, drainage: 'HIGH', elevationM: 4, notes: 'Functional; backup power tested monthly.', lastInspectedDaysAgo: 20 },
  { code: 'CHE-LL-022', name: 'Velachery Lake Margin', category: 'LOW_LYING_ZONE', lat: 12.9791, lon: 80.221, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 5, drainage: 'LOW', elevationM: 4, notes: 'Rapid urbanisation reduced lake capacity.', lastInspectedDaysAgo: 75 },
  // Kolkata
  { code: 'KOL-DR-030', name: 'Tolly Nullah Stretch 3', category: 'DRAIN', lat: 22.5047, lon: 88.3347, city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', vulnerability: 4, drainage: 'MODERATE', elevationM: 9, notes: 'Tidal lock operation critical.', lastInspectedDaysAgo: 55 },
  { code: 'KOL-PS-031', name: 'Palta Pumping Station', category: 'PUMP_STATION', lat: 22.7496, lon: 88.3742, city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', vulnerability: 3, drainage: 'HIGH', elevationM: 7, notes: 'Heritage infrastructure, modernised 2021.', lastInspectedDaysAgo: 35 },
  // Bengaluru
  { code: 'BLR-CU-040', name: 'Silk Board Culvert Complex', category: 'CULVERT', lat: 12.9172, lon: 77.6229, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 4, drainage: 'LOW', elevationM: 905, notes: 'Constriction point on stormwater drain network.', lastInspectedDaysAgo: 85 },
  { code: 'BLR-RS-041', name: 'Jakkur Lake Bund', category: 'RESERVOIR', lat: 13.0455, lon: 77.6186, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 3, drainage: 'MODERATE', elevationM: 923, notes: 'Rejuvenated wetland; bird habitat.', lastInspectedDaysAgo: 28 },
  { code: 'BLR-DR-042', name: 'Koramangala Valley Drain', category: 'DRAIN', lat: 12.9352, lon: 77.6245, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 4, drainage: 'MODERATE', elevationM: 899, notes: 'Encroachment pressure on rajakaluve.', lastInspectedDaysAgo: 66 },
  // Hyderabad
  { code: 'HYD-RS-050', name: 'Hussain Sagar Outfall', category: 'RESERVOIR', lat: 17.4239, lon: 78.4695, city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', vulnerability: 3, drainage: 'MODERATE', elevationM: 514, notes: 'Sluice gates require manual operation.', lastInspectedDaysAgo: 45 },
  { code: 'HYD-LL-051', name: 'Alwal Low-Lying Basti', category: 'LOW_LYING_ZONE', lat: 17.5033, lon: 78.5107, city: 'Hyderabad', district: 'Medchal-Malkajgiri', state: 'Telangana', vulnerability: 5, drainage: 'LOW', elevationM: 540, notes: 'Recurring monsoon inundation.', lastInspectedDaysAgo: 90 },
  // Ahmedabad
  { code: 'AMD-DR-060', name: 'Vastrapur Drain Node', category: 'DRAIN', lat: 23.0365, lon: 72.5437, city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', vulnerability: 3, drainage: 'MODERATE', elevationM: 53, notes: 'Covers lake-adjacent commercial belt.', lastInspectedDaysAgo: 50 },
  { code: 'AMD-PS-061', name: 'Vasna Barrage Pump Bay', category: 'PUMP_STATION', lat: 23.0021, lon: 72.5535, city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', vulnerability: 2, drainage: 'HIGH', elevationM: 49, notes: 'Newly commissioned.', lastInspectedDaysAgo: 10 },
  // Pune
  { code: 'PUN-CU-070', name: 'Karve Road Culvert', category: 'CULVERT', lat: 18.4899, lon: 73.8266, city: 'Pune', district: 'Pune', state: 'Maharashtra', vulnerability: 4, drainage: 'MODERATE', elevationM: 560, notes: 'Downstream constriction near river.', lastInspectedDaysAgo: 70 },
  { code: 'PUN-LL-071', name: 'Wadgaon Sheri Floodplain', category: 'LOW_LYING_ZONE', lat: 18.559, lon: 73.9297, city: 'Pune', district: 'Pune', state: 'Maharashtra', vulnerability: 4, drainage: 'LOW', elevationM: 553, notes: 'River-adjacent, fast runoff catchment.', lastInspectedDaysAgo: 48 },
  // Jaipur
  { code: 'JAI-DR-080', name: 'Jhotwara Drain Line 2', category: 'DRAIN', lat: 26.9428, lon: 75.7628, city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', vulnerability: 3, drainage: 'MODERATE', elevationM: 431, notes: 'Desert climate; flash-rain exposure.', lastInspectedDaysAgo: 58 },
  // Kochi
  { code: 'KOC-CU-090', name: 'Kaloor Canal Crossing', category: 'CULVERT', lat: 9.9956, lon: 76.2999, city: 'Kochi', district: 'Ernakulam', state: 'Kerala', vulnerability: 4, drainage: 'LOW', elevationM: 1, notes: 'Tidal backflow during high tide + rain.', lastInspectedDaysAgo: 42 },
  { code: 'KOC-PS-091', name: 'Elamakkara Pump Station', category: 'PUMP_STATION', lat: 10.0225, lon: 76.2966, city: 'Kochi', district: 'Ernakulam', state: 'Kerala', vulnerability: 3, drainage: 'HIGH', elevationM: 2, notes: 'Coastal salinity requires corrosion checks.', lastInspectedDaysAgo: 22 },
  // Guwahati
  { code: 'GAU-DR-100', name: 'Bharalu River Drain Junction', category: 'DRAIN', lat: 26.1563, lon: 91.7695, city: 'Guwahati', district: 'Kamrup Metropolitan', state: 'Assam', vulnerability: 5, drainage: 'LOW', elevationM: 55, notes: 'Hill runoff + river backwater interplay.', lastInspectedDaysAgo: 33 },
  // Patna
  { code: 'PAT-LL-110', name: 'Patna City Ghat Zone', category: 'LOW_LYING_ZONE', lat: 25.6093, lon: 85.1376, city: 'Patna', district: 'Patna', state: 'Bihar', vulnerability: 5, drainage: 'LOW', elevationM: 53, notes: 'Ganga floodplain exposure.', lastInspectedDaysAgo: 80 },
];

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
