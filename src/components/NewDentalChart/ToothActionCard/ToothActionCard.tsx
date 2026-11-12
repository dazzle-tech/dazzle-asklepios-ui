import React from 'react';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faNoteSticky } from '@fortawesome/free-solid-svg-icons';

import Translate from '@/components/Translate';
import { toothDisplayLabel } from '@/utils/toothNumber';

import './styles.less';

interface ToothActionCardProps {
  date?: number | string | Date | null;
  toothNumber?: number | string | null;
  action: string;
  type: string;
  surface: string;
  note?: string | null;
  existing: boolean;
  anesthesiaUsed?: string | null;
  dose?: string | number | null;
}

const ToothActionCard = ({
  date,
  toothNumber,
  action,
  type,
  surface,
  note,
  existing,
  anesthesiaUsed,
  dose
}: ToothActionCardProps) => {
  const parsedDate =
    date == null || date === ''
      ? null
      : date instanceof Date
        ? date
        : new Date(date);

  const validDate =
    parsedDate && !Number.isNaN(parsedDate.getTime())
      ? parsedDate
      : null;

  const normalizedType = String(type || '').toLowerCase();

  const typeLabel =
    normalizedType === 'treatment'
      ? 'Treatment'
      : normalizedType === 'condition'
        ? 'Condition'
        : type || '—';

  const hasDose = dose !== null && dose !== undefined && dose !== '';

  const fields = [
    ...(toothNumber != null && toothNumber !== ''
      ? [{
          key: 'tooth',
          label: 'Tooth #',
          value:
            typeof toothNumber === 'string'
              ? toothDisplayLabel(toothNumber)
              : toothNumber
        }]
      : []),
    {
      key: 'action',
      label: 'Action',
      value: action || '—'
    },
    {
      key: 'type',
      label: 'Type',
      value: typeLabel
    },
    {
      key: 'surface',
      label: 'Surface',
      value: surface || '—'
    },
    {
      key: 'existing',
      label: 'Existing',
      value: existing ? 'Yes' : 'No'
    },
    ...(anesthesiaUsed
      ? [{
          key: 'anesthesia',
          label: 'Anesthesia',
          value: anesthesiaUsed
        }]
      : []),
    ...(hasDose
      ? [{
          key: 'dose',
          label: 'Dose',
          value: dose
        }]
      : [])
  ];

  return (
    <div className="tooth-action-card">
      <div className="tooth-action-date">
        {validDate ? (
          <time dateTime={validDate.toISOString()}>
            <span className="tooth-action-month">
              {validDate.toLocaleString(undefined, {
                month: 'short'
              })}
            </span>

            <strong className="tooth-action-day">
              {validDate.getDate()}
            </strong>

            <span className="tooth-action-year">
              {validDate.getFullYear()}
            </span>
          </time>
        ) : (
          <span className="tooth-action-no-date">—</span>
        )}
      </div>

      <div className="tooth-action-content">
        <div className="tooth-info">
          {fields.map(field => (
            <div
              key={field.key}
              className={clsx('tooth-info-item', {
                'tooth-info-item--action': field.key === 'action'
              })}
            >
              <span className="tooth-action-info-label">
                <Translate>{field.label}</Translate>
              </span>

              <span
                className={clsx('tooth-action-info-value', {
                  treatment:
                    field.key === 'type' &&
                    normalizedType === 'treatment',
                  condition:
                    field.key === 'type' &&
                    normalizedType === 'condition'
                })}
              >
                {field.key === 'type' || field.key === 'existing' ? (
                  <Translate>{String(field.value)}</Translate>
                ) : (
                  field.value
                )}
              </span>
            </div>
          ))}
        </div>

        {note?.trim() && (
          <div className="tooth-action-note">
            <FontAwesomeIcon icon={faNoteSticky} />

            <div className="tooth-action-note-content">
              <span className="tooth-action-info-label">
                <Translate>Notes</Translate>
              </span>

              <p className="tooth-action-note-value">{note}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ToothActionCard;