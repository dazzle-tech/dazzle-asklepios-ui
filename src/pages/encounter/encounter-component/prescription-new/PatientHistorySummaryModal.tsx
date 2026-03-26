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

    medicationValidationPayload?: any;
}

const PatientHistorySummaryModal: React.FC<Props> = ({
    open,
    setOpen,
    patient,
    encounter,
    edit,
    handleSave,
    medicationValidationPayload
}) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Treatment Validation Summary"
            size="70vw"
            bodyheight="75vh"
            actionButtonFunction={handleSave}
            content={() => (<div dir={dir}>
                <PatientHistorySummary
                    title="Medication Validation"
                    aiPayload={medicationValidationPayload}
                /></div>
            )}

        />
    );
};

export default PatientHistorySummaryModal;
