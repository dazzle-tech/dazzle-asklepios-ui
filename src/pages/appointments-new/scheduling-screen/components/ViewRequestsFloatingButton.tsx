import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';

type Props = {
  onOpen: () => void;
};

const ViewRequestsFloatingButton = ({ onOpen }: Props) => {
  const [wasDragged, setWasDragged] = useState(false);

  return (
    <Draggable
      onStart={() => setWasDragged(false)}
      onDrag={() => setWasDragged(true)}
      onStop={() => {
        setTimeout(() => setWasDragged(false), 200);
      }}
    >
      <div
        className="appointments-requests-fab-toggle"
        onClick={() => {
          if (!wasDragged) onOpen();
        }}
      >
        <FontAwesomeIcon icon={faPaperPlane} />
        <span>View App Requests</span>
      </div>
    </Draggable>
  );
};

export default ViewRequestsFloatingButton;

