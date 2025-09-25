// DetailsCard.tsx imports
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Panel } from 'rsuite';

import './styles.less';
import { useSelector } from 'react-redux';
import MyBadgeStatus from '../MyBadgeStatus/MyBadgeStatus';

//props
interface DetailsCardProps {
  title: string;
  number: number | string;
  icon?: IconDefinition;
  color: string;
  badgeColor?: string; 
  backgroundClassName?: string;
  position?: 'left' | 'center' | 'right';
  width?: string | number;
  badgeText?: string;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  title,
  number,
  icon,
  color,
  badgeColor = color,
  backgroundClassName = '',
  position = 'left',
  width = 240,
  badgeText,
}) => {
  const mode = useSelector((state: any) => state.ui.mode);
  return (
    <Panel
      shaded
      bordered
      bodyFill
      className={`details-card ${backgroundClassName} ${mode === 'light' ? 'light' : 'dark'}`}
      style={{ width }}
    >
      <div className={`details-card-content position-${position}`}>
        {icon && (
          <FontAwesomeIcon
            className="details-card-icon"
            icon={icon}
            style={{ color: `var(${color})` }}
          />
        )}
        <div className="details-card-text">
          <h4 style={{ marginBottom: 6 }}>{number}</h4>
          <p>{title}</p>
          {badgeText && (
            <div className="details-card-badge-wrapper">
              <MyBadgeStatus contant={badgeText} color={badgeColor} />
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
};

export default DetailsCard;
