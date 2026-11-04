import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';

interface Props {
  open: boolean;
  setOpen: (val: boolean) => void;
  patient: any;
  encounter: any;
  edit?: boolean;
  handleSave?: any;
  lang?: string; 
}

const PatientHistorySummaryModal: React.FC<Props> = ({
  open,
  setOpen,
  patient,
  encounter,
  edit,
  handleSave,
  lang = 'en'
}) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient History Summary"
      size="70vw"
      bodyheight="75vh"
      hideActionBtn={true}
      content={() => (
        (<div dir={dir}>
            <PatientHistorySummary
              patient={patient}
              encounter={encounter}
              edit={edit}
            /> </div>
          )
      )}
    />
  );
};

export default PatientHistorySummaryModal;