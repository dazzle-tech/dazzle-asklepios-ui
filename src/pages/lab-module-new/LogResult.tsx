import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetLabResultLogsByResultIdQuery } from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { useGetLovAllValuesQuery } from '@/services/setupService';
import { initialListRequestAllValues } from '@/types/types';
import { formatDateWithoutSeconds } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import React from 'react';

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


  const { data: allLovValues } =
    useGetLovAllValuesQuery({ ...initialListRequestAllValues });

  const resolveLovValue = (value: any) => {
    if (!value || !allLovValues?.object) return value;

    const lov = allLovValues.object.find(
      (l: any) => String(l.key) === String(value)
    );

    return lov?.lovDisplayVale ?? value;
  };


  const columns = [
    {
      key: 'result',
      title: <Translate>RESULT</Translate>,
      flexGrow: 1.5,
      render: (row: any) =>
        resolveLovValue(row.resultValue) ?? '-',
    },
    {
      key: 'time',
      title: <Translate>TIME</Translate>,
      flexGrow: 1,
      render: (row: any) =>
        formatDateWithoutSeconds(row.resultDate),
    },
    {
      key: 'resultbyat',
      title: <Translate>LOG</Translate>,
      flexGrow: 2,
      fullText: true,
      render: (row: any) => {
        if (!row.resultBy) return null;

        return (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {row.resultBy}
          </div>
        );
      }
    }
  ];

// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (

  <div dir={dir}>
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
  </div>
  );
};

export default LogResult;
