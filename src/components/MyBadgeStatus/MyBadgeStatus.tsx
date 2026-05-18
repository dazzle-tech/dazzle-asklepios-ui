import React from 'react';
import './styles.less';

const MyBadgeStatus = ({ color = '#000000', contant }) => {
  return (
    <div
      className="my-badge-status"
      style={{ '--badge-color': color }}
    >
      {contant}
    </div>
  );
};

export default MyBadgeStatus;
