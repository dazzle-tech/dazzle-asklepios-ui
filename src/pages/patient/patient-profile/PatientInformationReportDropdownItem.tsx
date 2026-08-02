// usePatientInformationReportPrint.tsx

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useLazyGetPatientInformationPdfQuery } from '@/services/patient/patientService';
import { notify } from '@/utils/uiReducerActions';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dropdown, Form } from 'rsuite';

const usePatientInformationReportPrint = (patientId?: number) => {
  const dispatch = useDispatch();
  const [triggerGetPatientInformationPdf] = useLazyGetPatientInformationPdfQuery();

  const [loading, setLoading] = useState(false);
  const [openLangModal, setOpenLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState<{ lang: 'en' | 'ar' }>({
    lang: 'en'
  });

  const handlePrintInformation = async () => {
    if (!patientId) return;

    try {
      setLoading(true);

      const blob = await triggerGetPatientInformationPdf({
        patientId,
        lang: selectedLang.lang
      }).unwrap();

      const fileURL = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

      const win = window.open(fileURL, '_blank');

      if (win) {
        win.focus();
      } else {
        dispatch(
          notify({
            msg: 'Popup blocked. Please allow popups for this site.',
            sev: 'warning'
          })
        );
      }

      setOpenLangModal(false);
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const menuItem = (
    <Dropdown.Item
      disabled={!patientId || loading}
      onClick={() =>{ 
        if(!patientId) return;
        setOpenLangModal(true)}}
    >
      <div className="container-of-icon-and-key1">
        <Translate>
          {loading ? 'Printing Information...' : 'Print Information'}
        </Translate>
      </div>
    </Dropdown.Item>
  );

  const modal = (
    <MyModal
      open={openLangModal}
      setOpen={setOpenLangModal}
      title="Select Language"
      size="xs"
      actionButtonLabel={loading ? 'Printing...' : 'Print'}
      actionButtonFunction={handlePrintInformation}
      bodyheight="30vh"
      content={
        <Form>
          <MyInput
            fieldLabel="Language"
            fieldName="lang"
            fieldType="select"
            selectData={[
              { label: 'English', value: 'en' },
              { label: 'Arabic', value: 'ar' }
            ]}
            record={selectedLang}
            setRecord={setSelectedLang}
          />
        </Form>
      }
    />
  );

  return {
    patientInformationMenuItem: menuItem,
    patientInformationModal: modal
  };
};

export default usePatientInformationReportPrint;