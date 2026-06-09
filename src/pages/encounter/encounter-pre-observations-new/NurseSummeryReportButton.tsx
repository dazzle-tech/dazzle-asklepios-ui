import React,{useState} from "react";
import MyButton from "@/components/MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPrint } from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from "react-redux";
import { notify } from "@/utils/uiReducerActions";
import { useLazyGetRadiologyReportPdfQuery } from "@/services/reports/radiologyReportService";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate/Translate";
import { Form } from "rsuite";
import { useLazyGetNurseSummaryReportPdfQuery } from "@/services/observationServiceNew";
const NurseSummeryReportButton = ({ encounterId }: { encounterId: number }) => {
    const dispatch = useDispatch();
  const [triggerNurseSummaryReportPdf] = useLazyGetNurseSummaryReportPdfQuery();
    const [loading, setLoading] = useState(false);
    const [openLangModal, setOpenLangModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState<{ lang: string }>({ lang: 'en' });
    const langOptions = [
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' }
    ];
    const handleGenerateReport = async () => {
   
     if (!encounterId) {
       dispatch(notify({ msg: 'Encounter id is missing', sev: 'error' }));
       return;
     }
   
     try {
        setLoading(true)
       const blob = await triggerNurseSummaryReportPdf({ encounterId,
        lang:selectedLang.lang
        }).unwrap();
   
       const pdfBlob = new Blob([blob], {
         type: 'application/pdf',
       });
   
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
         setLoading(false)
       }
   
       // لا تعمل revokeObjectURL هون
     } catch (error: any) {
       dispatch(
         notify({
           msg: error?.data?.message || 'Error while generating report',
           sev: 'error',
         })
       );
     }
   };
    return (
        <>

            <MyButton
                onClick={() => setOpenLangModal(true)}
                loading={loading}
                disabled={encounterId ? false : true}
                appearance='ghost'
                prefixIcon={() => (
                    <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />
                )}
            >
                <Translate>Generate Report</Translate>
            </MyButton>
            <MyModal
                open={openLangModal}
                setOpen={setOpenLangModal}
                title="Select Language"
                size="xs"
                bodyheight="25vh"
                actionButtonFunction={handleGenerateReport}
                content={
                    <Form>
                        <MyInput
                            fieldType="select"
                            fieldLabel="Language"
                            fieldName="lang"
                            selectData={langOptions}
                            record={selectedLang}
                            setRecord={setSelectedLang}
                            width="100%"
                        />
                    </Form>
                }
            />



        </>
    );
}
export default NurseSummeryReportButton;