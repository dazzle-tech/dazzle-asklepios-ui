import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import { MdPrint } from 'react-icons/md';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint } from '@fortawesome/free-solid-svg-icons';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useLazyGetProcedureReportPdfQuery } from '@/services/patients/patientProcedureService';

const LANG_OPTIONS = [
  { label: 'English', value: 'en' },
  { label: 'Arabic', value: 'ar' }
];

type ProcedureReportButtonProps = {
  /** patient_procedure.id */
  procedureRequestId?: number | null;
  disabled?: boolean;
  /** icon: table cell icon, button: small solid button, ghost: labelled outline button */
  variant?: 'icon' | 'button' | 'ghost';
};

const defaultLang = () => ((localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'ar' : 'en');

/**
 * Opens the procedure report PDF (request, team, pre-assessment, performance, vitals,
 * complications, post-procedure care and signatures) in a new tab.
 */
const ProcedureReportButton = ({
  procedureRequestId,
  disabled,
  variant = 'icon'
}: ProcedureReportButtonProps) => {
  const dispatch = useAppDispatch();
  const [fetchPdf] = useLazyGetProcedureReportPdfQuery();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [record, setRecord] = useState<{ lang: string }>({ lang: defaultLang() });

  const isDisabled = disabled || !procedureRequestId;

  const handlePrint = async () => {
    if (!procedureRequestId) return;
    // Open the tab synchronously so the popup blocker treats it as user initiated
    const win = window.open('', '_blank');
    try {
      setLoading(true);
      const blob = await fetchPdf({
        procedureRequestId,
        lang: record.lang,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      }).unwrap();
      const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      if (win) {
        win.location.href = url;
        win.focus();
      } else {
        dispatch(notify({ msg: 'Popup blocked. Please allow popups for this site.', sev: 'warning' }));
      }
      setOpen(false);
    } catch (error: any) {
      win?.close();
      dispatch(
        notify({
          msg: error?.data?.message || 'Failed to generate the procedure report',
          sev: 'error'
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const openModal = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isDisabled) return;
    setRecord({ lang: defaultLang() });
    setOpen(true);
  };

  const trigger =
    variant === 'icon' ? (
      <MdPrint
        size={22}
        fill={isDisabled ? '#ccc' : 'var(--primary-gray)'}
        style={{ cursor: isDisabled ? 'not-allowed' : 'pointer' }}
        onClick={openModal}
      />
    ) : variant === 'ghost' ? (
      <MyButton
        appearance="ghost"
        disabled={isDisabled}
        loading={loading}
        onClick={openModal}
        prefixIcon={() => <FontAwesomeIcon icon={faPrint} />}
      >
        <Translate>Procedure Report</Translate>
      </MyButton>
    ) : (
      <MyButton size="small" disabled={isDisabled} loading={loading} onClick={openModal}>
        <FontAwesomeIcon icon={faPrint} />
      </MyButton>
    );

  return (
    <>
      {variant === 'ghost' ? (
        trigger
      ) : (
        <Whisper
          placement="top"
          trigger="hover"
          speaker={
            <Tooltip>
              <Translate>Procedure Report</Translate>
            </Tooltip>
          }
        >
          <div onClick={e => e.stopPropagation()}>{trigger}</div>
        </Whisper>
      )}
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Procedure Report"
        size="xs"
        bodyheight="25vh"
        actionButtonLabel="Print"
        actionButtonFunction={handlePrint}
        actionButtonLoading={loading}
        content={
          <Form fluid>
            <MyInput
              fieldType="select"
              fieldLabel="Language"
              fieldName="lang"
              selectData={LANG_OPTIONS}
              record={record}
              setRecord={setRecord}
              searchable={false}
              cleanable={false}
              width="100%"
            />
          </Form>
        }
      />
    </>
  );
};

export default ProcedureReportButton;
