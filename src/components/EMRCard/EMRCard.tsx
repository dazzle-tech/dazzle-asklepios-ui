import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { useSelector } from 'react-redux';
import './styles.less';

interface EMRCardProps {
  number: number | string;
  footerText: string;
  icon?: IconDefinition;
  backgroundColor?: string;
  // footerBackgroundColor?: string;
  // textColor?: string;
  width?: number | string;
  height?: number | string;
  onClick?: () => void;
  active?: boolean;
}

const EMRCard: React.FC<EMRCardProps> = ({
  number,
  footerText,
  icon,
  backgroundColor = '#FF5B5B',
  // footerBackgroundColor = '#F0F0F0',
  // textColor = '#fff',
  width = 140,
  height = 90,
  onClick,
  active = false
}) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <div
      className={`emr-card ${active ? 'emr-card--active' : ''}`}
      data-type={footerText.toLowerCase().replace(' ', '')}
      style={{
        backgroundColor,
        color: mode === 'light' ? '#fff' : 'var(--light-gray)',
        width,
        height,
        cursor: onClick ? 'pointer' : 'default',
        ['--card-accent-color' as any]: backgroundColor
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className="emr-card-header">
        {icon && <FontAwesomeIcon icon={icon} className="emr-card-icon" />}
        {/* <span className="emr-card-number">{number}</span> */}
      </div>

      <div
        className="emr-card-footer"
        style={{
          backgroundColor: mode === 'light' ? '#F0F0F0' : '#BBBCBD'
        }}
      >
        {footerText}
      </div>
    </div>
  );
};

export default EMRCard;