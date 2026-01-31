import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { skipToken } from '@reduxjs/toolkit/query';
import { formatDateWithoutSeconds } from '@/utils';

import { useGetLabResultLogsByResultIdQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  result?: any;
};

const LogResult = ({ open, setOpen, result }: Props) => {

  const {
    data: logs,
    isFetching
  } = useGetLabResultLogsByResultIdQuery(
    result?.id ?? skipToken
  );

const columns = [
  {
    key: 'result',
    title: <Translate>RESULT</Translate>,
    flexGrow: 1.5,
    render: (row: any) =>
      row.resultId ?? '-',
  },
  {
    key: 'time',
    title: <Translate>TIME</Translate>,
    flexGrow: 1,
    render: (row: any) =>
      formatDateWithoutSeconds(row.resultDate),
  },
  {
    key: 'log',
    title: <Translate>LOG</Translate>,
    flexGrow: 2,
    fullText: true,
    render: (row: any) => (
      <>
        <strong>{row.action}</strong>
        {row.createdBy && (
          <span style={{ color: '#666', marginLeft: 6 }}>
            by {row.createdBy}
          </span>
        )}
      </>
    ),
  },
];


  console.log("logs", logs);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Result Logs"
      size="40vw"
      position='right'
      content={
        <MyTable
          height={400}
          loading={isFetching}
          data={logs ?? []}
          columns={columns}
        />
      }
    />
  );
};

export default LogResult;
