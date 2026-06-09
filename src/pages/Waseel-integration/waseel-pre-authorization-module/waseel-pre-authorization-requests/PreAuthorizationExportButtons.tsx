import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileExcel, faFilePdf } from '@fortawesome/free-solid-svg-icons';

import MyButton from '@/components/MyButton/MyButton';

const PreAuthorizationExportButtons: React.FC = () => (
  <div className="container-of-add-new-button pre-auth-export-buttons">
    <MyButton
      prefixIcon={() => <FontAwesomeIcon icon={faFileExcel} />}
      color="var(--deep-blue)"
      onClick={() => console.log('Export Excel')}
      width="130px"
    >
      Export Excel
    </MyButton>

    <MyButton
      prefixIcon={() => <FontAwesomeIcon icon={faFilePdf} />}
      appearance="ghost"
      onClick={() => console.log('Export PDF')}
      width="120px"
    >
      Export PDF
    </MyButton>
  </div>
);

export default PreAuthorizationExportButtons;
