import React,{useState} from "react";
import MyButton from "@/components/MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPrint } from "@fortawesome/free-solid-svg-icons";
import { Form, Tooltip, Whisper } from "rsuite";
import { useDispatch } from "react-redux";
import { notify } from "@/utils/uiReducerActions";
import { useLazyGetPrescriptionPdfQuery } from "@/services/patients/Prescription/patientPrescriptionService";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
const PrescriptionReportButton = ({ prescriptionId ,disabled}: { prescriptionId: number, disabled: boolean }) => {
    const dispatch = useDispatch();
    const [triggerPrescriptionPdf] = useLazyGetPrescriptionPdfQuery();
    const [loading, setLoading] = useState(false);
    const [openlangModal, setOpenLangModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState({ lang: 'en' } as any);

    const handlePrintPrescription = async () => {   
        try {
            setLoading(true);   
            const blob = await triggerPrescriptionPdf({ prescriptionId, lang: selectedLang.lang }).unwrap();
            const pdfBlob = new Blob([blob], { type: "application/pdf" });
            const fileURL = window.URL.createObjectURL(pdfBlob);
            const win = window.open(fileURL, "_blank");
            if (win) {
                win.focus();
            }
                else {
                dispatch(
                    notify({
                        msg: "Popup blocked. Please allow popups for this site.",
                        sev: "warning",
                    })
                );
            }   
        } catch (error: any) {
            dispatch(
                notify({
                    msg: "Failed to generate prescription PDF.",
                    sev: "error",
                })
            );
        }
        finally {
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
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Print Prescription</Tooltip>}
            >
                <MyButton
                    onClick={() => setOpenLangModal(true)}
                    size="xs"
                    disabled={ disabled}
                    loading={loading}
                >
                    <FontAwesomeIcon icon={faPrint} />
                </MyButton>
            </Whisper>
            <MyModal
                open={openlangModal}
                setOpen={setOpenLangModal}
                size="xs"
                actionButtonLabel='Print'
                actionButtonFunction={handlePrintPrescription}
                bodyheight={'30vh'}
                title="Select Language"
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
}
export default PrescriptionReportButton;