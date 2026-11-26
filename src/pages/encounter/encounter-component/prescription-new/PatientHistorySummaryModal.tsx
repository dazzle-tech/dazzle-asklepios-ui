import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import PatientHistorySummary from './PatientHistorySummary';

interface Props {
    open: boolean;
    setOpen: (val: boolean) => void;
    patient: any;
    encounter: any;
    edit?: boolean;
    handleSave?: any;
    // Submit in progress: the action button shows loading and cannot be clicked again.
    saving?: boolean;

    medicationValidationPayload?: any;
}

const PatientHistorySummaryModal: React.FC<Props> = ({
    open,
    setOpen,
    patient,
    encounter,
    edit,
    handleSave,
    saving = false,
    medicationValidationPayload
}) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
    const [ready, setReady] = useState(false);

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="AI Medication Validation"
            size="70vw"
            bodyheight="75vh"
            actionButtonFunction={handleSave}
            actionButtonLoading={saving}
            isDisabledActionBtn={saving || !ready}
            content={() => (<div dir={dir}>
                <PatientHistorySummary
                    aiPayload={medicationValidationPayload}
                    onReadyChange={setReady}
                    onContinueWithoutAi={handleSave}
                    onEditPrescription={() => setOpen(false)}
                /></div>
            )}

        />
    );
};

export default PatientHistorySummaryModal;
