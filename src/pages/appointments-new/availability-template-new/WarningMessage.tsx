// WarningMessage.tsx
import React from 'react';
import { IoWarning } from "react-icons/io5";
type WarningMessageProps = {
  message: string;
};

const WarningMessage: React.FC<WarningMessageProps> = ({ message }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#FFF3CD',
        padding: '10px 15px',
        borderRadius: '5px',
        border: '1px solid #FFEeba',
      }}
    >
      <IoWarning color='#a5a55fff' size={25} style={{ marginRight: '10px'}}/>
      <span>{message}</span>
    </div>
  );
};

export default WarningMessage;
