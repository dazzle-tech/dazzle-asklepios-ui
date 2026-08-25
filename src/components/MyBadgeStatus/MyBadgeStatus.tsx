import React from 'react';
import './styles.less';
import Translate from '../Translate';

const MyBadgeStatus = ({ color = '#000000', contant }) => {
  return (
    <div
      className="my-badge-status"
      style={{ '--badge-color': color }}
    >
      <Translate>{contant}</Translate>
    </div>
  );
};

export default MyBadgeStatus;
