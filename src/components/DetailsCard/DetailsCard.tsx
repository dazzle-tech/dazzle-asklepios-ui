// DetailsCard.tsx imports
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import './styles.less';

//props
interface DetailsCardProps {
  title: string;
  number: number;
  icon: IconDefinition;
  color: string;
  backgroundClassName?: string;
}

const DetailsCard: React.FC<DetailsCardProps> = ({
  title,
  number,
  icon,
  color,
  backgroundClassName = '',
}) => {
  return (
    <div className={`details-card ${backgroundClassName}`}>
      <div className="sections-row-positions-handle">
        <FontAwesomeIcon
          className="icon-style"
          icon={icon}
          style={{ color: `var(${color})` }}
        />
        <div className="sections-coulmns-positions-handle">
          <h4 style={{ color: `var(${color})` }}>{number}</h4>
          <p>{title}</p>
        </div>
      </div>
    </div>
  );
};

export default DetailsCard;
