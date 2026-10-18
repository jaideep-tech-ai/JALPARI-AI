import type { RiskFactor, Severity } from '@/lib/types';

// ============ JALGUARD transparent rule-based risk engine ============
// NOTE: This is an explainable rule engine combining live weather signals with
// asset attributes and community reports. It is NOT a scientifically validated
// predictive model. All outputs are labelled with their source and confidence.

export interface RiskInput {
  rainfall24h: number; // mm observed/last 24h (0 if unknown)
  forecast48h: number; // mm expected next 48h (0 if unknown)
  hasLiveWeather: boolean;
  vulnerability: number; // 1-5 asset vulnerability
  drainage: 'LOW' | 'MODERATE' | 'HIGH'; // drainage capacity
  recentIncidents: number; // incidents near asset in last 14 days
  recentReports: number; // citizen reports near asset in last 7 days
  daysSinceInspection: number | null;
}

export interface RiskOutput {
  score: number;
  severity: Severity;
  factors: RiskFactor[];
  confidence: number;
  horizon: string;
  source: string;
  dataFreshness: string;
  suggestedAction: string;
}

export function severityFromScore(score: number): Severity {
  if (score >= 75) return 'CRITICAL';
  if (score >= 55) return 'HIGH';
  if (score >= 35) return 'MODERATE';
  return 'LOW';
}

export function assessRisk(input: RiskInput): RiskOutput {
  const factors: RiskFactor[] = [];
  let score = 8; // baseline ambient risk

  // 1. Rainfall accumulation (observed, last 24h) — max 28
  if (input.rainfall24h > 0) {
    const pts = Math.min(28, Math.round(input.rainfall24h * 0.56));
    factors.push({
      key: 'rainfall_24h',
      label: 'Rainfall (last 24h)',
      labelHi: 'वर्षा (पिछले 24 घंटे)',
      weight: pts,
      detail: `${input.rainfall24h.toFixed(1)} mm accumulated in the last 24 hours.`,
    });
    score += pts;
  }

  // 2. Forecast rainfall (next 48h) — max 24
  if (input.forecast48h > 0) {
    const pts = Math.min(24, Math.round(input.forecast48h * 0.48));
    factors.push({
      key: 'forecast_48h',
      label: 'Forecast (next 48h)',
      labelHi: 'पूर्वानुमान (अगले 48 घंटे)',
      weight: pts,
      detail: `${input.forecast48h.toFixed(1)} mm of rain expected over the next 48 hours.`,
    });
    score += pts;
  }

  // 3. Asset vulnerability — max 15
  {
    const pts = Math.round((input.vulnerability / 5) * 15);
    factors.push({
      key: 'vulnerability',
      label: 'Asset vulnerability',
      labelHi: 'संपत्ति की संवेदनशीलता',
      weight: pts,
      detail: `Vulnerability rating ${input.vulnerability}/5 for this asset class and location.`,
    });
    score += pts;
  }

  // 4. Drainage capacity — max 12 (LOW adds, HIGH subtracts)
  {
    const pts = input.drainage === 'LOW' ? 12 : input.drainage === 'MODERATE' ? 5 : -6;
    factors.push({
      key: 'drainage',
      label: 'Drainage capacity',
      labelHi: 'जल निकासी क्षमता',
      weight: pts,
      detail:
        input.drainage === 'LOW'
          ? 'Low drainage capacity — water accumulates quickly during rain.'
          : input.drainage === 'MODERATE'
            ? 'Moderate drainage capacity — handles light rain, stress under heavy rain.'
            : 'High drainage capacity — evacuates runoff quickly.',
    });
    score += pts;
  }

  // 5. Recent incidents near asset — max 18
  if (input.recentIncidents > 0) {
    const pts = Math.min(18, input.recentIncidents * 6);
    factors.push({
      key: 'recent_incidents',
      label: 'Recent incidents nearby',
      labelHi: 'आसपास हाल की घटनाएँ',
      weight: pts,
      detail: `${input.recentIncidents} water-related incident(s) within 2 km in the last 14 days.`,
    });
    score += pts;
  }

  // 6. Recent citizen reports — max 12
  if (input.recentReports > 0) {
    const pts = Math.min(12, input.recentReports * 6);
    factors.push({
      key: 'citizen_reports',
      label: 'Citizen reports',
      labelHi: 'नागरिक रिपोर्ट',
      weight: pts,
      detail: `${input.recentReports} citizen report(s) near this asset in the last 7 days.`,
    });
    score += pts;
  }

  // 7. Inspection overdue — max 8
  if (input.daysSinceInspection !== null && input.daysSinceInspection > 90) {
    const pts = 8;
    factors.push({
      key: 'inspection_overdue',
      label: 'Inspection overdue',
      labelHi: 'निरीक्षण विलंबित',
      weight: pts,
      detail: `Last inspection was ${input.daysSinceInspection} days ago (over 90-day guideline).`,
    });
    score += pts;
  }

  score = Math.max(2, Math.min(100, Math.round(score)));
  const severity = severityFromScore(score);

  // Confidence: live weather raises confidence; missing signals lower it
  let confidence = input.hasLiveWeather ? 78 : 52;
  if (input.recentIncidents > 0) confidence += 8;
  if (input.rainfall24h === 0 && input.forecast48h === 0) confidence -= 15;
  confidence = Math.max(25, Math.min(92, confidence));

  const suggestedAction = suggestAction(severity, input);
  const freshness = input.hasLiveWeather
    ? 'Live weather <= 30 min old; asset data from registry'
    : 'Simulated weather (demo); asset data from registry';

  return {
    score,
    severity,
    factors: factors.sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight)),
    confidence,
    horizon: 'Next 48 hours',
    source: 'JALGUARD rule engine v0.9 (transparent rules)',
    dataFreshness: freshness,
    suggestedAction,
  };
}

