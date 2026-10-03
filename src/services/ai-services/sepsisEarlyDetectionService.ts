import { createApi } from '@reduxjs/toolkit/query/react';
import { BaseQuery } from '../../newApi';

export type SepsisRequest = {
  patientId: number;
  hourlyData: string[];
};

export type SepsisAnalysisObject = {
  value?: string | null;
  unit?: string | null;
  status?: string | null;
  trend?: string | null;
};

export type SepsisPatientSnapshot = {
  name?: string | null;
  age?: number | null;
  gender?: string | null;
  weight?: number | null;
  admission_reason?: string | null;
  comorbidities?: string[] | null;
  assessment_timestamp?: string | null;
  patient_id?: string | null;
  currentHour?: number | null;
};

export type SepsisStatusSummary = {
  overall?: string | null;
  sirs_criteria_met?: string | null;
  qsofa_score?: string | null;
  sofa_score?: string | null;
  sepsis_3_criteria_met?: string | null;
};

export type SepsisCurrentVitals = {
  HR?: SepsisAnalysisObject | null;
  Resp?: SepsisAnalysisObject | null;
  SBP?: SepsisAnalysisObject | null;
  DBP?: SepsisAnalysisObject | null;
  MAP?: SepsisAnalysisObject | null;
  O2Sat?: SepsisAnalysisObject | null;
  Temp?: SepsisAnalysisObject | null;
  EtCO2?: SepsisAnalysisObject | null;
};

export type SepsisCurrentLabs = {
  Lactate?: SepsisAnalysisObject | null;
  WBC?: SepsisAnalysisObject | null;
  Platelets?: SepsisAnalysisObject | null;
  Creatinine?: SepsisAnalysisObject | null;
  Bilirubin_total?: SepsisAnalysisObject | null;
  HCO3?: SepsisAnalysisObject | null;
  BUN?: SepsisAnalysisObject | null;
  Hct?: SepsisAnalysisObject | null;
};

export type SepsisTimelineAnalysis = {
  time?: string | null;
  event?: string | null;
  affected_parameters?: string[] | null;
  severity?: string | null;
  clinical_significance?: string | null;
};

export type SepsisOrganDysfunction = {
  cardiovascular?: SepsisAnalysisObject | null;
  respiratory?: SepsisAnalysisObject | null;
  renal?: SepsisAnalysisObject | null;
  hepatic?: SepsisAnalysisObject | null;
  hematologic?: SepsisAnalysisObject | null;
  metabolic?: SepsisAnalysisObject | null;
};

export type SepsisWatchListItem = {
  parameter?: string | null;
  current_value?: string | null;
  unit?: string | null;
  normal_range?: string | null;
  status?: string | null;
  trend?: string | null;
  rate_of_change?: string | null;
  clinical_concern?: string | null;
  recommended_action?: string | null;
};

export type SepsisRiskFactors = {
  infection_source_suspected?: string | null;
  immunocompromised?: boolean | null;
  age_risk?: boolean | null;
  comorbidity_burden?: string | null;
  contributing_factors?: string[] | null;
};

export type SepsisKeyDecisionPoint = {
  hour?: string | null;
  trigger?: string | null;
  recommended_response?: string | null;
};

export type SepsisForecast24h = {
  expected_trajectory?: string | null;
  narrative?: string | null;
  key_decision_points?: SepsisKeyDecisionPoint[] | null;
  intervention_urgency?: string | null;
};

export type SepsisProbability24h = {
  probability?: number | null;
  risk_level?: string | null;
  confidence?: string | null;
  primary_drivers?: string[] | null;
  mitigating_factors?: string[] | null;
};

export type SepsisRecommendedAction = {
  priority?: string | null;
  action?: string | null;
  rationale?: string | null;
};

export type SepsisFlags = Record<string, unknown>;

export type SepsisAnalysis = {
  patient_snapshot?: SepsisPatientSnapshot | null;
  status_summary?: SepsisStatusSummary | null;
  current_vitals?: SepsisCurrentVitals | null;
  current_labs?: SepsisCurrentLabs | null;
  timeline_analysis?: SepsisTimelineAnalysis[] | null;
  organ_dysfunction?: SepsisOrganDysfunction | null;
  watchList?: SepsisWatchListItem[] | null;
  risk_factors?: SepsisRiskFactors | null;
  forecast_24h?: SepsisForecast24h | null;
  sepsis_probability_24h?: SepsisProbability24h | null;
  recommended_actions?: SepsisRecommendedAction[] | null;
  flags?: SepsisFlags | null;
};

export type SepsisResponse = {
  patient_id?: string | null;
  analysis?: SepsisAnalysis | null;
  output_file?: string | null;
  source?: string | null;
};

