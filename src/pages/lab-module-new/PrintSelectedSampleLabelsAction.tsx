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

  const handleOpenModal = () => {
    setCopies({ copies: 1 } as any);
    setOpenPrintModal(true);
  };

  const handleCloseModal = () => {
    setOpenPrintModal(false);
    setCopies({ copies: 1 } as any);
  };

  const onPrint = async () => {
    try {
      const safeCopies = !copies || copies.copies < 1 ? 1 : copies.copies;

      const { blob, missingDefinitionTests } = await trigger({
        orderTestIds,
        copies: safeCopies,
        lang: selectedLang?.lang
      }).unwrap();

      if (missingDefinitionTests?.length) {
        dispatch(
          notify({
            msg: `Not printed (no collected sample or missing analyzer/tube setup): ${missingDefinitionTests.join(', ')}`,
            sev: 'warning'
          })
        );
      }

      if (!blob) {
        if (!missingDefinitionTests?.length) {
          dispatch(
            notify({
              msg: 'No collected sample found for the selected tests',
              sev: 'warning'
            })
          );
        }
        return;
      }

      const url = window.URL.createObjectURL(
        new Blob([blob], { type: 'application/pdf' })
      );

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
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error'
        })
      );
    }
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
    </>
  );
}
