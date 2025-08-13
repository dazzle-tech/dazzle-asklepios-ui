import React, { useState } from 'react';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStopCircle, faThumbsUp, faTable } from '@fortawesome/free-solid-svg-icons';
import { faIdCard } from '@fortawesome/free-solid-svg-icons';
import { notify } from '@/utils/uiReducerActions';
import { Form, Tooltip, Whisper } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import BedCards from './BedCards';
import { useSaveBedMutation, useFetchBedsRelatedToDepartmentQuery } from '@/services/setupService';
import Translate from '@/components/Translate';
import './BedManagmentFirstTab.less';

const BedManagmentFirstTab = ({ departmentKey }) => {
  const dispatch = useAppDispatch();
  const [saveBed] = useSaveBedMutation();
  const [viewMode, setViewMode] = useState('table'); // view mode state

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

  return (
    <div>
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
    </div>
  );
};

export default BedManagmentFirstTab;