const formatAnalysisObject = (label: string, item?: SepsisAnalysisObject | null): string => {
  if (!item) return '';

  const parts = [
    item.value != null && item.value !== '' ? `${item.value}${item.unit ? ` ${item.unit}` : ''}` : null,
    item.status ? `Status: ${item.status}` : null,
    item.trend ? `Trend: ${item.trend}` : null
  ].filter(Boolean);

  if (!parts.length) return '';
  return `${label}: ${parts.join(' | ')}`;
};

const formatObjectGroup = (
  title: string,
  entries: Array<[string, SepsisAnalysisObject | null | undefined]>
): string => {
  const lines = entries.map(([label, item]) => formatAnalysisObject(label, item)).filter(Boolean);
  if (!lines.length) return '';
  return `${title}\n${lines.map(line => `- ${line}`).join('\n')}`;
};

export const formatSepsisAnalysisAsText = (analysis?: SepsisAnalysis | null): string => {
  if (!analysis) return 'No analysis available';

  const sections: string[] = [];

  const snapshot = analysis.patient_snapshot;
  if (snapshot) {
    const snapshotLines = [
      snapshot.name ? `Patient: ${snapshot.name}` : null,
      snapshot.age != null ? `Age: ${snapshot.age}` : null,
      snapshot.gender ? `Gender: ${snapshot.gender}` : null,
      snapshot.weight != null ? `Weight: ${snapshot.weight}` : null,
      snapshot.admission_reason ? `Admission Reason: ${snapshot.admission_reason}` : null,
      snapshot.comorbidities?.length
        ? `Comorbidities: ${snapshot.comorbidities.join(', ')}`
        : null,
      snapshot.assessment_timestamp ? `Assessment Time: ${snapshot.assessment_timestamp}` : null,
      snapshot.currentHour != null ? `Current Hour: ${snapshot.currentHour}` : null
    ].filter(Boolean);

    if (snapshotLines.length) {
      sections.push(`Patient Snapshot\n${snapshotLines.join('\n')}`);
    }
  }

  const status = analysis.status_summary;
  if (status) {
    const statusLines = [
      status.overall ? `Overall: ${status.overall}` : null,
      status.sirs_criteria_met ? `SIRS Criteria Met: ${status.sirs_criteria_met}` : null,
      status.qsofa_score ? `qSOFA Score: ${status.qsofa_score}` : null,
      status.sofa_score ? `SOFA Score: ${status.sofa_score}` : null,
      status.sepsis_3_criteria_met ? `Sepsis-3 Criteria Met: ${status.sepsis_3_criteria_met}` : null
    ].filter(Boolean);

    if (statusLines.length) {
      sections.push(`Status Summary\n${statusLines.join('\n')}`);
    }
  }

  const vitalsSection = formatObjectGroup('Current Vitals', [
    ['HR', analysis.current_vitals?.HR],
    ['Resp', analysis.current_vitals?.Resp],
    ['SBP', analysis.current_vitals?.SBP],
    ['DBP', analysis.current_vitals?.DBP],
    ['MAP', analysis.current_vitals?.MAP],
    ['O2Sat', analysis.current_vitals?.O2Sat],
    ['Temp', analysis.current_vitals?.Temp],
    ['EtCO2', analysis.current_vitals?.EtCO2]
  ]);
  if (vitalsSection) sections.push(vitalsSection);

  const labsSection = formatObjectGroup('Current Labs', [
    ['Lactate', analysis.current_labs?.Lactate],
    ['WBC', analysis.current_labs?.WBC],
    ['Platelets', analysis.current_labs?.Platelets],
    ['Creatinine', analysis.current_labs?.Creatinine],
    ['Bilirubin Total', analysis.current_labs?.Bilirubin_total],
    ['HCO3', analysis.current_labs?.HCO3],
    ['BUN', analysis.current_labs?.BUN],
    ['Hct', analysis.current_labs?.Hct]
  ]);
  if (labsSection) sections.push(labsSection);

  if (analysis.timeline_analysis?.length) {
    const timelineLines = analysis.timeline_analysis.map(item => {
      const parts = [
        item.time ? `[${item.time}]` : null,
        item.event,
        item.severity ? `Severity: ${item.severity}` : null,
        item.affected_parameters?.length
          ? `Affected: ${item.affected_parameters.join(', ')}`
          : null,
        item.clinical_significance ? `Significance: ${item.clinical_significance}` : null
      ].filter(Boolean);

      return `- ${parts.join(' | ')}`;
    });

    sections.push(`Timeline Analysis\n${timelineLines.join('\n')}`);
  }

  const organSection = formatObjectGroup('Organ Dysfunction', [
    ['Cardiovascular', analysis.organ_dysfunction?.cardiovascular],
    ['Respiratory', analysis.organ_dysfunction?.respiratory],
    ['Renal', analysis.organ_dysfunction?.renal],
    ['Hepatic', analysis.organ_dysfunction?.hepatic],
    ['Hematologic', analysis.organ_dysfunction?.hematologic],
    ['Metabolic', analysis.organ_dysfunction?.metabolic]
  ]);
  if (organSection) sections.push(organSection);

  if (analysis.watchList?.length) {
    const watchLines = analysis.watchList.map(item => {
      const parts = [
        item.parameter,
        item.current_value != null ? `Value: ${item.current_value}${item.unit ? ` ${item.unit}` : ''}` : null,
        item.normal_range ? `Normal: ${item.normal_range}` : null,
        item.status ? `Status: ${item.status}` : null,
        item.trend ? `Trend: ${item.trend}` : null,
        item.rate_of_change ? `Rate of Change: ${item.rate_of_change}` : null,
        item.clinical_concern ? `Concern: ${item.clinical_concern}` : null,
        item.recommended_action ? `Action: ${item.recommended_action}` : null
      ].filter(Boolean);

      return `- ${parts.join(' | ')}`;
    });

    sections.push(`Watch List\n${watchLines.join('\n')}`);
  }

  const risk = analysis.risk_factors;
  if (risk) {
    const riskLines = [
      risk.infection_source_suspected
        ? `Suspected Infection Source: ${risk.infection_source_suspected}`
        : null,
      risk.immunocompromised != null ? `Immunocompromised: ${risk.immunocompromised ? 'Yes' : 'No'}` : null,
      risk.age_risk != null ? `Age Risk: ${risk.age_risk ? 'Yes' : 'No'}` : null,
      risk.comorbidity_burden ? `Comorbidity Burden: ${risk.comorbidity_burden}` : null,
      risk.contributing_factors?.length
        ? `Contributing Factors: ${risk.contributing_factors.join(', ')}`
        : null
    ].filter(Boolean);

    if (riskLines.length) {
      sections.push(`Risk Factors\n${riskLines.join('\n')}`);
    }
  }

  const probability = analysis.sepsis_probability_24h;
  if (probability) {
    const probabilityLines = [
      probability.probability != null ? `Probability: ${probability.probability}%` : null,
      probability.risk_level ? `Risk Level: ${probability.risk_level}` : null,
      probability.confidence ? `Confidence: ${probability.confidence}` : null,
      probability.primary_drivers?.length
        ? `Primary Drivers: ${probability.primary_drivers.join(', ')}`
        : null,
      probability.mitigating_factors?.length
        ? `Mitigating Factors: ${probability.mitigating_factors.join(', ')}`
        : null
    ].filter(Boolean);

    if (probabilityLines.length) {
      sections.push(`Sepsis Probability (24h)\n${probabilityLines.join('\n')}`);
    }
  }

  const forecast = analysis.forecast_24h;
  if (forecast) {
    const forecastLines = [
      forecast.expected_trajectory ? `Expected Trajectory: ${forecast.expected_trajectory}` : null,
      forecast.narrative ? `Narrative: ${forecast.narrative}` : null,
      forecast.intervention_urgency ? `Intervention Urgency: ${forecast.intervention_urgency}` : null
    ].filter(Boolean);

    if (forecast.key_decision_points?.length) {
      forecastLines.push(
        'Key Decision Points:',
        ...forecast.key_decision_points.map(point => {
          const parts = [
            point.hour ? `Hour ${point.hour}` : null,
            point.trigger ? `Trigger: ${point.trigger}` : null,
            point.recommended_response ? `Response: ${point.recommended_response}` : null
          ].filter(Boolean);

          return `- ${parts.join(' | ')}`;
        })
      );
    }

    if (forecastLines.length) {
      sections.push(`24h Forecast\n${forecastLines.join('\n')}`);
    }
  }

  if (analysis.recommended_actions?.length) {
    const actionLines = analysis.recommended_actions.map(action => {
      const parts = [
        action.priority ? `[${action.priority}]` : null,
        action.action,
        action.rationale ? `Rationale: ${action.rationale}` : null
      ].filter(Boolean);

      return `- ${parts.join(' | ')}`;
    });

    sections.push(`Recommended Actions\n${actionLines.join('\n')}`);
  }

  return sections.length ? sections.join('\n\n') : 'No analysis available';
};

export const sepsisEarlyDetectionService = createApi({
  reducerPath: 'sepsisEarlyDetectionApi',
  baseQuery: BaseQuery,
  tagTypes: ['SepsisEarlyDetection'],
  endpoints: builder => ({
    analyseSepsis: builder.mutation<SepsisResponse, SepsisRequest>({
      query: body => ({
        url: '/api/analytics/sepsis-early-detection/analyse',
        method: 'POST',
        body
      })
    })
  })
});

export const { useAnalyseSepsisMutation } = sepsisEarlyDetectionService;
