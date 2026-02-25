import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import {
  useGetRadiologyImageStatusLogQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import React from 'react';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  report?: any;
};

const RadiologyImageLogModal = ({ open, setOpen, report }: Props) => {

  const { data, isFetching } =
    useGetRadiologyImageStatusLogQuery(
      report?.id ?? skipToken
    );

  const columns = [
    {
      key: 'status',
      title: <Translate>IMAGE STATUS</Translate>,
      flexGrow: 1,
      render: (row: any) =>
        formatEnumString(row.statusValue),
    },
    {
      key: 'date',
      title: <Translate>DATE</Translate>,
      flexGrow: 1,
      render: (row: any) =>
        formatDateWithoutSeconds(row.statusDate),
    },
    {
      key: 'by',
      title: <Translate>BY</Translate>,
      flexGrow: 1,
      render: (row: any) => row.statusBy ?? '—',
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Image Status Logs"
      size="40vw"
      position="right"
      content={
        <MyTable
          height={400}
          loading={isFetching}
          data={data ?? []}
          columns={columns}
        />
      }
    />
  );
};

export default RadiologyImageLogModal;
