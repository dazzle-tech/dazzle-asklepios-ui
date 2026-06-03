import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import {
  useGetRadiologyImageStatusLogQuery
} from '@/services/setup/diagnosticTest/diagnosticOrderTestReportService';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import React from 'react';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

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
      render: (row: any) => <UserDateCell login={row.statusBy} />
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
      title="Image Status Logs"
      size="40vw"
      position="right"
      content={<div dir={dir}>
        <MyTable
          height={400}
          loading={isFetching}
          data={data ?? []}
          columns={columns}
        />
        </div>
      }
    />
  </div>
  );
};

export default RadiologyImageLogModal;
