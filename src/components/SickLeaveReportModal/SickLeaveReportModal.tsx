import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useDispatch } from 'react-redux';
import { usePostSickLeaveReportPdfMutation } from '@/services/reports/sickLeaveReportService';
import { showSystemLoader, hideSystemLoader, notify } from '@/utils/uiReducerActions';
import { useCreatePatientSickLeaveMutation } from '@/services/patients/patientSickLeaveService';

interface SickLeaveReportModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  encounterId: number | null;
}

const SickLeaveReportModal: React.FC<SickLeaveReportModalProps> = ({
  open,
  setOpen,
  encounterId
}) => {
  const dispatch = useDispatch();
  const [postSickLeaveReportPdf] = usePostSickLeaveReportPdfMutation();
  const [createPatientSickLeave] = useCreatePatientSickLeaveMutation();
  const defaultNotes =
    'The above-named patient is advised to rest and refrain from work duties for the duration specified. Please contact the clinic for further clarification if required.';

  const [sickLeaveForm, setSickLeaveForm] = useState<any>({
    fromDate: '',
    toDate: '',
    notes: defaultNotes
  });
  const [language, setLanguage] = useState({ lang: 'en' });
  const [isLoading, setIsLoading] = useState(false);
  const langOptions = [
    { label: 'English', value: 'en' },
    { label: 'Arabic', value: 'ar' }
  ];
  useEffect(() => {
    if (open) {
      setSickLeaveForm({
        fromDate: '',
        toDate: '',
        notes: defaultNotes
      });
      setIsLoading(false);
    }
  }, [open]);

  const handleDownloadSickLeavePdf = async () => {
    if (!encounterId) {
      dispatch(notify({ msg: 'Encounter id is missing', sev: 'error' }));
      return;
    }

    if (!sickLeaveForm.fromDate || !sickLeaveForm.toDate) {
      dispatch(
        notify({
          msg: 'Please enter both start date and end date',
          sev: 'warning'
        })
      );
      return;
    }

    if (new Date(sickLeaveForm.toDate) < new Date(sickLeaveForm.fromDate)) {
      dispatch(
        notify({
          msg: 'End date cannot be earlier than start date',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      setIsLoading(true);
      dispatch(showSystemLoader());

      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      await createPatientSickLeave({
        encounterId,
        startDate: sickLeaveForm.fromDate,
        endDate: sickLeaveForm.toDate,
        notes: sickLeaveForm.notes,
        language: language.lang,
      }).unwrap();

      const blob = await postSickLeaveReportPdf({
        encounterId,
        timezone,
        language: language.lang,
        request: {
          fromDate: sickLeaveForm.fromDate,
          toDate: sickLeaveForm.toDate,
          notes: sickLeaveForm.notes,
        },
      }).unwrap();

      const pdfBlob = new Blob([blob], { type: 'application/pdf' });
      const fileURL = window.URL.createObjectURL(pdfBlob);

      const win = window.open(fileURL, '_blank');


   if (win) {
  win.focus();
  dispatch(notify({ msg: 'Sick leave report PDF opened successfully', sev: 'success' }));
  setOpen(false);
} else {
  dispatch(
    notify({
      msg: 'Popup blocked. Please allow popups for this site.',
      sev: 'warning',
    })
  );
}
    } catch (error: any) {
      console.error('Error while printing sick leave report PDF:', error);

      dispatch(
        notify({
          msg: error?.data?.message || 'Error while printing sick leave report PDF',
          sev: 'error',
        })
      );
    } finally {
      setIsLoading(false);
      dispatch(hideSystemLoader());
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Generate Sick Leave Report"
      size="40vw"
      content={
        <Form fluid>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 180 }}>
              <MyInput
                column
                width="100%"
                fieldType="date"
                fieldLabel="Start Date "
                fieldName="fromDate"
                record={sickLeaveForm}
                setRecord={setSickLeaveForm}
                required
                disablePastDates
              />
            </div>
            <div style={{ flex: 1, minWidth: 180 }}>
              <MyInput
                column
                width="100%"
                fieldType="date"
                fieldLabel="End Date "
                fieldName="toDate"
                disablePastDates
                record={sickLeaveForm}
                setRecord={setSickLeaveForm}
                required
              />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <MyInput
              column
              fieldType="textarea"
              fieldLabel="Notes"
              fieldName="notes"
              record={sickLeaveForm}
              setRecord={setSickLeaveForm}
              placeholder="Enter any notes..."
              width="100%"
            />
          </div>
          <div >
            <MyInput
              fieldLabel="Language"
              fieldName="lang"
              fieldType="select"
              selectData={langOptions}
              record={language}
              setRecord={setLanguage}
            />
          </div>
        </Form>
      }
      actionButtonLabel="Print PDF"
      actionButtonFunction={handleDownloadSickLeavePdf}
      actionButtonLoading={isLoading}
      cancelButtonLabel="Close"
    />
  );
};

export default SickLeaveReportModal;
