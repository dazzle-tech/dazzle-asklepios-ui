// usePatientInformationReportPrint.tsx

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import { useLazyGetPatientLabelPdfQuery } from '@/services/patient/patientService';
import { notify } from '@/utils/uiReducerActions';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Dropdown, Form } from 'rsuite';

const usePatientLabelPrint = (patientId?: number) => {
  const dispatch = useDispatch();
  const [triggerGetPatientLabelPdf] = useLazyGetPatientLabelPdfQuery();
  const [loading, setLoading] = useState(false);
  const [openLangModal, setOpenLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState<{ lang: 'en' | 'ar' }>({
    lang: 'en'
  });
const [copies,setCopies]=useState({number:1});
  const handlePrintInformation = async () => {
    if (!patientId) return;

    try {
      setLoading(true);

      const blob = await triggerGetPatientLabelPdf({
        patientId,
        lang: selectedLang.lang,
        copies:copies.number
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
      onClick={() => {
        if(!patientId) return;
        setOpenLangModal(true)}}
    >
      <div className="container-of-icon-and-key1">
        <Translate>
          {loading ? 'Printing Label...' : 'Print Label'}
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
        <Form fluid>
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
          <MyInput
          fieldLabel='Number of Copies'
          fieldName='number'
          fieldType='number'
          record={copies}
          setRecord={setCopies}
          />
        </Form>
      }
    />
  );

  return {
    patientLabelMenuItem: menuItem,
    patientLabelModal: modal
  };
};

export default usePatientLabelPrint;