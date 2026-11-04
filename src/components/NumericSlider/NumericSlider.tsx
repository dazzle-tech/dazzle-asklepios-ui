import React from 'react';
import { Slider } from 'rsuite';
import MyLabel from '@/components/MyLabel';
import './styles.less';

interface NumericSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  required?: boolean;
  disabled?: boolean;
  onChange: (value: number) => void;
  getTrackColor?: (value: number) => string;
}

const NumericSlider: React.FC<NumericSliderProps> = ({
  label,
  value,
  min,
  max,
  required = false,
  disabled = false,
  onChange,
  getTrackColor,
}) => {
  const fillPercentage =
    ((value - min) / Math.max(1, max - min)) * 100;

  return (
    <div className="numeric-slider">
      <MyLabel
        label={`${label} (${value}-${max})`}
        required={required}
      />

      <div className="numeric-slider__track">
        <Slider
          value={value}
          onChange={sliderValue => {
            onChange(Number(sliderValue ?? min));
          }}
          min={min}
          max={max}
          step={1}
          progress
          disabled={disabled}
        />

        {getTrackColor && (
          <div
            className="numeric-slider__fill"
            style={{
              width: `${fillPercentage}%`,
              backgroundColor: getTrackColor(value),
            }}
          />
        )}
      </div>
    </div>
  );
};

export default NumericSlider;

