import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { Whisper, Tooltip, Form } from 'rsuite';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { useLazyGetOrderSampleLabelPdfQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';

export default function PrintOrderSampleLabelAction({
  rowData,
}: {
  rowData: any;
}) {
  const dispatch = useAppDispatch();

  const [trigger, { isFetching }] =
    useLazyGetOrderSampleLabelPdfQuery();

  const [openPrintModal, setOpenPrintModal] = useState(false);

  const [copies, setCopies] = useState<any>({
    copies: 1,
  });

  const [selectedLang, setSelectedLang] = useState<{
    lang: 'en' | 'ar';
  }>({
    lang: 'en',
  });

  const handleOpenModal = (e: any) => {
    e.stopPropagation();

    setCopies({
      copies: 1,
    });

    setOpenPrintModal(true);
  };

  const handleCloseModal = () => {
    setOpenPrintModal(false);

    setCopies({
      copies: 1,
    });
  };

  const onPrint = async () => {
    try {
      const safeCopies =
        !copies || copies.copies < 1 ? 1 : copies.copies;

      const result = await trigger({
        orderId: rowData.id,
        copies: safeCopies,
        lang: selectedLang.lang,
      }).unwrap();

      if (!result) {
        dispatch(
          notify({
            msg: 'No collected samples found',
            sev: 'warning',
          })
        );

        return;
      }

      const url = window.URL.createObjectURL(
        new Blob([result], {
          type: 'application/pdf',
        })
      );

      const printWindow = window.open(
        url,
        '_blank'
      );

      if (printWindow) {
        printWindow.onload = () => {
          printWindow.focus();
        };

        handleCloseModal();
      } else {
        dispatch(
          notify({
            msg:
              'Please allow pop-ups to preview the sample labels',
            sev: 'warning',
          })
        );
      }

      setTimeout(
        () => window.URL.revokeObjectURL(url),
        60_000
      );
    } catch (err: any) {
      dispatch(
        notify({
          msg:
            err?.data?.message ||
            'Print order sample label failed',
          sev: 'error',
        })
      );
    }
  };

  return (
    <>
      <Whisper
        placement="top"
        trigger="hover"
        speaker={
          <Tooltip>
            Print Order Sample Labels
          </Tooltip>
        }
      >
        <span
          style={{
            display: 'inline-block',
          }}
        >
          <FontAwesomeIcon
            icon={faBarcode}
            className="icon-laboratory-size"
            style={{
              fontSize: '1em',
              cursor: isFetching
                ? 'wait'
                : 'pointer',
              opacity: isFetching
                ? 0.6
                : 1,
            }}
            onClick={handleOpenModal}
          />
        </span>
      </Whisper>

      <MyModal
        open={openPrintModal}
        setOpen={setOpenPrintModal}
        title="Print Order Sample Labels"
        size="xs"
        actionButtonLabel="Print"
        actionButtonLoading={isFetching}
        actionButtonFunction={onPrint}
        bodyheight="30vh"
        content={
          <Form fluid>
            <MyInput
              fieldLabel="Language"
              fieldName="lang"
              fieldType="select"
              selectData={[
                {
                  label: 'English',
                  value: 'en',
                },
                {
                  label: 'Arabic',
                  value: 'ar',
                },
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
        }
      />
    </>
  );
}