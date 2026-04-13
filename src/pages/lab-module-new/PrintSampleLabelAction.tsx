import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { Whisper, Tooltip } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import { useLazyGetSampleLabelPdfQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService';

export default function PrintSampleLabelAction({ rowData }: { rowData: any }) {
  const dispatch = useAppDispatch();
  const [trigger, { isFetching }] = useLazyGetSampleLabelPdfQuery();
const onPrint = async (e: any) => {
  e.stopPropagation();

  try {
    const result = await trigger({ orderTestId: rowData.id }).unwrap();

    if (!result) {
      dispatch(
        notify({
          msg: 'No collected sample found',
          sev: 'warning'
        })
      );
      return;
    }

    const url = window.URL.createObjectURL(
      new Blob([result], { type: 'application/pdf' })
    );

    window.open(url, '_blank', 'noopener,noreferrer');

    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
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
    <Whisper placement="top" trigger="hover" speaker={<Tooltip>Print Sample Label</Tooltip>}>
      <span style={{ display: 'inline-block' }}>
        <FontAwesomeIcon
          icon={faBarcode}
          className="icon-laboratory-size"
          style={{
            fontSize: '1em',
            cursor: isFetching ? 'wait' : 'pointer',
            opacity: isFetching ? 0.6 : 1
          }}
          onClick={onPrint}
        />
      </span>
    </Whisper>
  );
}