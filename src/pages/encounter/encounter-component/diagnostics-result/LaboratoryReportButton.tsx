import React, { useState } from "react";
import MyButton from "@/components/MyButton/MyButton";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFilePdf, faPrint } from "@fortawesome/free-solid-svg-icons";
import { useDispatch } from "react-redux";
import { notify } from "@/utils/uiReducerActions";
import MyModal from "@/components/MyModal/MyModal";
import MyInput from "@/components/MyInput";
import Translate from "@/components/Translate/Translate";
import { Form } from "rsuite";
import { useLazyGetLaboratoryReportsPdfQuery } from "@/services/reports/laboratoryReportsService";
const LaboratoryReportButton = ({ resultIds }: { resultIds: number[] }) => {
    const dispatch = useDispatch();

    const [fetchLaboratoryResultPdfData, { isFetching: isGeneratingReport }] =
        useLazyGetLaboratoryReportsPdfQuery();
    const [loading, setLoading] = useState(false);
    const [openLangModal, setOpenLangModal] = useState(false);
    const [selectedLang, setSelectedLang] = useState<{ lang: string }>({ lang: 'en' });
    const langOptions = [
        { label: 'English', value: 'en' },
        { label: 'Arabic', value: 'ar' }
    ];
    const handleDownloadRadiologyReportPdf = async () => {
        try {
            setLoading(true);
            const blob = await fetchLaboratoryResultPdfData({ resultIds, lang: selectedLang.lang }).unwrap();
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
                    msg: error?.data?.message || 'Failed to download report',
                    sev: 'error',
                })
            );
        }
        finally {
            setLoading(false);
        }
    };
    return (
        <>

            <MyButton
                onClick={() => setOpenLangModal(true)}
                loading={loading}
                disabled={resultIds.length > 0 ? false : true}
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
                actionButtonFunction={handleDownloadRadiologyReportPdf}
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
export default LaboratoryReportButton;