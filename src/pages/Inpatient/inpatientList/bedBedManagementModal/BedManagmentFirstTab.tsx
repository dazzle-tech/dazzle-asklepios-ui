import DetailsCard from '@/components/DetailsCard';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import {
  useCountActiveBedsQuery,
  useCountEmptyBedsQuery,
  useCountInCleaningBedsQuery,
  useCountOccupiedBedsQuery,
  useCountOutOfServiceBedsQuery,
  useGetBedsByDepartmentIdQuery,
  useMarkBedAsOutOfServiceMutation,
  useMarkBedAsReadyMutation
} from '@/services/setup/room/bedService';
import { notify } from '@/utils/uiReducerActions';
import {
  faBed,
  faBroom,
  faExclamationTriangle,
  faStopCircle,
  faThumbsUp,
  faUser
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Form, Tooltip, Whisper } from 'rsuite';
import './bedcard.less';
import BedCards from './BedCards';
import { formatEnumString } from '@/utils';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';

const BedManagmentFirstTab = ({ departmentKey }) => {
  const mode = useSelector((state: any) => state.ui.mode);
  const dispatch = useAppDispatch();
  const [markBedAsOutOfService] = useMarkBedAsOutOfServiceMutation();
  const [markBedAsReady] = useMarkBedAsReadyMutation();
  const [viewMode] = useState('table');

  const [bedPagination, setBedPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const {
    data: bedsResponse,
    refetch,
    isFetching,
    isLoading
  } = useGetBedsByDepartmentIdQuery(
    {
      departmentId: departmentKey,
      page: bedPagination.page,
      size: bedPagination.size,
      sort: bedPagination.sort
    },
    { skip: !departmentKey }
  );

  const { data: totalBeds = 0 } = useCountActiveBedsQuery(
    { departmentId: departmentKey },
    { skip: !departmentKey }
  );

  const { data: occupiedBeds = 0 } = useCountOccupiedBedsQuery(
    { departmentId: departmentKey },
    { skip: !departmentKey }
  );

  const { data: availableBeds = 0 } = useCountEmptyBedsQuery(
    { departmentId: departmentKey },
    { skip: !departmentKey }
  );

  const { data: outOfServiceBeds = 0 } = useCountOutOfServiceBedsQuery(
    { departmentId: departmentKey },
    { skip: !departmentKey }
  );

  const { data: inCleaning = 0 } = useCountInCleaningBedsQuery(
    { departmentId: departmentKey },
    { skip: !departmentKey }
  );

  const bedsData = bedsResponse?.data ?? [];

  const handleChangeToOutService = (bed: any) => {
    markBedAsOutOfService({ id: bed?.id })
      .unwrap()
      .then(() => {
        dispatch(notify('Bed Out of Service'));
        refetch();
      })
      .catch(() => {
        dispatch(notify('Failed to Change Bed Status'));
      });
  };

  const handleChangeToReady = (bed: any) => {
    markBedAsReady({ id: bed?.id })
      .unwrap()
      .then(() => {
        dispatch(notify('Bed Ready'));
        refetch();
      })
      .catch(() => {
        dispatch(notify('Failed to Change Bed Status'));
      });
  };

  const tableColumns = [
    {
      key: 'roomName',
      title: <Translate>roomName</Translate>,
      render: rowData => rowData?.room?.name
    },
    {
      key: 'bedName',
      title: <Translate>Bed Name</Translate>,
      fullText: true,
      render: rowData => rowData?.name
    },
    {
      key: 'bedStatus',
      title: <Translate>Status</Translate>,
      render: rowData => {
        const status = rowData?.status;
        if (!status) return '-';

        let color = 'var(--primary-gray)';

        if (status === 'EMPTY') {
          color = '#28a745';
        } else if (status === 'OCCUPIED') {
          color = '#1b9cd7';
        } else if (status === 'OUT_OF_SERVICE') {
          color = '#dc3545';
        } else if (status === 'IN_CLEANING') {
          color = '#ff8902ff';
        }

        return (
          <MyBadgeStatus
            color={color}
            contant={formatEnumString(status)}
          />
        );
      }
    },
    {
      key: 'actions',
      title: '',
      render: rowData => {
        const deactivate = <Tooltip>Out of service</Tooltip>;
        const ready = <Tooltip>Ready</Tooltip>;

        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {(rowData?.status === 'EMPTY' || rowData?.status === 'IN_CLEANING') && (
              <Whisper trigger="hover" placement="top" speaker={deactivate}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      handleChangeToOutService(rowData);
                    }}
                  >
                    <FontAwesomeIcon icon={faStopCircle} />
                  </MyButton>
                </div>
              </Whisper>
            )}

            {(rowData?.status === 'IN_CLEANING' || rowData?.status === 'OUT_OF_SERVICE') && (
              <Whisper trigger="hover" placement="top" speaker={ready}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      handleChangeToReady(rowData);
                    }}
                  >
                    <FontAwesomeIcon icon={faThumbsUp} />
                  </MyButton>
                </div>
              </Whisper>
            )}
          </Form>
        );
      }
    }
  ];

  return (
    <>
      <div className="statistics-container">
        <DetailsCard
          title="Total Beds"
          number={totalBeds}
          icon={faBed}
          color={mode === 'light' ? 'black' : 'white'}
          position="left"
          width={250}
        />

        <DetailsCard
          title="Occupied"
          number={occupiedBeds}
          icon={faUser}
          color="#1b9cd7"
          backgroundClassName="occupied"
          position="left"
          width={250}
        />

        <DetailsCard
          title="Empty"
          number={availableBeds}
          icon={faBed}
          color="#28a745"
          backgroundClassName="available"
          position="left"
          width={250}
        />

        <DetailsCard
          title="Out of service"
          number={outOfServiceBeds}
          icon={faExclamationTriangle}
          color="#dc3545"
          backgroundClassName="critical"
          position="left"
          width={250}
        />

        <DetailsCard
          title="In cleaning"
          number={inCleaning}
          icon={faBroom}
          color="var(--primary-orange)"
          backgroundClassName="cleaning"
          position="left"
          width={250}
        />
      </div>
      <MyTable
        height={400}
        data={bedsData}
        columns={tableColumns}
        loading={isFetching || isLoading}
        page={bedPagination.page}
        rowsPerPage={bedPagination.size}
        totalCount={bedsResponse?.totalCount ?? 0}
        onPageChange={(_: unknown, newPage: number) => {
          setBedPagination(prev => ({
            ...prev,
            page: newPage
          }));
        }}
        onRowsPerPageChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          setBedPagination(prev => ({
            ...prev,
            size: parseInt(event.target.value, 10),
            page: 0
          }));
        }}
      />

    </>
  );
};

export default BedManagmentFirstTab;