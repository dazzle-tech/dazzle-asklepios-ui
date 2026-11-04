import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';

import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { downloadPdfBlob } from '@/reports/stimulsoft/openStimulsoftPdf';
import {
  toStimulsoftPdfParams,
  useLazyPrintStimulsoftReportPdfQuery,
} from '@/services/reports/stimulsoftReportService';

type Props = {
  templateCode: string;
  params?: Record<string, unknown>;
  tooltip?: string;
  systemColor?: boolean;
  disabled?: boolean;
  children?: React.ReactNode;
};

const PrintStimulsoftReportButton = ({
  templateCode,
  params,
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
      const blob = await triggerPdf(
        toStimulsoftPdfParams(templateCode, {
          ...params,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          lang: selectedLang.lang,
        })
      ).unwrap();
      await downloadPdfBlob(blob, templateCode || 'report');
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
