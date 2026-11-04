import React, { useState } from 'react';
import { Form, Panel } from 'rsuite';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds } from '@/utils';

import {
  useCheckInPointOfSaleMutation,
  useCheckOutPointOfSaleMutation,
  useGetCurrentPointOfSaleCheckInQuery,
} from '@/services/point-of-sale/PointOfSaleCheckInService';

import {
  useGetPointOfSaleConfigurationsQuery,
} from '@/services/point-of-sale/PointOfSaleConfigurationService';
import MyTable from '@/components/MyTable';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

import {
  useGetPointOfSaleHistoryQuery,
} from '@/services/point-of-sale/PointOfSaleCheckInService';
import './styles.less';

const PointOfSaleCheckIn = () => {
  const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
  const userlogin = authSlice.user?.login;

  const [openCheckInModal, setOpenCheckInModal] =
    useState(false);

  const [record, setRecord] = useState({
    configurationId: null,
  });

  const {
    data: currentCheckIn,
    refetch,
  } = useGetCurrentPointOfSaleCheckInQuery();



  const [checkIn] =
    useCheckInPointOfSaleMutation();

  const [checkOut] =
    useCheckOutPointOfSaleMutation();
const {
  data: configurations = [],
} = useGetPointOfSaleConfigurationsQuery({
  isActive: true,
});
const {
  data: history = [],
  isFetching: historyLoading,
} = useGetPointOfSaleHistoryQuery({
  userLogin: userlogin,
  page: 0,
  size: 20,
  sort: 'checkInDate,desc',
});
  const checkedIn =
    currentCheckIn?.active === true;

  const handleCheckIn = async () => {
    if (!record.configurationId) {
      dispatch(
        notify({
          msg: 'Please select POS device',
          sev: 'warning',
        })
      );
      return;
    }

    try {
      await checkIn(
        Number(record.configurationId)
      ).unwrap();

      dispatch(
        notify({
          msg: 'Checked in successfully',
          sev: 'success',
        })
      );

      setOpenCheckInModal(false);

      refetch();
    } catch (e: any) {
      dispatch(
        notify({
          msg:
            e?.data?.detail ||
            'Check in failed',
          sev: 'error',
        })
      );
    }
  };

  const handleCheckOut = async () => {
    try {
      await checkOut().unwrap();

      dispatch(
        notify({
          msg: 'Checked out successfully',
          sev: 'success',
        })
      );

      refetch();
    } catch {
      dispatch(
        notify({
          msg: 'Check out failed',
          sev: 'error',
        })
      );
    }
  };

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const isRTL = direction === 'RTL';
const historyColumns = [
  {
    key: 'userLogin',
    title: <Translate>USER</Translate>,
    flexGrow: 2,
  },
  {
    key: 'configurationName',
    title: <Translate>POS DEVICE</Translate>,
    flexGrow: 2,
  },
  {
    key: 'checkInDate',
    title: <Translate>CHECK IN</Translate>,
    flexGrow: 2,
    render: (row: any) =>
      row?.checkInDate
        ? formatDateWithoutSeconds(
            row.checkInDate
          )
        : '-',
  },
  {
    key: 'checkOutDate',
    title: <Translate>CHECK OUT</Translate>,
    flexGrow: 2,
    render: (row: any) =>
      row?.checkOutDate
        ? formatDateWithoutSeconds(
            row.checkOutDate
          )
        : '-',
  },
  {
    key: 'status',
    title: <Translate>STATUS</Translate>,
    flexGrow: 1,
    render: (row: any) => (
      <MyBadgeStatus
        contant={
          row?.active
            ? 'ACTIVE'
            : 'CHECKED OUT'
        }
        color={
          row?.active
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
        CREATED BY / AT
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
    <div
      className="pos-check-in-page"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <Panel bordered className="pos-status-card">
        <div className="pos-header">

          <div>
            <h4>
              <Translate>
                Point Of Sale Session
              </Translate>
            </h4>
          </div>

          <div>
            <MyBadgeStatus
              contant={
                checkedIn
                  ? 'ACTIVE'
                  : 'NOT CHECKED IN'
              }
              color={
                checkedIn
                  ? '#0DAA41'
                  : '#D64545'
              }
            />
          </div>

        </div>

        <div className="pos-info-grid">

          <div className="info-item">
            <label>User</label>
            <div>
              {currentCheckIn?.userLogin ??
                '-'}
            </div>
          </div>

          <div className="info-item">
            <label>POS Device</label>
            <div>
              {currentCheckIn?.configurationName ??
                '-'}
            </div>
          </div>

          <div className="info-item">
            <label>Check In Time</label>
            <div>
              {currentCheckIn?.checkInDate
                ? formatDateWithoutSeconds(
                    currentCheckIn.checkInDate
                  )
                : '-'}
            </div>
          </div>

        </div>

        <div className="pos-actions">

          <MyButton
            disabled={checkedIn}
            onClick={() =>
              setOpenCheckInModal(true)
            }
          >
            Check In
          </MyButton>

          <MyButton
            color="var(--primary-pink)"
            disabled={!checkedIn}
            onClick={handleCheckOut}
          >
            Check Out
          </MyButton>

        </div>

      </Panel>
<div style={{ marginTop: '20px' }}>

  <MyTable
    columns={historyColumns}
    data={history}
    loading={historyLoading}
    page={0}
    rowsPerPage={20}
    totalCount={history?.length ?? 0}
  />

</div>
      <MyModal
        open={openCheckInModal}
        setOpen={setOpenCheckInModal}
        title="POS Check In"
        actionButtonLabel="Check In"
        actionButtonFunction={handleCheckIn}
        size="30vw"
        content={
          <Form fluid>

            <MyInput
              width="100%"
              fieldName="configurationId"
              fieldLabel="POS Device"
              fieldType="select"
              record={record}
              setRecord={setRecord}
              selectData={configurations}
              selectDataLabel="name"
              selectDataValue="id"
             
            />

          </Form>
        }
      />
    </div>
  );
};

export default PointOfSaleCheckIn;