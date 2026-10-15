import React, { useState } from 'react';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';

import { useLazyGetGroupedSampleLabelsPdfQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';

export default function PrintSelectedSampleLabelsAction({
  orderTestIds
}: {
  orderTestIds: number[];
}) {
  const dispatch = useAppDispatch();

  const [trigger, { isFetching }] = useLazyGetGroupedSampleLabelsPdfQuery();

  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [copies, setCopies] = useState({ copies: 1 } as any);
  const [selectedLang, setSelectedLang] = useState<{ lang: 'en' | 'ar' }>({
    lang: 'en'
  });

  // Holds the already-fetched PDF while we block on user confirmation that
  // it's OK some selected tests won't be printed (missing print_number/sample).
  const [pendingBlob, setPendingBlob] = useState<Blob | null>(null);
  const [missingDefinitionNames, setMissingDefinitionNames] = useState<string[]>([]);
  const [confirmMissingOpen, setConfirmMissingOpen] = useState(false);

  const handleOpenModal = () => {
    setCopies({ copies: 1 } as any);
    setOpenPrintModal(true);
  };

  const handleCloseModal = () => {
    setOpenPrintModal(false);
    setCopies({ copies: 1 } as any);
  };

  const openPdf = (blob: Blob) => {
    const url = window.URL.createObjectURL(new Blob([blob], { type: 'application/pdf' }));

    const printWindow = window.open(url, '_blank');

    if (printWindow) {
      printWindow.onload = () => {
        printWindow.focus();
      };

      handleCloseModal();
    } else {
      dispatch(
        notify({
          msg: 'Please allow pop-ups to preview the sample labels',
          sev: 'warning'
        })
      );
    }

    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  };

  const onPrint = async () => {
    try {
      const safeCopies = !copies || copies.copies < 1 ? 1 : copies.copies;

      const { blob, missingDefinitionTests } = await trigger({
        orderTestIds,
        copies: safeCopies,
        lang: selectedLang?.lang
      }).unwrap();

      if (!blob) {
        dispatch(
          notify({
            msg: missingDefinitionTests?.length
              ? `Nothing to print - all selected tests are missing an analyzer or collected sample: ${missingDefinitionTests.join(', ')}`
              : 'No collected sample found for the selected tests',
            sev: 'warning'
          })
        );
        return;
      }

      if (missingDefinitionTests?.length) {
        // Block here instead of just toasting - a toast can go unnoticed once the
        // PDF window grabs focus, and the user needs to know some tests were
        // silently left out so they don't assume everything got printed.
        setPendingBlob(blob);
        setMissingDefinitionNames(missingDefinitionTests);
        setConfirmMissingOpen(true);
        return;
      }

      openPdf(blob);
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error'
        })
      );
    }
  };

  const handleConfirmPrintAnyway = () => {
    setConfirmMissingOpen(false);
    if (pendingBlob) {
      openPdf(pendingBlob);
    }
    setPendingBlob(null);
    setMissingDefinitionNames([]);
  };

  return (
    <>
      <MyButton
        color="var(--deep-blue)"
        onClick={handleOpenModal}
        disabled={!orderTestIds?.length}
      >
        Print Selected
      </MyButton>

      <MyModal
        open={openPrintModal}
        setOpen={setOpenPrintModal}
        title="Print Selected Sample Labels"
        size="xs"
        actionButtonLabel="Print"
        actionButtonLoading={isFetching}
        actionButtonFunction={onPrint}
        bodyheight={'30vh'}
        content={
          <>
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
                fieldLabel="Number of label copies"
                fieldName="copies"
                fieldType="number"
                record={copies}
                setRecord={setCopies}
              />
            </Form>
          </>
        }
      />

      <MyModal
        open={confirmMissingOpen}
        setOpen={setConfirmMissingOpen}
        title="Some tests won't be printed"
        size="40vw"
        bodyheight="auto"
        actionButtonLabel="Print Anyway"
        cancelButtonLabel="Cancel"
        actionButtonFunction={handleConfirmPrintAnyway}
        content={
          <div>
            <p style={{ marginBottom: 12 }}>
              The following tests are missing an analyzer or a collected
              sample, so they will <strong>not</strong> be included:
            </p>
            <ul style={{ margin: 0, paddingInlineStart: 20 }}>
              {missingDefinitionNames.map((name, index) => (
                <li key={index} style={{ marginBottom: 4 }}>
                  {name}
                </li>
              ))}
            </ul>
            <p style={{ marginTop: 12 }}>
              Do you want to continue printing the rest of the selected tests?
            </p>
          </div>
        }
      />
    </>
  );
}
