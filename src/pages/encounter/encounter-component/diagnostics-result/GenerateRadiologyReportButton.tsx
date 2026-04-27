import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

type Props = {
  disabled: boolean;
  loading?: boolean;
  onClick: () => void;
};

const GenerateRadiologyReportButton: React.FC<Props> = ({
  disabled,
  loading,
  onClick
}) => {
  return (
    <MyButton
      onClick={onClick}
      loading={loading}
      disabled={disabled}
      appearance='ghost'
      prefixIcon={() => (
        <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
      )}
      style={{ marginLeft: 'auto' }}
    >
      <Translate>Generate Report</Translate>
    </MyButton>
  );
};

export default GenerateRadiologyReportButton;