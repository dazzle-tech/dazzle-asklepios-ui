import React from 'react';
import './styles.less';
import Translate from '../Translate';

const MyBadgeStatus = ({ color = '#000000', contant, icon = null }) => {
  return (
    <div
      className={`my-badge-status${icon ? ' my-badge-status--with-icon' : ''}`}
      style={{ '--badge-color': color }}
    >
      {icon}
      <Translate>{contant}</Translate>
    </div>
  );
};

export default MyBadgeStatus;