export function suggestAction(_sev: Severity, input: RiskInput): string {
  if (input.forecast48h >= 60) {
    return 'Pre-position response: verify pump availability and inspect primary drains before the forecast peak.';
  }
  if (input.recentReports >= 2 && input.drainage === 'LOW') {
    return 'Field inspection with drain-cleaning assessment; consider temporary pumping options.';
  }
  if (input.recentIncidents >= 2) {
    return 'Inspect the affected stretch, clear blockages and update the incident register.';
  }
  if (input.daysSinceInspection !== null && input.daysSinceInspection > 90) {
    return 'Schedule a preventive inspection — this asset is past its 90-day inspection guideline.';
  }
  return 'Continue routine monitoring; re-check after the next rainfall update.';
}

// ============ Intervention recommendation mapping ============

export interface RecTemplate {
  actionType: string;
  title: string;
  titleHi?: string;
  rationale: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  resources: string;
  estCostInr: number;
  benefit: string;
  verificationMethod: string;
}

export function recommendInterventions(
  output: RiskOutput,
  input: RiskInput
): RecTemplate[] {
  const recs: RecTemplate[] = [];
  const top = output.factors.filter((f) => f.weight > 0).slice(0, 2).map((f) => f.label);

  if (input.forecast48h >= 40 || output.severity === 'CRITICAL') {
    recs.push({
      actionType: 'DRAIN_INSPECTION',
      title: 'Inspect primary drains before forecast peak',
      rationale: `High forecast rainfall (${input.forecast48h.toFixed(0)} mm/48h) combined with ${top.join(' & ')}.`,
      priority: 'URGENT',
      resources: '2-person inspection crew, 1 vehicle',
      estCostInr: 8000,
      benefit: 'Confirms drain capacity before peak load; prevents avoidable waterlogging.',
      verificationMethod: 'Geo-tagged before/after photos uploaded from field app.',
    });
  }
  if (input.drainage === 'LOW' && (input.rainfall24h > 20 || input.recentReports > 0)) {
    recs.push({
      actionType: 'DRAIN_CLEANING',
      title: 'Schedule drain cleaning for low-capacity stretch',
      rationale: 'Low drainage capacity with significant recent rainfall or community reports.',
      priority: 'HIGH',
      resources: 'Cleaning crew, silt removal equipment',
      estCostInr: 25000,
      benefit: 'Restores design capacity; reduces standing-water duration.',
      verificationMethod: 'Before/after photo evidence + supervisor sign-off.',
    });
  }
  if (input.recentReports >= 2) {
    recs.push({
      actionType: 'FIELD_INSPECTION',
      title: 'Field inspection of reported location',
      rationale: 'Multiple citizen reports indicate an active or recurring problem.',
      priority: 'HIGH',
      resources: '1 field officer',
      estCostInr: 3000,
      benefit: 'Validates community reports and identifies root cause.',
      verificationMethod: 'Inspection report with geo-tagged photos.',
    });
  }
  if (input.recentIncidents >= 2 || input.vulnerability >= 4) {
    recs.push({
      actionType: 'WATER_LEVEL_MONITORING',
      title: 'Increase water-level monitoring frequency',
      rationale: 'Repeated incidents or high asset vulnerability warrant closer observation.',
      priority: 'MEDIUM',
      resources: 'Sensor check / manual gauge readings every 6h',
      estCostInr: 1500,
      benefit: 'Earlier warning threshold breaches.',
      verificationMethod: 'Timestamped readings logged in platform.',
    });
  }
  if (input.vulnerability >= 4 && input.daysSinceInspection !== null && input.daysSinceInspection > 90) {
    recs.push({
      actionType: 'PREVENTIVE_MAINTENANCE',
      title: 'Preventive maintenance for high-vulnerability asset',
      rationale: 'Vulnerability 4+/5 with overdue inspection window.',
      priority: 'MEDIUM',
      resources: 'Maintenance team, standard kit',
      estCostInr: 18000,
      benefit: 'Reduces failure probability during peak rainfall.',
      verificationMethod: 'Maintenance checklist + photo evidence.',
    });
  }
  if (output.severity === 'CRITICAL') {
    recs.push({
      actionType: 'PUMPING_ASSESSMENT',
      title: 'Assess temporary pumping capacity',
      rationale: 'Critical assessed risk with limited natural drainage.',
      priority: 'URGENT',
      resources: 'Pump inventory check, operator',
      estCostInr: 12000,
      benefit: ' standby dewatering capacity during peak event.',
      verificationMethod: 'Pump trial run record.',
    });
    recs.push({
      actionType: 'CITIZEN_ADVISORY',
      title: 'Prepare citizen advisory for review',
      rationale: 'Critical risk assessment supports a precautionary public advisory (requires authorized approval).',
      priority: 'HIGH',
      resources: 'Communications team',
      estCostInr: 0,
      benefit: 'Residents can prepare before conditions worsen.',
      verificationMethod: 'Advisory approval record (never auto-published).',
    });
  }
  if (recs.length === 0) {
    recs.push({
      actionType: 'FIELD_INSPECTION',
      title: 'Routine inspection',
      rationale: 'Standard monitoring cycle — no elevated risk signals detected.',
      priority: 'LOW',
      resources: '1 field officer',
      estCostInr: 2000,
      benefit: 'Keeps asset registry current.',
      verificationMethod: 'Inspection checklist.',
    });
  }
  return recs.slice(0, 3);
}
