import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  useGetDownloadUrlMutation,
  useGetEncounterAttachmentsByEncounterIdsQuery
} from '@/services/encounters/attachmentsService';
import { useGetEncountersByPatientQuery } from '@/services/encounters/patientEncounterService';
import { useLazyGetDentalTreatmentPlanPdfQuery } from '@/services/reports/dentalTreatmentPlanReportService';
import './PrintTreatmentPlan.less';

const fileIsImage = (file: any) => String(file?.mimeType || '').startsWith('image/');

const AttachmentChoice = ({
  file,
  checked,
  onToggle
}: {
  file: any;
  checked: boolean;
  onToggle: (id: number, checked: boolean) => void;
}) => {
  const [getDownloadUrl] = useGetDownloadUrlMutation();
  const [src, setSrc] = useState('');
  const [previewError, setPreviewError] = useState('');
  const image = fileIsImage(file);

  useEffect(() => {
    if (!image || !file?.id) return undefined;
    let cancelled = false;
    getDownloadUrl(file.id)
      .unwrap()
      .then(ticket => {
        if (!cancelled) setSrc(ticket?.url || '');
      })
      .catch(() => {
        if (!cancelled) setPreviewError('Preview unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, [file?.id, getDownloadUrl, image]);

  return (
    <label className="plan-report-choice">
      <Checkbox
        checked={checked}
        disabled={!image}
        onChange={(_value, next) => onToggle(Number(file.id), next)}
      />
      {src ? <img src={src} alt="" /> : <span className="plan-report-empty">{image ? '…' : 'File'}</span>}
      <span className="plan-report-choice-copy">
        <strong>{file.filename || 'Attachment'}</strong>
        <span>{file.details || (image ? 'Image' : 'Not included as an image')}</span>
        {previewError ? <span>{previewError}</span> : null}
      </span>
    </label>
  );
};

const reportErrorMessage = (error: any) => {
  const key = String(error?.data?.message || '').replace(/^error\./, '');
  const known: Record<string, string> = {
    attachment_unavailable: 'A selected file is not available and was not included.',
    attachment_forbidden: 'A selected file cannot be included for this patient or your permission.',
    attachment_not_image: 'A selected file cannot be printed as an image.',
    attachment_unreadable: 'A selected image could not be loaded and was not included.',
    notfound: 'The treatment plan could not be found.'
  };
  return known[key] || 'Could not generate the treatment plan report.';
};

const PrintTreatmentPlanModal = ({
  open,
  plan,
  patient,
  direction,
  onClose
}: {
  open: boolean;
  plan: any | null;
  patient: any;
  direction: string;
  onClose: () => void;
}) => {
  const dispatch = useAppDispatch();
  const [selected, setSelected] = useState<Record<number, boolean>>({});
  const [showOthers, setShowOthers] = useState(false);
  const [busy, setBusy] = useState(false);
  const patientId = Number(patient?.id ?? patient?.key ?? plan?.patientId);
  const originId = Number(plan?.originEncounterId);
  const planId = Number(plan?.id);

  const originFilesQuery = useGetEncounterAttachmentsByEncounterIdsQuery(
    { encounterIds: [originId] },
    { skip: !open || !originId }
  );
  const encountersQuery = useGetEncountersByPatientQuery(
    { patientId, page: 0, size: 100, sort: 'createdDate,desc' },
    { skip: !open || !showOthers || !patientId }
  );
  const otherIds = useMemo(
    () =>
      (encountersQuery.data?.data ?? [])
        .map((row: any) => Number(row.id))
        .filter(id => id && id !== originId),
    [encountersQuery.data, originId]
  );
  const otherFilesQuery = useGetEncounterAttachmentsByEncounterIdsQuery(
    { encounterIds: otherIds },
    { skip: !open || !showOthers || otherIds.length === 0 }
  );
  const [requestPdf] = useLazyGetDentalTreatmentPlanPdfQuery();

  useEffect(() => {
    setSelected({});
    setShowOthers(false);
  }, [planId]);

  const files = [
    ...(originFilesQuery.data ?? []),
    ...(showOthers ? otherFilesQuery.data ?? [] : [])
  ].filter((file, index, list) => list.findIndex(item => item.id === file.id) === index);

  const toggle = (id: number, checked: boolean) => {
    setSelected(current => ({ ...current, [id]: checked }));
  };

  const generate = async () => {
    if (!planId) return;
    setBusy(true);
    const chosen = Object.entries(selected)
      .filter(([, checked]) => checked)
      .map(([id]) => Number(id));
    const chosenFiles = files.filter(file => chosen.includes(Number(file.id)));
    const nonImages = chosenFiles.filter(file => !fileIsImage(file));
    if (nonImages.length) {
      dispatch(notify({
        msg: nonImages
          .map(file => `${file.filename || 'A selected file'} cannot be printed as an image.`)
          .join(' '),
        sev: 'warning'
      }));
      setBusy(false);
      return;
    }

    try {
      const blob = await requestPdf({
        planId,
        lang: String(direction).toLowerCase() === 'rtl' ? 'ar' : 'en',
        attachmentIds: chosenFiles.map(file => Number(file.id))
      }).unwrap();
      const fileURL = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));
      const win = window.open(fileURL, '_blank');
      if (!win) {
        dispatch(notify({ msg: 'Popup blocked. Please allow popups for this site.', sev: 'warning' }));
        return;
      }
      win.focus();
      onClose();
    } catch (error) {
      dispatch(notify({ msg: reportErrorMessage(error), sev: 'error' }));
    } finally {
      setBusy(false);
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={(next: boolean) => {
        if (!next) onClose();
      }}
      title={<Translate>Print Plan</Translate>}
      size="md"
      bodyheight="auto"
      actionButtonLabel="Generate Report"
      actionButtonLoading={busy}
      isDisabledActionBtn={busy}
      actionButtonFunction={generate}
      content={
        <div className="plan-report-modal">
          <p className="plan-report-note">
            <Translate>
              No images are included unless you select them. The report prints only this plan.
            </Translate>
          </p>
          <MyButton appearance="ghost" onClick={() => setShowOthers(true)} disabled={showOthers}>
            <Translate>Other encounters for this patient</Translate>
          </MyButton>
          <div className="plan-report-list">
            {files.length === 0 ? (
              <div className="plan-report-empty">
                <Translate>No attachments are available for the origin encounter.</Translate>
              </div>
            ) : (
              files.map(file => (
                <AttachmentChoice
                  key={file.id}
                  file={file}
                  checked={Boolean(selected[file.id])}
                  onToggle={toggle}
                />
              ))
            )}
          </div>
        </div>
      }
    />
  );
};

export default PrintTreatmentPlanModal;
