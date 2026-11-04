import React from 'react';
import clsx from 'clsx';
import {
  SentimentVerySatisfied,
  SentimentSatisfied,
  SentimentSatisfiedAlt,
  SentimentNeutral,
  SentimentDissatisfied,
  SentimentVeryDissatisfied,
} from '@mui/icons-material';

import './styles.less';

type FaceOption = {
  value: number;
  icon: React.ElementType;
  label: string;
};

type FacesSliderProps = {
  title?: string;
  value: number;
  disabled?: boolean;
  faces?: FaceOption[];
  getTrackColor: (value: number) => string;
  onChange: (value: number) => void;
};

const defaultFaces: FaceOption[] = [
  {
    value: 0,
    icon: SentimentVerySatisfied,
    label: 'No pain',
  },
  {
    value: 1,
    icon: SentimentVerySatisfied,
    label: 'Very mild',
  },
  {
    value: 2,
    icon: SentimentSatisfied,
    label: 'Mild',
  },
  {
    value: 3,
    icon: SentimentSatisfiedAlt,
    label: 'Mild',
  },
  {
    value: 4,
    icon: SentimentSatisfiedAlt,
    label: 'Mild',
  },
  {
    value: 5,
    icon: SentimentNeutral,
    label: 'Moderate',
  },
  {
    value: 6,
    icon: SentimentNeutral,
    label: 'Moderate',
  },
  {
    value: 7,
    icon: SentimentDissatisfied,
    label: 'Painful',
  },
  {
    value: 8,
    icon: SentimentDissatisfied,
    label: 'Very painful',
  },
  {
    value: 9,
    icon: SentimentVeryDissatisfied,
    label: 'Severe pain',
  },
  {
    value: 10,
    icon: SentimentVeryDissatisfied,
    label: 'Worst pain',
  },
];

const FacesSlider: React.FC<FacesSliderProps> = ({
  title,
  value,
  disabled = false,
  faces = defaultFaces,
  getTrackColor,
  onChange,
}) => {
  return (
    <div className="faces-slider">
      {title && <div className="faces-slider__title">{title}</div>}

      <div className="faces-slider__rating">
        {faces.map(face => {
          const Icon = face.icon;
          const trackColor = getTrackColor(face.value);

          return (
            <div
              key={face.value}
              className={clsx('faces-slider__item', {
                'faces-slider__item--disabled': disabled,
              })}
              onClick={() => {
                if (!disabled) {
                  onChange(face.value);
                }
              }}
              title={face.label}
            >
              <Icon
                className={clsx('faces-slider__icon', {
                  'faces-slider__icon--selected':
                    face.value === value,
                })}
                style={{
                  color:
                    trackColor === 'transparent'
                      ? 'var(--primary-blue)'
                      : trackColor,
                }}
              />

              <span className="faces-slider__number">
                {face.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FacesSlider;

