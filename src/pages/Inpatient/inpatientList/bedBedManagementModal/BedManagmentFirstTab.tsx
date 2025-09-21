import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { useFetchBedsRelatedToDepartmentQuery, useSaveBedMutation } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import {
  faBed,
  faExclamationTriangle,
  faIdCard,
  faStopCircle,
  faTable,
  faThumbsUp,
  faUser,
  faBroom
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { Form, Tooltip, Whisper } from 'rsuite';
import BedCards from './BedCards';
import './BedManagmentFirstTab.less';

const BedManagmentFirstTab = ({ data = [], departmentKey }) => {
  const dispatch = useAppDispatch();
  const [saveBed] = useSaveBedMutation();
  const [viewMode, setViewMode] = useState('table'); // view mode state

  // Sort data to show occupied beds first
  const sortedData = [...data].sort((a, b) => {
    const statusA = a?.bed?.statusLvalue?.lovDisplayVale || a?.bed?.statusLkey || '';
    const statusB = b?.bed?.statusLvalue?.lovDisplayVale || b?.bed?.statusLkey || '';

    if (statusA.toLowerCase() === 'occupied' && statusB.toLowerCase() !== 'occupied') {
      return -1;
    }
    if (statusA.toLowerCase() !== 'occupied' && statusB.toLowerCase() === 'occupied') {
      return 1;
    }
    return 0;
  });
  const {
    data: fetchBedsRelatedToDepartmentResponse,
    refetch,
    isFetching,
    isLoading
  } = useFetchBedsRelatedToDepartmentQuery(
    { resourceKey: departmentKey },
    { skip: !departmentKey }
  );

  // Set bed status to Out of Service
  const handleChangeToOutService = bed => {
    saveBed({
      ...bed,
      statusLkey: '5258592140444674',
      isValid: true
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Bed Out of Service'));
        refetch();
      })
      .catch(() => {
        dispatch(notify('Failed to Change Bed Status'));
      });
  };

  // Set bed status to Ready
  const handleChangeToReady = bed => {
    saveBed({
      ...bed,
      statusLkey: '5258243122289092',
      isValid: true
    })
      .unwrap()
      .then(() => {
        dispatch(notify('Bed Empty'));
        refetch();
      })
      .catch(() => {
        dispatch(notify('Failed to Change Bed Status'));
      });
  };

  // Table column definitions
  const tableColumns = [
    {
      key: 'roomName',
      title: <Translate>roomName</Translate>,
      render: rowData => rowData?.roomName
    },
    {
      key: 'bedName',
      title: <Translate>Bed Name</Translate>,
      fullText: true,
      render: rowData => rowData?.bed?.name
    },
    {
      key: 'bedStatus',
      title: <Translate>Status</Translate>,
      render: rowData =>
        rowData?.bed.statusLvalue
          ? rowData?.bed.statusLvalue.lovDisplayVale
          : rowData?.bed.statusLkey
    },
    {
      key: 'actions',
      title: '',
      // Action buttons for status change
      render: rowData => {
        const deactivate = <Tooltip>Deactivate</Tooltip>;
        const ready = <Tooltip>Ready</Tooltip>;
        return (
          <Form layout="inline" fluid className="nurse-doctor-form">
            {(rowData?.bed?.statusLkey === '5258572711068224' ||
              rowData?.bed?.statusLkey === '5258243122289092') && (
              <Whisper trigger="hover" placement="top" speaker={deactivate}>
                <div>
                  <MyButton
                    size="small"
                    onClick={() => {
                      handleChangeToOutService(rowData?.bed);
                    }}
                  >
                    <FontAwesomeIcon icon={faStopCircle} />
                  </MyButton>
                </div>
              </Whisper>
            )}
            {(rowData?.bed?.statusLkey === '5258572711068224' ||
              rowData?.bed?.statusLkey === '5258592140444674') && (
              <Whisper trigger="hover" placement="top" speaker={ready}>
                <div>
                  <MyButton
                    size="small"
                    backgroundColor="black"
                    onClick={() => {
                      handleChangeToReady(rowData?.bed);
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

    // Calculate statistics (use latest fetched data)
  const bedsData = fetchBedsRelatedToDepartmentResponse ?? [];

  const totalBeds = bedsData.length;
  const occupiedBeds = bedsData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'occupied';
  }).length;
  const availableBeds = bedsData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'empty';
  }).length;
  const outOfServiceBeds = bedsData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'out of service';
  }).length;
  const inCleaning = bedsData.filter(item => {
    const status = item?.bed?.statusLvalue?.lovDisplayVale || item?.bed?.statusLkey || '';
    return status.toLowerCase() === 'in cleaning';
  }).length;


  return (
    <>
      {/* Toggle view icons */}
      <div className="icons-2">
        <FontAwesomeIcon
          icon={faIdCard}
          className={`fa-table-cells-row-lock-icon ${viewMode === 'card' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: 18 }}
          onClick={() => setViewMode('card')}
        />
        <FontAwesomeIcon
          icon={faTable}
          className={`fa-table-cells-row-unlock-icon ${viewMode === 'table' ? 'active' : ''}`}
          style={{ cursor: 'pointer', fontSize: 18 }}
          onClick={() => setViewMode('table')}
        />
      </div>
      {/* Statistics Cards */}
      <div className="statistics-container">
        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <span className="stat-label">Total Beds</span>
              <span className="stat-value total">{totalBeds}</span>
            </div>
            <div className="stat-icon total">
              <FontAwesomeIcon icon={faBed} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <span className="stat-label">Occupied</span>
              <span className="stat-value occupied">{occupiedBeds}</span>
            </div>
            <div className="stat-icon occupied">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <span className="stat-label">Empty</span>
              <span className="stat-value available">{availableBeds}</span>
            </div>
            <div className="stat-icon available">
              <FontAwesomeIcon icon={faBed} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <span className="stat-label">Out of service</span>
              <span className="stat-value critical">{outOfServiceBeds}</span>
            </div>
            <div className="stat-icon critical">
              <FontAwesomeIcon icon={faExclamationTriangle} />
            </div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-content">
            <div className="stat-text">
              <span className="stat-label">In cleaning</span>
              <span className="stat-value cleaning">{inCleaning}</span>
            </div>
            <div className="stat-icon cleaning">
              <FontAwesomeIcon icon={faBroom} />
            </div>
          </div>
        </div>
      </div>

      {/* View mode switch */}
      {viewMode === 'table' ? (
        <MyTable
          height={600}
          data={fetchBedsRelatedToDepartmentResponse ?? []}
          columns={tableColumns}
          loading={isFetching || isLoading}
        />
      ) : (
        <BedCards
          data={fetchBedsRelatedToDepartmentResponse ?? []}
          handleChangeToReady={handleChangeToReady}
          handleChangeToOutService={handleChangeToOutService}
        />
      )}
    </>
  );
};

export default BedManagmentFirstTab;
