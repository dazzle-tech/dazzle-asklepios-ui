
import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faPrint } from '@fortawesome/free-solid-svg-icons';
import { Form, Tooltip, Whisper } from 'rsuite';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { useLazyGetPatientWristbandPdfQuery } from '@/services/patient/patientService';

type Props = {
    patientId: number;
    disabled:boolean;
    lang?: 'en' | 'ar';
};

const PatientWritBandPrintLabelButton = ({ patientId ,disabled}: Props) => {
    const dispatch = useDispatch();
  const [triggerGetPatientWristbandPdf] = useLazyGetPatientWristbandPdfQuery();
    const [loading, setLoading] = useState(false);
    const [openlangModal, setOpenLangModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState({ lang: 'en' } as any);
    const [copies,setCopies]=useState({number:1})
    const handlePrintVisitReport = async () => {

        if (!patientId) {
            dispatch(notify({ msg: 'Patient id is missing', sev: 'error' }));
            return;
        }

        try {
            setLoading(true);


            const blob = await triggerGetPatientWristbandPdf({
                patientId,
                lang: selectedLang.lang,
                copies:copies.number

            }).unwrap();

            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            const fileURL = window.URL.createObjectURL(pdfBlob);

            const win = window.open(fileURL, '_blank');

            if (win) {
                win.focus();
                setOpenLangModal(false);
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
            setOpenLangModal(false);
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
                        disabled={loading||disabled}
                        loading={loading}
                        prefixIcon={() =>
                            <FontAwesomeIcon icon={faBarcode} />
                        }
                        onClick={() => setOpenLangModal(true)}>
                    </MyButton>
                </div>
            </Whisper>
            <MyModal
                open={openlangModal}
                setOpen={setOpenLangModal}
                title="Print Label"
                size="xs"
                actionButtonLabel='Print'
                actionButtonFunction={handlePrintVisitReport}
                bodyheight={'30vh'}
                content={
                    <Form fluid >
                        <MyInput
                           width={"50%"}
                            fieldLabel="Language"
                            fieldName="lang"
                            fieldType="select"
                            selectData={langOptions}
                            record={selectedLang}
                            setRecord={setSelectedLang}
                        />
                        <MyInput
                          width={"50%"}
                            fieldLabel="Number of Copies"
                            fieldName="number"
                            fieldType="number"
                            record={copies}
                            setRecord={setCopies}
                        />

                    </Form>
                }
            />



        </>
    );
};

export default PatientWritBandPrintLabelButton;