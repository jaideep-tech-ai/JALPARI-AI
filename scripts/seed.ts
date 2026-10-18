/**
 * JALGUARD demo seed — creates clearly-labelled demonstration data.
 * Run: bun scripts/seed.ts
 *
 * Demo accounts (password: Demo#Pass1) — all marked isDemo=true:
 *   admin@jalguard.demo    super_admin
 *   officer@jalguard.demo  municipal
 *   disaster@jalguard.demo disaster
 *   field@jalguard.demo    field operations
 *   field2@jalguard.demo   field operations
 *   analyst@jalguard.demo  data analyst
 *   citizen@jalguard.demo  citizen
 */
import { PrismaClient } from '@prisma/client';
import { scryptSync, randomBytes } from 'crypto';

const db = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// deterministic pseudo-random for reproducible demo data
let seedState = 42;
function rnd(): number {
  seedState = (seedState * 1103515245 + 12345) % 2147483648;
  return seedState / 2147483648;
}

const DEMO_PASSWORD = 'Demo#Pass1';

const ASSETS = [
  { code: 'MUM-DR-001', name: 'Hindmata Stormwater Drain', category: 'DRAIN', lat: 19.0297, lon: 72.8407, city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', vulnerability: 5, drainage: 'LOW', elevationM: 6, notes: 'Chronic waterlogging point near railway underpass.', lastInspectedDaysAgo: 120 },
  { code: 'MUM-PS-002', name: 'Haji Ali Pumping Station', category: 'PUMP_STATION', lat: 18.979, lon: 72.8153, city: 'Mumbai', district: 'Mumbai City', state: 'Maharashtra', vulnerability: 3, drainage: 'HIGH', elevationM: 3, notes: '6 pumps; 2 due for servicing.', lastInspectedDaysAgo: 25 },
  { code: 'MUM-LL-003', name: 'Kurla West Low-Lying Zone', category: 'LOW_LYING_ZONE', lat: 19.0726, lon: 72.8875, city: 'Mumbai', district: 'Mumbai Suburban', state: 'Maharashtra', vulnerability: 5, drainage: 'LOW', elevationM: 2, notes: 'Tidal influence; dense settlement.', lastInspectedDaysAgo: 60 },
  { code: 'DEL-DR-010', name: 'IIT Gate Drain Outfall', category: 'DRAIN', lat: 28.5473, lon: 77.1921, city: 'Delhi', district: 'South West Delhi', state: 'Delhi', vulnerability: 4, drainage: 'MODERATE', elevationM: 216, notes: 'Silt accumulation reported after monsoon spells.', lastInspectedDaysAgo: 95 },
  { code: 'DEL-CU-011', name: 'Ring Road Culvert 7', category: 'CULVERT', lat: 28.5688, lon: 77.2353, city: 'Delhi', district: 'New Delhi', state: 'Delhi', vulnerability: 3, drainage: 'MODERATE', elevationM: 213, notes: 'Periodic debris blockage.', lastInspectedDaysAgo: 40 },
  { code: 'DEL-RS-012', name: 'Sudarshan Retention Pond', category: 'RETENTION_POND', lat: 28.6219, lon: 77.3155, city: 'Delhi', district: 'East Delhi', state: 'Delhi', vulnerability: 2, drainage: 'HIGH', elevationM: 208, notes: 'Recently desilted.', lastInspectedDaysAgo: 15 },
  { code: 'CHE-DR-020', name: 'Anna Nagar Main Channel', category: 'DRAIN', lat: 13.085, lon: 80.2101, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 5, drainage: 'LOW', elevationM: 6, notes: 'Historic flood corridor.', lastInspectedDaysAgo: 30 },
  { code: 'CHE-PS-021', name: 'Kodungaiyur Pump House', category: 'PUMP_STATION', lat: 13.1187, lon: 80.2341, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 3, drainage: 'HIGH', elevationM: 4, notes: 'Functional; backup power tested monthly.', lastInspectedDaysAgo: 20 },
  { code: 'CHE-LL-022', name: 'Velachery Lake Margin', category: 'LOW_LYING_ZONE', lat: 12.9791, lon: 80.221, city: 'Chennai', district: 'Chennai', state: 'Tamil Nadu', vulnerability: 5, drainage: 'LOW', elevationM: 4, notes: 'Rapid urbanisation reduced lake capacity.', lastInspectedDaysAgo: 75 },
  { code: 'KOL-DR-030', name: 'Tolly Nullah Stretch 3', category: 'DRAIN', lat: 22.5047, lon: 88.3347, city: 'Kolkata', district: 'Kolkata', state: 'West Bengal', vulnerability: 4, drainage: 'MODERATE', elevationM: 9, notes: 'Tidal lock operation critical.', lastInspectedDaysAgo: 55 },
  { code: 'KOL-PS-031', name: 'Palta Pumping Station', category: 'PUMP_STATION', lat: 22.7496, lon: 88.3742, city: 'Kolkata', district: 'North 24 Parganas', state: 'West Bengal', vulnerability: 3, drainage: 'HIGH', elevationM: 7, notes: 'Heritage infrastructure, modernised 2021.', lastInspectedDaysAgo: 35 },
  { code: 'BLR-CU-040', name: 'Silk Board Culvert Complex', category: 'CULVERT', lat: 12.9172, lon: 77.6229, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 4, drainage: 'LOW', elevationM: 905, notes: 'Constriction point on stormwater drain network.', lastInspectedDaysAgo: 85 },
  { code: 'BLR-RS-041', name: 'Jakkur Lake Bund', category: 'RESERVOIR', lat: 13.0455, lon: 77.6186, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 3, drainage: 'MODERATE', elevationM: 923, notes: 'Rejuvenated wetland; bird habitat.', lastInspectedDaysAgo: 28 },
  { code: 'BLR-DR-042', name: 'Koramangala Valley Drain', category: 'DRAIN', lat: 12.9352, lon: 77.6245, city: 'Bengaluru', district: 'Bengaluru Urban', state: 'Karnataka', vulnerability: 4, drainage: 'MODERATE', elevationM: 899, notes: 'Encroachment pressure on rajakaluve.', lastInspectedDaysAgo: 66 },
  { code: 'HYD-RS-050', name: 'Hussain Sagar Outfall', category: 'RESERVOIR', lat: 17.4239, lon: 78.4695, city: 'Hyderabad', district: 'Hyderabad', state: 'Telangana', vulnerability: 3, drainage: 'MODERATE', elevationM: 514, notes: 'Sluice gates require manual operation.', lastInspectedDaysAgo: 45 },
  { code: 'HYD-LL-051', name: 'Alwal Low-Lying Basti', category: 'LOW_LYING_ZONE', lat: 17.5033, lon: 78.5107, city: 'Hyderabad', district: 'Medchal-Malkajgiri', state: 'Telangana', vulnerability: 5, drainage: 'LOW', elevationM: 540, notes: 'Recurring monsoon inundation.', lastInspectedDaysAgo: 90 },
  { code: 'AMD-DR-060', name: 'Vastrapur Drain Node', category: 'DRAIN', lat: 23.0365, lon: 72.5437, city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', vulnerability: 3, drainage: 'MODERATE', elevationM: 53, notes: 'Covers lake-adjacent commercial belt.', lastInspectedDaysAgo: 50 },
  { code: 'AMD-PS-061', name: 'Vasna Barrage Pump Bay', category: 'PUMP_STATION', lat: 23.0021, lon: 72.5535, city: 'Ahmedabad', district: 'Ahmedabad', state: 'Gujarat', vulnerability: 2, drainage: 'HIGH', elevationM: 49, notes: 'Newly commissioned.', lastInspectedDaysAgo: 10 },
  { code: 'PUN-CU-070', name: 'Karve Road Culvert', category: 'CULVERT', lat: 18.4899, lon: 73.8266, city: 'Pune', district: 'Pune', state: 'Maharashtra', vulnerability: 4, drainage: 'MODERATE', elevationM: 560, notes: 'Downstream constriction near river.', lastInspectedDaysAgo: 70 },
  { code: 'PUN-LL-071', name: 'Wadgaon Sheri Floodplain', category: 'LOW_LYING_ZONE', lat: 18.559, lon: 73.9297, city: 'Pune', district: 'Pune', state: 'Maharashtra', vulnerability: 4, drainage: 'LOW', elevationM: 553, notes: 'River-adjacent, fast runoff catchment.', lastInspectedDaysAgo: 48 },
  { code: 'JAI-DR-080', name: 'Jhotwara Drain Line 2', category: 'DRAIN', lat: 26.9428, lon: 75.7628, city: 'Jaipur', district: 'Jaipur', state: 'Rajasthan', vulnerability: 3, drainage: 'MODERATE', elevationM: 431, notes: 'Desert climate; flash-rain exposure.', lastInspectedDaysAgo: 58 },
  { code: 'KOC-CU-090', name: 'Kaloor Canal Crossing', category: 'CULVERT', lat: 9.9956, lon: 76.2999, city: 'Kochi', district: 'Ernakulam', state: 'Kerala', vulnerability: 4, drainage: 'LOW', elevationM: 1, notes: 'Tidal backflow during high tide + rain.', lastInspectedDaysAgo: 42 },
  { code: 'KOC-PS-091', name: 'Elamakkara Pump Station', category: 'PUMP_STATION', lat: 10.0225, lon: 76.2966, city: 'Kochi', district: 'Ernakulam', state: 'Kerala', vulnerability: 3, drainage: 'HIGH', elevationM: 2, notes: 'Coastal salinity requires corrosion checks.', lastInspectedDaysAgo: 22 },
  { code: 'GAU-DR-100', name: 'Bharalu River Drain Junction', category: 'DRAIN', lat: 26.1563, lon: 91.7695, city: 'Guwahati', district: 'Kamrup Metropolitan', state: 'Assam', vulnerability: 5, drainage: 'LOW', elevationM: 55, notes: 'Hill runoff + river backwater interplay.', lastInspectedDaysAgo: 33 },
  { code: 'PAT-LL-110', name: 'Patna City Ghat Zone', category: 'LOW_LYING_ZONE', lat: 25.6093, lon: 85.1376, city: 'Patna', district: 'Patna', state: 'Bihar', vulnerability: 5, drainage: 'LOW', elevationM: 53, notes: 'Ganga floodplain exposure.', lastInspectedDaysAgo: 80 },
];

const CITY_WX: Record<string, { rain24: number; forecast48: number }> = {
  Mumbai: { rain24: 64, forecast48: 88 },
  Delhi: { rain24: 12, forecast48: 22 },
  Chennai: { rain24: 45, forecast48: 30 },
  Kolkata: { rain24: 28, forecast48: 52 },
  Bengaluru: { rain24: 18, forecast48: 40 },
  Hyderabad: { rain24: 8, forecast48: 15 },
  Ahmedabad: { rain24: 4, forecast48: 9 },
  Pune: { rain24: 35, forecast48: 48 },
  Jaipur: { rain24: 2, forecast48: 6 },
  Kochi: { rain24: 40, forecast48: 55 },
  Guwahati: { rain24: 52, forecast48: 70 },
  Patna: { rain24: 30, forecast48: 44 },
};

function severityFromScore(score: number): string {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'MODERATE';
  return 'LOW';
}

interface Factor { key: string; label: string; labelHi: string; weight: number; detail: string }

function assess(asset: typeof ASSETS[number], inc: number, rep: number) {
  const wx = CITY_WX[asset.city] ?? { rain24: 10, forecast48: 15 };
  const factors: Factor[] = [];
  let score = 8;
  const r1 = Math.min(28, Math.round(wx.rain24 * 0.56));
  factors.push({ key: 'rainfall_24h', label: 'Rainfall (last 24h)', labelHi: 'वर्षा (पिछले 24 घंटे)', weight: r1, detail: `${wx.rain24} mm accumulated in the last 24 hours.` });
  score += r1;
  const r2 = Math.min(24, Math.round(wx.forecast48 * 0.48));
  factors.push({ key: 'forecast_48h', label: 'Forecast (next 48h)', labelHi: 'पूर्वानुमान (अगले 48 घंटे)', weight: r2, detail: `${wx.forecast48} mm of rain expected over the next 48 hours.` });
  score += r2;
  const r3 = Math.round((asset.vulnerability / 5) * 15);
  factors.push({ key: 'vulnerability', label: 'Asset vulnerability', labelHi: 'संपत्ति की संवेदनशीलता', weight: r3, detail: `Vulnerability rating ${asset.vulnerability}/5 for this asset class and location.` });
  score += r3;
  const r4 = asset.drainage === 'LOW' ? 12 : asset.drainage === 'MODERATE' ? 5 : -6;
  factors.push({ key: 'drainage', label: 'Drainage capacity', labelHi: 'जल निकासी क्षमता', weight: r4, detail: asset.drainage === 'LOW' ? 'Low drainage capacity — water accumulates quickly during rain.' : asset.drainage === 'MODERATE' ? 'Moderate drainage capacity — handles light rain, stress under heavy rain.' : 'High drainage capacity — evacuates runoff quickly.' });
  score += r4;
  if (inc > 0) {
    const r5 = Math.min(18, inc * 6);
    factors.push({ key: 'recent_incidents', label: 'Recent incidents nearby', labelHi: 'आसपास हाल की घटनाएँ', weight: r5, detail: `${inc} water-related incident(s) within 2 km in the last 14 days.` });
    score += r5;
  }
  if (rep > 0) {
    const r6 = Math.min(12, rep * 6);
    factors.push({ key: 'citizen_reports', label: 'Citizen reports', labelHi: 'नागरिक रिपोर्ट', weight: r6, detail: `${rep} citizen report(s) near this asset in the last 7 days.` });
    score += r6;
  }
  if (asset.lastInspectedDaysAgo > 90) {
    factors.push({ key: 'inspection_overdue', label: 'Inspection overdue', labelHi: 'निरीक्षण विलंबित', weight: 8, detail: `Last inspection was ${asset.lastInspectedDaysAgo} days ago (over 90-day guideline).` });
    score += 8;
  }
  score = Math.max(2, Math.min(100, Math.round(score)));
  factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight));
  return { score, severity: severityFromScore(score), factors, wx };
}

