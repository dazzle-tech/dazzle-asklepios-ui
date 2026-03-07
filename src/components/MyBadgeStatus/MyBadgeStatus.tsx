import React from 'react';
import './styles.less';

const MyBadgeStatus = ({ backgroundColor = null, color = '#000000', contant }) => {
  function hexToRGBA(hex, opacity = 0.2) {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  return (
    <div
      className="my-badge-status"
      style={{
        backgroundColor: backgroundColor ? backgroundColor : hexToRGBA(color, 0.2),
        color: color
      }}
    >
      {contant}
    </div>
  );
};

export default MyBadgeStatus;
