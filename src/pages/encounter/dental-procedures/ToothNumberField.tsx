import React, { useEffect } from 'react';
import Translate from '@/components/Translate';
import { toothCodesForPatient, toothJawsForPatient, isAdultDentition } from './toothChart';

type ToothNumberFieldProps = {
  patient?: any;
  value?: string[];
  onChange: (toothNumbers: string[]) => void;
  disabled?: boolean;
};

const ToothNumberField: React.FC<ToothNumberFieldProps> = ({
  patient,
  value = [],
  onChange,
  disabled = false
}) => {
  const jaws = toothJawsForPatient(patient);
  const allowed = toothCodesForPatient(patient);
  const adult = isAdultDentition(patient);

  useEffect(() => {
    const next = value.filter(code => allowed.has(code));
    if (next.length !== value.length) {
      onChange(next);
    }
  }, [allowed, onChange, value]);

  const toggle = (code: string) => {
    if (disabled) return;
    const selected = new Set(value.filter(item => allowed.has(item)));
    if (selected.has(code)) {
      selected.delete(code);
    } else {
      selected.add(code);
    }
    onChange(jaws.flatMap(jaw => jaw.sides.flatMap(side => side.teeth)).filter(code => selected.has(code)));
  };

  return (
    <div className="tooth-chart">
      <div className="tooth-chart__label">
        <Translate>Tooth Number</Translate>
        <span className="tooth-chart__required">*</span>
        <span className="tooth-chart__hint">
          <Translate>{adult ? 'Adult dentition' : 'Primary dentition'}</Translate>
        </span>
      </div>

      {jaws.map(jaw => (
        <div className="tooth-chart__jaw" key={jaw.label}>
          <div className="tooth-chart__jaw-title">
            <Translate>{jaw.label}</Translate>
          </div>
          <div className="tooth-chart__sides">
            {jaw.sides.map(side => (
              <div key={side.label}>
                <div className="tooth-chart__side-label">
                  <Translate>{side.label}</Translate>
                </div>
                <div className="tooth-chart__teeth">
                  {side.teeth.map(code => {
                    const selected = value.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`tooth-chart__tooth${selected ? ' selected' : ''}`}
                        aria-pressed={selected}
                        disabled={disabled}
                        onClick={() => toggle(code)}
                      >
                        {code}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ToothNumberField;
