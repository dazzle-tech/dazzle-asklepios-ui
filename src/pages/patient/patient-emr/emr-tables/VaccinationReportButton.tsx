import React, { useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate/Translate';
import { Form } from 'rsuite';
import { useLazyGetPatientVaccinationReportPdfQuery } from '@/services/patient/patientService';

const langOptions = [
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' }
];

const VaccinationReportButton = ({ patientId }: { patientId?: number }) => {
  const dispatch = useDispatch();
  const [triggerVaccinationReportPdf] = useLazyGetPatientVaccinationReportPdfQuery();
  const [loading, setLoading] = useState(false);
  const [openLangModal, setOpenLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState<{ lang: string }>({ lang: 'en' });

  const handleGenerateReport = async () => {
    if (!patientId) {
      dispatch(notify({ msg: 'Patient id is missing', sev: 'error' }));
      return;
    }

    try {
      setLoading(true);

      const blob = await triggerVaccinationReportPdf({
        patientId,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: selectedLang.lang
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
            sev: 'warning'
          })
        );
      }
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.message || 'Error while generating report',
          sev: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <MyButton
        onClick={() => setOpenLangModal(true)}
        loading={loading}
        disabled={!patientId}
        appearance="ghost"
        prefixIcon={() => <FontAwesomeIcon icon={faPrint} style={{ marginRight: 8 }} />}
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
        actionButtonLoading={loading}
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
};

export default VaccinationReportButton;
