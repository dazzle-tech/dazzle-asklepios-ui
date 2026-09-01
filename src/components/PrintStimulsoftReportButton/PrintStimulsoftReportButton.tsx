import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { openPdfBlob } from '@/reports/stimulsoft/openStimulsoftPdf';
import {
  StimulsoftPdfParams,
  useLazyPrintStimulsoftReportPdfQuery,
} from '@/services/reports/stimulsoftReportService';

type Props = {
  templateCode: string;
  patientId?: number;
  encounterId?: number;
  departmentId?: number;
  status?: string;
  tooltip?: string;
  systemColor?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
};

/**
 * User print path: no Stimulsoft on the client.
 * Spring Boot ReportDataService fills data and returns a PDF.
 */
const PrintStimulsoftReportButton = ({
  templateCode,
  patientId,
  encounterId,
  departmentId,
  status,
  tooltip = 'Print Report',
  systemColor,
  disabled,
  children,
}: Props) => {
  const dispatch = useDispatch();
  const [triggerPdf] = useLazyPrintStimulsoftReportPdfQuery();
  const [loading, setLoading] = useState(false);
  const [openLangModal, setOpenLangModal] = useState(false);
  const [selectedLang, setSelectedLang] = useState({ lang: 'en' });

  const handlePrint = async () => {
    try {
      setLoading(true);
      const params: StimulsoftPdfParams = {
        templateCode,
        patientId,
        encounterId,
        departmentId,
        status,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lang: selectedLang.lang,
      };
      const blob = await triggerPdf(params).unwrap();
      openPdfBlob(blob);
      setOpenLangModal(false);
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.message ||
            error?.data?.message ||
            'Error while opening report PDF',
          sev: 'error',
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Whisper
        trigger="hover"
        placement="top"
        speaker={<Tooltip>{tooltip}</Tooltip>}
      >
        <div>
          <MyButton
            size="small"
            backgroundColor={systemColor ? undefined : 'light-blue'}
            disabled={loading || disabled}
            loading={loading}
            prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
            onClick={() => setOpenLangModal(true)}
          >
            {children}
          </MyButton>
        </div>
      </Whisper>
      <MyModal
        open={openLangModal}
        setOpen={setOpenLangModal}
        title="Select Language"
        size="xs"
        actionButtonLabel="Print"
        actionButtonFunction={handlePrint}
        bodyheight="30vh"
        content={
          <Form>
            <MyInput
              fieldLabel="Language"
              fieldName="lang"
              fieldType="select"
              selectData={[
                { label: 'English', value: 'en' },
                { label: 'Arabic', value: 'ar' },
              ]}
              record={selectedLang}
              setRecord={setSelectedLang}
            />
          </Form>
        }
      />
    </>
  );
};

export default PrintStimulsoftReportButton;
