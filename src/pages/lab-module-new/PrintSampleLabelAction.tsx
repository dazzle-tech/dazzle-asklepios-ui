import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { Whisper, Tooltip, InputNumber, Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import MyModal from '@/components/MyModal/MyModal';
import MyButton from '@/components/MyButton/MyButton';

import { useLazyGetSampleLabelsPdfQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';
import MyInput from '@/components/MyInput';

export default function PrintSampleLabelAction({ rowData }: { rowData: any }) {
  const dispatch = useAppDispatch();

  const [trigger, { isFetching }] = useLazyGetSampleLabelsPdfQuery();

  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [copies, setCopies] = useState({copies: 1} as any);

  const handleOpenModal = (e: any) => {
    e.stopPropagation();
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

      const result = await trigger({
        orderTestId: rowData.id,
        copies: safeCopies,
      }).unwrap();

      if (!result) {
        dispatch(
          notify({
            msg: 'No collected sample found',
            sev: 'warning',
          })
        );
        return;
      }

      const url = window.URL.createObjectURL(
        new Blob([result], { type: 'application/pdf' })
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
            msg: 'Please allow pop-ups to preview the sample label',
            sev: 'warning',
          })
        );
      }

      setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.message || 'Print failed',
          sev: 'error',
        })
      );
    }
  };

  return (
    <>
      <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print Sample Label</Tooltip>}>
        <span style={{ display: 'inline-block' }}>
          <FontAwesomeIcon
            icon={faBarcode}
            className="icon-laboratory-size"
            style={{
              fontSize: '1em',
              cursor: isFetching ? 'wait' : 'pointer',
              opacity: isFetching ? 0.6 : 1,
            }}
            onClick={handleOpenModal}
          />
        </span>
      </Whisper>

      <MyModal
        open={openPrintModal}
        setOpen={setOpenPrintModal}
        title="Print Sample Label"
        size="xs"
        actionButtonLabel='Print'
        actionButtonLoading={isFetching}
        actionButtonFunction={onPrint}
        bodyheight={'30vh'}
        content={
          <>
            <Form>
              <MyInput
                fieldLabel="Number of label copies"
                fieldName="copies"
                fieldType="number"
                record={copies }
                setRecord={setCopies}
              />
            </Form></>
        }
      />

    </>
  );
}