async function main() {
  console.log('Seeding JALGUARD demo data…');
  await db.auditEvent.deleteMany();
  await db.notification.deleteMany();
  await db.assignedTask.deleteMany();
  await db.incidentUpdate.deleteMany();
  await db.incident.deleteMany();
  await db.recommendation.deleteMany();
  await db.riskAssessment.deleteMany();
  await db.roleRequest.deleteMany();
  await db.session.deleteMany();
  await db.asset.deleteMany();
  await db.dataSource.deleteMany();
  await db.user.deleteMany();

  const pw = hashPassword(DEMO_PASSWORD);
  const users: Record<string, string> = {};
  const accountDefs: [string, string, string, string | null][] = [
    ['admin@jalguard.demo', 'Asha Kulkarni (Demo Admin)', 'super_admin', 'JALGUARD Platform'],
    ['officer@jalguard.demo', 'Ravi Deshmukh (Demo Officer)', 'municipal', 'BMC (Demo)'],
    ['disaster@jalguard.demo', 'Neha Sharma (Demo DM)', 'disaster', 'SDMA (Demo)'],
    ['field@jalguard.demo', 'Imran Sheikh (Demo Field)', 'field', 'BMC Field Crew (Demo)'],
    ['field2@jalguard.demo', 'Lakshmi Iyer (Demo Field)', 'field', 'GCC Field Crew (Demo)'],
    ['analyst@jalguard.demo', 'Arjun Mehta (Demo Analyst)', 'analyst', 'JALGUARD Analytics'],
    ['citizen@jalguard.demo', 'Priya Nair (Demo Citizen)', 'citizen', null],
  ];
  for (const [email, name, role, org] of accountDefs) {
    const u = await db.user.create({
      data: {
        email, name, passwordHash: pw, role, roleStatus: 'APPROVED', emailVerified: true,
        organization: org, language: 'en', onboarded: true, isDemo: true,
        regionState: role === 'citizen' ? 'Maharashtra' : null, regionCity: role === 'citizen' ? 'Mumbai' : null,
      },
    });
    users[role + (email.startsWith('field2') ? '2' : '')] = u.id;
  }

  await db.auditEvent.create({
    data: { actorEmail: 'system@jalguard', action: 'DEMO_SEED', detail: 'Demo dataset seeded (clearly-labelled demonstration records).' },
  });

  // Data sources registry
  await db.dataSource.createMany({
    data: [
      { key: 'weather', name: 'Weather & forecast', provider: 'Open-Meteo', status: 'SIMULATED', notes: 'First call decides LIVE vs deterministic simulated fallback (DEMO).', sortOrder: 1 },
      { key: 'historical_incidents', name: 'Historical incidents', provider: 'JALGUARD registry', status: 'SIMULATED', notes: 'Demo incident records for this preview.', sortOrder: 2 },
      { key: 'asset_registry', name: 'Asset registry', provider: 'JALGUARD registry', status: 'SIMULATED', notes: 'Demo asset registry for 12 Indian cities.', sortOrder: 3 },
      { key: 'river_levels', name: 'River levels', provider: 'Not configured', status: 'UNAVAILABLE', notes: 'No licensed feed configured in this preview.', sortOrder: 4 },
    ],
  });

  // Assets
  const assetIds: Record<string, string> = {};
  for (const a of ASSETS) {
    const created = await db.asset.create({
      data: {
        code: a.code, name: a.name, category: a.category, lat: a.lat, lon: a.lon,
        city: a.city, district: a.district, state: a.state,
        vulnerability: a.vulnerability, drainageCapacity: a.drainage, elevationM: a.elevationM,
        notes: a.notes,
        lastInspectedAt: new Date(Date.now() - a.lastInspectedDaysAgo * 86400000),
        isDemo: true,
      },
    });
    assetIds[a.code] = created.id;
  }

  // Incidents
  const incidentDefs = [
    { title: 'Waterlogging at Hindmata junction', category: 'WATERLOGGING', severity: 'HIGH', status: 'IN_PROGRESS', city: 'Mumbai', asset: 'MUM-DR-001', dOff: 1, desc: 'Knee-deep standing water near the railway underpass after evening showers. Autos refusing to pass.' },
    { title: 'Blocked drain outlet at IIT Gate', category: 'DRAIN_BLOCKAGE', severity: 'MODERATE', status: 'ACKNOWLEDGED', city: 'Delhi', asset: 'DEL-DR-010', dOff: 2, desc: 'Outfall screen covered with plastic waste; water backing up on the service road.' },
    { title: 'Street flooding near Velachery lake', category: 'FLOODING', severity: 'HIGH', status: 'OPEN', city: 'Chennai', asset: 'CHE-LL-022', dOff: 0, desc: 'Lake margin overflowing onto the service lane; shops taking in water.' },
    { title: 'Culvert debris at Silk Board', category: 'DRAIN_BLOCKAGE', severity: 'MODERATE', status: 'RESOLVED', city: 'Bengaluru', asset: 'BLR-CU-040', dOff: 6, desc: 'Construction debris constricting the culvert mouth; cleared by field crew.' },
    { title: 'Pump failure report — Kodungaiyur', category: 'INFRA_DAMAGE', severity: 'HIGH', status: 'IN_PROGRESS', city: 'Chennai', asset: 'CHE-PS-021', dOff: 3, desc: 'Pump 2 tripping on start; standby running. Technician visit requested.' },
    { title: 'Alwal basti lane inundation', category: 'WATERLOGGING', severity: 'CRITICAL', status: 'ACKNOWLEDGED', city: 'Hyderabad', asset: 'HYD-LL-051', dOff: 1, desc: 'Low-lying lanes flooded to waist height; residents moving valuables upstairs.' },
    { title: 'Kaloor canal backflow', category: 'FLOODING', severity: 'HIGH', status: 'OPEN', city: 'Kochi', asset: 'KOC-CU-090', dOff: 2, desc: 'High tide plus rain pushing canal water across the crossing.' },
    { title: 'Tolly Nullah overflow at stretch 3', category: 'FLOODING', severity: 'MODERATE', status: 'OPEN', city: 'Kolkata', asset: 'KOL-DR-030', dOff: 4, desc: 'Nullah overtopping at the bend; silt visible along the parapet.' },
    { title: 'Bharalu junction choking', category: 'DRAIN_BLOCKAGE', severity: 'HIGH', status: 'IN_PROGRESS', city: 'Guwahati', asset: 'GAU-DR-100', dOff: 1, desc: 'Hill runoff carrying debris into the junction; flow visibly reduced.' },
    { title: 'Contamination smell near Jakkur bund', category: 'CONTAMINATION', severity: 'LOW', status: 'OPEN', city: 'Bengaluru', asset: 'BLR-RS-041', dOff: 5, desc: 'Sewage smell along the walking track after the weekend.' },
    { title: 'Karve culvert silt build-up', category: 'DRAIN_BLOCKAGE', severity: 'MODERATE', status: 'ACKNOWLEDGED', city: 'Pune', asset: 'PUN-CU-070', dOff: 7, desc: 'Half the culvert opening is silted; needs desilting before next spell.' },
    { title: 'Patna ghat zone seepage', category: 'WATERLOGGING', severity: 'MODERATE', status: 'RESOLVED', city: 'Patna', asset: 'PAT-LL-110', dOff: 9, desc: 'Seepage in the ghat zone stopped after pump deployment.' },
  ];
  const incidentIds: string[] = [];
  for (const i of incidentDefs) {
    const asset = ASSETS.find((a) => a.code === i.asset)!;
    const created = await db.incident.create({
      data: {
        title: i.title, category: i.category, severity: i.severity, status: i.status,
        description: i.desc, lat: asset.lat + (rnd() - 0.5) * 0.004, lon: asset.lon + (rnd() - 0.5) * 0.004,
        city: i.city, state: asset.state, reporterId: users['citizen'],
        hasPhoto: rnd() > 0.5, assetId: assetIds[i.asset], isDemo: true,
        createdAt: new Date(Date.now() - i.dOff * 86400000 - rnd() * 6 * 3600000),
      },
    });
    incidentIds.push(created.id);
    await db.incidentUpdate.create({ data: { incidentId: created.id, authorName: 'Priya Nair (Demo Citizen)', message: 'Incident reported.', newStatus: 'OPEN', createdAt: created.createdAt } });
    if (i.status !== 'OPEN') {
      await db.incidentUpdate.create({ data: { incidentId: created.id, authorName: 'Ravi Deshmukh (Demo Officer)', message: 'Acknowledged and routed to the ward engineer.', newStatus: 'ACKNOWLEDGED' } });
    }
    if (['IN_PROGRESS', 'RESOLVED'].includes(i.status)) {
      await db.incidentUpdate.create({ data: { incidentId: created.id, authorName: 'Imran Sheikh (Demo Field)', message: 'Crew on site; work in progress.', newStatus: 'IN_PROGRESS' } });
    }
    if (i.status === 'RESOLVED') {
      await db.incidentUpdate.create({ data: { incidentId: created.id, authorName: 'Imran Sheikh (Demo Field)', message: 'Blockage cleared; water receded. Photos attached in work order.', newStatus: 'RESOLVED' } });
    }
  }

  // Assessments + recommendations
  const recentIncidents = await db.incident.findMany({ where: { createdAt: { gte: new Date(Date.now() - 14 * 86400000) } }, select: { lat: true, lon: true, city: true } });
  let recCount = 0;
  for (const a of ASSETS) {
    const inc = recentIncidents.filter((i) => i.city === a.city).length >= 1 ? 2 : 0;
    const rep = inc;
    const out = assess(a, inc, rep);
    const assessment = await db.riskAssessment.create({
      data: {
        assetId: assetIds[a.code], city: a.city, lat: a.lat, lon: a.lon,
        score: out.score, severity: out.severity, factors: JSON.stringify(out.factors),
        confidence: out.wx.rain24 > 30 ? 82 : 58,
        horizon: 'Next 48 hours',
        source: 'JALGUARD rule engine v0.9 + simulated weather (demo)',
        dataFreshness: 'Simulated weather (demo); asset data from registry',
        isDemo: true,
      },
    });
    // Recommendations for moderate+ assets
    if (out.severity !== 'LOW') {
      const urgent = out.severity === 'CRITICAL';
      const recs: [string, string, string, string, string, number, string, string][] = [
        ['DRAIN_INSPECTION', 'Inspect primary drains before forecast peak', `${out.wx.forecast48} mm/48h forecast with ${out.severity.toLowerCase()} assessed risk.`, urgent ? 'URGENT' : 'HIGH', '2-person inspection crew, 1 vehicle', 8000, 'Confirms drain capacity before peak load; prevents avoidable waterlogging.', 'Geo-tagged before/after photos uploaded from field app.'],
        ['DRAIN_CLEANING', a.drainage === 'LOW' ? 'Schedule drain cleaning for low-capacity stretch' : 'Desilt drain stretch', a.drainage === 'LOW' ? 'Low drainage capacity with significant recent rainfall or community reports.' : 'Silt build-up observed; precautionary desilting advised.', 'HIGH', 'Cleaning crew, silt removal equipment', 25000, 'Restores design capacity; reduces standing-water duration.', 'Before/after photo evidence + supervisor sign-off.'],
      ];
      if (urgent) {
        recs.push(['PUMPING_ASSESSMENT', 'Assess temporary pumping capacity', 'Critical assessed risk with limited natural drainage.', 'URGENT', 'Pump inventory check, operator', 12000, 'Standby dewatering capacity during peak event.', 'Pump trial run record.']);
        recs.push(['CITIZEN_ADVISORY', 'Prepare citizen advisory for review', 'Critical risk assessment supports a precautionary public advisory (requires authorized approval).', 'HIGH', 'Communications team', 0, 'Residents can prepare before conditions worsen.', 'Advisory approval record (never auto-published).']);
      }
      for (const [actionType, title, rationale, priority, resources, est, benefit, verif] of recs) {
        await db.recommendation.create({
          data: {
            assessmentId: assessment.id, assetId: assetIds[a.code], title, actionType, rationale,
            priority, resources, estCostInr: est, benefit, verificationMethod: verif, isDemo: true,
          },
        });
        recCount++;
      }
    }
  }

  // Work orders
  const taskDefs: [string, string, string, string, string, string, string, number][] = [
    ['Inspect Hindmata primary drain', 'Walk the full drain stretch, photograph screen condition and water level before the evening peak.', 'DRAIN_INSPECTION', 'URGENT', 'MUM-DR-001', 'field', 'ASSIGNED', 1],
    ['Clean Kaloor canal crossing', 'Remove floating debris and desilt the culvert mouth; confirm free flow at low tide.', 'DRAIN_CLEANING', 'HIGH', 'KOC-CU-090', 'field2', 'IN_PROGRESS', 2],
    ['Verify Kodungaiyur pump 2 repair', 'Supervise technician restart of pump 2, record trial-run readings.', 'PUMPING_ASSESSMENT', 'HIGH', 'CHE-PS-021', 'field2', 'SUBMITTED', 1],
    ['Desilt IIT Gate outfall screen', 'Clear plastic waste from the outfall screen; log removed volume.', 'DRAIN_CLEANING', 'MEDIUM', 'DEL-DR-010', 'field', 'IN_PROGRESS', 3],
    ['Routine inspection — Sudarshan pond', 'Standard monthly checklist: bund condition, inlet clarity, signage.', 'FIELD_INSPECTION', 'LOW', 'DEL-RS-012', 'field', 'ASSIGNED', 6],
    ['Assess temporary pumping at Alwal', 'Survey the lane for pump placement and power access; report back with a placement plan.', 'PUMPING_ASSESSMENT', 'URGENT', 'HYD-LL-051', 'field2', 'ASSIGNED', 1],
  ];
  for (const [title, description, type, priority, assetCode, who, status, dueDays] of taskDefs) {
    const evidence: { note: string; hasPhoto: boolean; at: string; author: string }[] = [];
    if (['IN_PROGRESS', 'SUBMITTED'].includes(status)) {
      evidence.push({ note: 'Site reached, initial assessment done. Photos attached.', hasPhoto: true, at: new Date(Date.now() - 3600_000 * 5).toISOString(), author: who === 'field' ? 'Imran Sheikh (Demo Field)' : 'Lakshmi Iyer (Demo Field)' });
    }
    if (status === 'SUBMITTED') {
      evidence.push({ note: 'Pump 2 restarted successfully; load test 45 min stable. Requesting verification.', hasPhoto: true, at: new Date(Date.now() - 3600_000 * 2).toISOString(), author: 'Lakshmi Iyer (Demo Field)' });
    }
    await db.assignedTask.create({
      data: {
        title, description, type, priority, status,
        assetId: assetIds[assetCode],
        assignedToId: who === 'field' ? users['field'] : users['field2'],
        createdById: users['municipal'],
        city: ASSETS.find((a) => a.code === assetCode)!.city,
        dueAt: new Date(Date.now() + dueDays * 86400000),
        evidence: JSON.stringify(evidence),
        completionNote: status === 'SUBMITTED' ? 'Repair verified on site; pump holding pressure.' : null,
        isDemo: true,
      },
    });
  }

  // Notifications
  await db.notification.createMany({
    data: [
      { userId: users['municipal'], title: '2 tasks awaiting verification', body: 'Kodungaiyur pump verification has been submitted by the field team.', type: 'TASK' },
      { userId: users['municipal'], title: 'New critical assessment — Alwal', body: 'Alwal Low-Lying Basti assessed CRITICAL (demo). Review recommendations.', type: 'RISK' },
      { userId: users['field'], title: 'New task: Inspect Hindmata primary drain', body: 'Priority URGENT. Due tomorrow.', type: 'TASK' },
      { userId: users['citizen'], title: 'Your report is in progress', body: 'Waterlogging at Hindmata junction: crew on site.', type: 'STATUS' },
      { userId: users['super_admin'], title: 'Welcome to JALGUARD', body: 'Demo dataset loaded. All records are labelled DEMO.', type: 'INFO' },
    ],
  });

  console.log('Seed complete:');
  console.log(`  users: ${accountDefs.length} (demo password: ${DEMO_PASSWORD})`);
  console.log(`  assets: ${ASSETS.length}, incidents: ${incidentDefs.length}, recommendations: ${recCount}, tasks: ${taskDefs.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
