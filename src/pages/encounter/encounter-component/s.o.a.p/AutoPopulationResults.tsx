import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { AutoPopulationResponse } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  result?: AutoPopulationResponse;
  isLoading?: boolean;
  isError?: boolean;
};

const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

const getWarningColor = (level: string) => {
  switch ((level || '').toLowerCase()) {
    case 'error':
      return '#B91C1C';
    case 'warning':
      return '#A16207';
    default:
      return '#1D4ED8';
  }
};

const getSeverityColor = (severity: string) => {
  switch ((severity || '').toLowerCase()) {
    case 'high':
      return '#B91C1C';
    case 'medium':
      return '#C2410C';
    case 'low':
      return '#1D4ED8';
    default:
      return '#374151';
  }
};

const formatContradictionItem = (item: any): string => {
  if (item === null || item === undefined) return '-';
  if (typeof item !== 'object') return toStr(item);

  return Object.entries(item)
    .filter(([, v]) => v !== null && v !== undefined && v !== '')
    .map(([k, v]) => `${k}: ${toStr(v)}`)
    .join(', ') || '-';
};

const isMedicationLike = (item: any) =>
  item !== null && typeof item === 'object' && ('name' in item || 'dosage' in item || 'frequency' in item);

const MedicationValueTable = ({ items }: { items: any[] }) => (
  <table className="ai-medication-table">
    <thead>
      <tr>
        <th>Name</th>
        <th>Dosage</th>
        <th>Frequency</th>
        <th>Route</th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, i) => (
        <tr key={i}>
          <td>{toStr(item?.name) || '-'}</td>
          <td>{toStr(item?.dosage) || '-'}</td>
          <td>{formatEnumString(toStr(item?.frequency) || '-')}</td>
          <td>{toStr(item?.route) || '-'}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

const ContradictionValue = ({ value }: { value: any }) => {
  if (value === null || value === undefined) {
    return <span className="ai-item-text">-</span>;
  }

  const items = Array.isArray(value) ? value : [value];

  if (items.length && items.every(isMedicationLike)) {
    return <MedicationValueTable items={items} />;
  }

  if (Array.isArray(value)) {
    if (!value.length) return <span className="ai-item-text">-</span>;
    return (
      <div className="ai-chips">
        {value.map((item, i) => (
          <span className="ai-chip" key={i}>
            {formatContradictionItem(item)}
          </span>
        ))}
      </div>
    );
  }

  if (typeof value === 'object') {
    return <span className="ai-item-text">{formatContradictionItem(value)}</span>;
  }

  return <span className="ai-item-text">{toStr(value)}</span>;
};

const AutoPopulationResults: React.FC<Props> = ({ open, setOpen, result, isLoading, isError }) => {
  const mode = useSelector((state: any) => state.ui.mode);

  const fields = result?.structured_fields;

  const vitalsEntries = useMemo(() => {
    if (!fields?.vitals) return [];
    return Object.entries(fields.vitals).filter(([, v]) => v !== null && v !== undefined && v !== '');
  }, [fields?.vitals]);

  const reviewOfSystemsEntries = useMemo(() => {
    if (!fields?.review_of_systems) return [];
    return Object.entries(fields.review_of_systems).filter(
      ([, v]) => v !== null && v !== undefined && v !== ''
    );
  }, [fields?.review_of_systems]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FontAwesomeIcon icon={faRobot} />
          <span>
            <Translate>Auto-Population Results</Translate>
          </span>
        </div>
      }
      size="60vw"
      bodyheight="65vh"
      position="center"
      hideActionBtn
      cancelButtonLabel="Close"
      content={
        <div className={`ai-populate-results ${mode === 'dark' ? 'dark' : 'light'}`}>
          {isLoading && (
            <div className="ai-loading-wrap">
              <span className="ai-spinner" />
              <span className="ai-loading-text">Processing...</span>
            </div>
          )}

          {isError && !isLoading && (
            <div className="ai-error">Auto-population request failed</div>
          )}

          {!isLoading && !isError && result && (
            <div className="ai-result">
              <div className="ai-section">
                <div className="ai-section-title">Structured Fields</div>

                <div className="ai-field-list">
                  {fields?.chief_complaint && (
                    <div className="ai-field">
                      <span className="ai-field-label">Chief Complaint</span>
                      <span className="ai-field-value">{fields.chief_complaint}</span>
                    </div>
                  )}
                  {fields?.history_of_present_illness && (
                    <div className="ai-field">
                      <span className="ai-field-label">History of Present Illness</span>
                      <span className="ai-field-value">{fields.history_of_present_illness}</span>
                    </div>
                  )}
                  {fields?.assessment && (
                    <div className="ai-field">
                      <span className="ai-field-label">Assessment</span>
                      <span className="ai-field-value">{fields.assessment}</span>
                    </div>
                  )}
                  {fields?.plan && (
                    <div className="ai-field">
                      <span className="ai-field-label">Plan</span>
                      <span className="ai-field-value">{fields.plan}</span>
                    </div>
                  )}
                  {fields?.past_medical_history && (
                    <div className="ai-field">
                      <span className="ai-field-label">Past Medical History</span>
                      <span className="ai-field-value">{fields.past_medical_history}</span>
                    </div>
                  )}
                  {fields?.family_history && (
                    <div className="ai-field">
                      <span className="ai-field-label">Family History</span>
                      <span className="ai-field-value">{fields.family_history}</span>
                    </div>
                  )}
                  {fields?.social_history && (
                    <div className="ai-field">
                      <span className="ai-field-label">Social History</span>
                      <span className="ai-field-value">{fields.social_history}</span>
                    </div>
                  )}
                </div>

                {(!!vitalsEntries.length ||
                  !!fields?.allergies?.length ||
                  !!fields?.diagnosis?.length ||
                  !!fields?.procedures?.length ||
                  !!reviewOfSystemsEntries.length) && (
                  <div className="ai-field-list">
                    {!!vitalsEntries.length && (
                      <div className="ai-field">
                        <span className="ai-field-label">Vitals</span>
                        <div className="ai-chips">
                          {vitalsEntries.map(([k, v]) => (
                            <span className="ai-chip" key={k}>
                              {k}: {toStr(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!fields?.allergies?.length && (
                      <div className="ai-field">
                        <span className="ai-field-label">Allergies</span>
                        <div className="ai-chips">
                          {fields.allergies.map((a, i) => (
                            <span className="ai-chip" key={`${a}-${i}`}>
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!fields?.diagnosis?.length && (
                      <div className="ai-field">
                        <span className="ai-field-label">Diagnosis</span>
                        <div className="ai-chips">
                          {fields.diagnosis.map((d, i) => (
                            <span className="ai-chip" key={`${d}-${i}`}>
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!fields?.procedures?.length && (
                      <div className="ai-field">
                        <span className="ai-field-label">Procedures</span>
                        <div className="ai-chips">
                          {fields.procedures.map((p, i) => (
                            <span className="ai-chip" key={`${p}-${i}`}>
                              {p}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {!!reviewOfSystemsEntries.length && (
                      <div className="ai-field">
                        <span className="ai-field-label">Review of Systems</span>
                        <div className="ai-chips">
                          {reviewOfSystemsEntries.map(([k, v]) => (
                            <span className="ai-chip" key={k}>
                              {k}: {toStr(v)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!!fields?.medications?.length && (
                  <div className="ai-field">
                    <span className="ai-field-label">Medications</span>
                    <div className="ai-medication-card">
                      <table className="ai-medication-table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Dosage</th>
                            <th>Frequency</th>
                          </tr>
                        </thead>
                        <tbody>
                          {fields.medications.map((m, i) => (
                            <tr key={i}>
                              <td>{toStr(m?.name)}</td>
                              <td>{toStr(m?.dosage)}</td>
                              <td>{formatEnumString(toStr(m?.frequency))}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {!!result.uncertainty_flags?.length && (
                <div className="ai-section">
                  <div className="ai-section-title">Uncertainty Flags</div>
                  <div className="ai-list">
                    {result.uncertainty_flags.map((u, i) => (
                      <div className="ai-item" key={i}>
                        <div className="ai-item-top">
                          <div className="ai-item-title">{u.field_name}</div>
                          {u.confidence && (
                            <MyBadgeStatus color={getSeverityColor(u.confidence)} contant={u.confidence} />
                          )}
                        </div>
                        <div className="ai-item-row">
                          <span className="ai-item-text">{u.reason}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!result.contradictions?.length && (
                <div className="ai-section">
                  <div className="ai-section-title">Contradictions</div>
                  <div className="ai-list">
                    {result.contradictions.map((c, i) => (
                      <div className="ai-item" key={i}>
                        <div className="ai-item-top">
                          <div className="ai-item-title">{c.field_name}</div>
                          <MyBadgeStatus color={getSeverityColor(c.severity)} contant={c.severity} />
                        </div>
                        <div className="ai-item-row">
                          <span className="ai-item-label">From Text:</span>
                          <ContradictionValue value={c.user_text_value} />
                        </div>
                        <div className="ai-item-row">
                          <span className="ai-item-label">Patient Record:</span>
                          <ContradictionValue value={c.patient_record_value} />
                        </div>
                        <div className="ai-item-row">
                          <span className="ai-item-label">Recommendation:</span>
                          <span className="ai-item-text">{c.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!result.warnings?.length && (
                <div className="ai-section">
                  <div className="ai-section-title">Warnings</div>
                  <div className="ai-list">
                    {result.warnings.map((w, i) => (
                      <div className="ai-item" key={i}>
                        <div className="ai-item-top">
                          <div className="ai-item-title">{w.field_name || 'General'}</div>
                          <MyBadgeStatus color={getWarningColor(w.level)} contant={w.level} />
                        </div>
                        <div className="ai-item-row">
                          <span className="ai-item-text">{w.message}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      }
    />
  );
};

export default AutoPopulationResults;
