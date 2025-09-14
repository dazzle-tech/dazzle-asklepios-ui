// DetailsCard.tsx imports
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { Panel } from 'rsuite';

import './styles.less';
import { useSelector } from 'react-redux';
//props
interface DetailsCardProps {
  title: string;
  number: number | string;
  icon?: IconDefinition;
  color: string;
  backgroundClassName?: string;
  position?: 'left' | 'center' | 'right';
  width?: string | number;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  title,
  number,
  icon,
  color,
  backgroundClassName = '',
  position = 'left',
  width = 240,
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
          <h4 style={{ color: `var(${color})` }}>{number}</h4>
          <p>{title}</p>
        </div>
      </div>
    </Panel>
  );
};

export default DetailsCard;
