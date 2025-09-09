import React from 'react';

interface TitleWithIconProps {
  icon: React.ReactNode;
  text: string;
  iconColor?: string;
  iconSize?: number;
}

export const TitleWithIcon: React.FC<TitleWithIconProps> = ({
  icon,
  text,
  iconColor = '#8f98ab',
  iconSize = 20
}) => {
  return (
    <div className="flex-c">
      {React.cloneElement(icon as React.ReactElement, {
        style: {
          fontSize: `${iconSize}px`,
          marginRight: '10px',
          color: iconColor
        }
      })}
      <span>{text}</span>
    </div>
  );
};
