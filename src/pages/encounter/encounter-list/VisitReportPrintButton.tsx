// VisitReportPrintButton.tsx

import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { Form, Tooltip, Whisper } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import { useLazyGetVisitReportPdfQuery } from '@/services/observationServiceNew';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

type Props = {
    row: any;
    lang?: 'en' | 'ar';
};

const VisitReportPrintButton = ({ row }: Props) => {
    const dispatch = useDispatch();
    const [triggerVisitReportPdf] = useLazyGetVisitReportPdfQuery();
    const [loading, setLoading] = useState(false);
    const [openlangModal, setOpenLangModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState({ lang: 'en' } as any);
    const handlePrintVisitReport = async () => {
        const encounterId = row?.id ?? null;

        if (!encounterId) {
            dispatch(notify({ msg: 'Encounter id is missing', sev: 'error' }));
            return;
        }

        try {
            setLoading(true);

            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

            const blob = await triggerVisitReportPdf({
                encounterId,
                timezone,
                lang: selectedLang.lang,
            }).unwrap();

            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const fileURL = window.URL.createObjectURL(pdfBlob);

            const win = window.open(fileURL, '_blank');

            if (win) {
                win.focus();
            } else {
                dispatch(
                    notify({
                        msg: 'Popup blocked. Please allow popups for this site.',
                        sev: 'warning',
                    })
                );
            }
        } catch (error: any) {
            dispatch(
                notify({
                    msg: error?.data?.message || 'Error while opening visit report',
                    sev: 'error',
                })
            );
        } finally {
            setLoading(false);
        }
    };
    const langOptions = [
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' },
    ];
    return (
        <>
            <Whisper
                trigger="hover"
                placement="top"
                speaker={<Tooltip>Print Visit Report</Tooltip>}
            >
                <div>
                    <MyButton
                        size="small"
                        backgroundColor="light-blue"
                        disabled={loading}
                        loading={loading}
                        prefixIcon={() =>
                            <FontAwesomeIcon icon={faPrint} />
                        }
                        onClick={() => setOpenLangModal(true)}>
                    </MyButton>
                </div>
            </Whisper>
            <MyModal
                open={openlangModal}
                setOpen={setOpenLangModal}
                title="Select Language"
                size="xs"
                actionButtonLabel='Print'
                actionButtonFunction={handlePrintVisitReport}
                bodyheight={'30vh'}
                content={
                    <Form>
                        <MyInput
                            fieldLabel="Language"
                            fieldName="lang"
                            fieldType="select"
                            selectData={langOptions}
                            record={selectedLang}
                            setRecord={setSelectedLang}
                        />
                    </Form>
                }
            />



        </>
    );
};

export default VisitReportPrintButton;