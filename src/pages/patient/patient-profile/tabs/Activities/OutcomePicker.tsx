import React from 'react';
import MyLabel from '@/components/MyLabel';

type Props = {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
};

/** One-click outcome chips; clicking the selected chip clears it. */
const OutcomePicker: React.FC<Props> = ({ options, value, onChange, required }) => (
  <div className="patient-activity-outcomes">
    <MyLabel label={required ? 'Outcome *' : 'Outcome'} />
    <div className="patient-activity-outcome-chips">
      {options.map(option => (
        <button
          key={option}
          type="button"
          className={`patient-activity-chip${value === option ? ' selected' : ''}`}
          aria-pressed={value === option}
          onClick={() => onChange(value === option ? '' : option)}
        >
          {option}
        </button>
      ))}
    </div>
  </div>
);

export default OutcomePicker;
