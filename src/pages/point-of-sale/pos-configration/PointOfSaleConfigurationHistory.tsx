import React from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

import {
  useGetPointOfSaleHistoryQuery,
} from '@/services/point-of-sale/PointOfSaleCheckInService';

import { formatDateWithoutSeconds } from '@/utils';

type Props = {
  open: boolean;
  setOpen: (value: boolean) => void;
  configuration: any;
};

const PointOfSaleConfigurationHistory = ({
  open,
  setOpen,
  configuration,
}: Props) => {
console.log("Configration id",configuration)
  const {
    data: history = [],
    isFetching,
  } = useGetPointOfSaleHistoryQuery(
    {
      configurationId:
        configuration?.id,
      page: 0,
      size: 50,
      sort: 'checkInDate,desc',
    },
    {
      skip: !configuration?.id,
    }
  );
console.log("history",history)
  const columns = [
    {
      key: 'userLogin',
      title: <Translate>User</Translate>,
      flexGrow: 2,
    },
    {
      key: 'checkInDate',
      title: <Translate>Check In</Translate>,
      flexGrow: 2,
      render: (row: any) =>
        row.checkInDate
          ? formatDateWithoutSeconds(
              row.checkInDate
            )
          : '-',
    },
    {
      key: 'checkOutDate',
      title: <Translate>Check Out</Translate>,
      flexGrow: 2,
      render: (row: any) =>
        row.checkOutDate
          ? formatDateWithoutSeconds(
              row.checkOutDate
            )
          : '-',
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (row: any) => (
        <MyBadgeStatus
          contant={
            row.active
              ? 'ACTIVE'
              : 'CHECKED OUT'
          }
          color={
            row.active
              ? '#0DAA41'
              : '#D64545'
          }
        />
      ),
    },
    {
      key: 'created',
      title: (
        <Translate>
          Created By / At
        </Translate>
      ),
      expandable: true,
      render: (row: any) => (
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
      ),
    },
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={`POS History - ${
        configuration?.name ?? ''
      }`}
      hideActionBtn
      size="70vw"
      content={
        <MyTable
          columns={columns}
          data={history}
          loading={isFetching}
          page={0}
          rowsPerPage={50}
          totalCount={history.length}
        
        />
      }
    />
  );
};

export default PointOfSaleConfigurationHistory;