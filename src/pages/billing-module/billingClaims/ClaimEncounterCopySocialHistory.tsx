
import React, { useMemo, useState } from 'react';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import Translate from '@/components/Translate';

import {
  useCancelClaimEncounterCopySocialHistoryMutation,
  useGetClaimEncounterCopySocialHistoriesQuery
} from '@/services/billing/claimEncounterCopySocialHistoryService';

import EditClaimEncounterCopySocialHistoryModal from './EditClaimEncounterCopySocialHistoryModal';

const ClaimEncounterCopySocialHistory = ({
  claimEncounterCopyId
}) => {
  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedHistory, setSelectedHistory] =
    useState<any>(null);

  const [editData, setEditData] = useState<any>(null);
  const [openEditModal, setOpenEditModal] = useState(false);

  const [openCancelModal, setOpenCancelModal] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState('');

  const {
    data: socialHistories = [],
    isFetching,
    refetch
  } = useGetClaimEncounterCopySocialHistoriesQuery(
    {
      claimEncounterCopyId,
      showCancelled
    },
    {
      skip: !claimEncounterCopyId
    }
  );

  const [
    cancelSocialHistory,
    { isLoading: isCancelling }
  ] = useCancelClaimEncounterCopySocialHistoryMutation();

  const handleAdd = () => {
    setEditData(null);
    setOpenEditModal(true);
  };

  const handleEdit = (row: any) => {
    setEditData(row);
    setOpenEditModal(true);
  };

  const handleCancel = async () => {
    if (
      !selectedHistory ||
      !cancelReason.trim()
    ) {
      return;
    }

    try {
      await cancelSocialHistory({
        id: selectedHistory.id,
        cancellationReason: cancelReason.trim()
      }).unwrap();

      setOpenCancelModal(false);
      setSelectedHistory(null);
      setCancelReason('');

      refetch();
    } catch {
      return;
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'freeText',
        title: (
          <div style={{ minWidth: 350, width: '100%' }}>
            <Translate>FREE TEXT</Translate>
          </div>
        ),
        minWidth: 350,
        flexGrow: 3,
        render: (row: any) => {
          if (row?.patientIsFree !== true) {
            return '-';
          }

          return (
            <ExpandableText
              text={row?.freeText?.trim() || '-'}
              lines={2}
              maxChars={80}
            />
          );
        }
      },
      {
        key: 'isCurrentSmoker',
        title: 'CURRENT SMOKER',
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.isCurrentSmoker
              ? 'Yes'
              : 'No'
      },
      {
        key: 'smokeStartDate',
        title: 'START DATE',
        render: (row: any) =>
          row.smokeStartDate
            ? new Date(
                row.smokeStartDate
              ).toLocaleDateString()
            : ''
      },
      {
        key: 'cigaretteAmount',
        title: 'AMOUNT',
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.cigaretteAmount ?? ''
      },
      {
        key: 'cigaretteType',
        title: 'CIGARETTE TYPE',
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.cigaretteType || ''
      },
      {
        key: 'isPreviousSmoker',
        title: 'PREVIOUS SMOKER',
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.isPreviousSmoker
              ? 'Yes'
              : 'No'
      },
      {
        key: 'smokeQuitDate',
        title: 'QUIT DATE',
        render: (row: any) =>
          row.smokeQuitDate
            ? new Date(
                row.smokeQuitDate
              ).toLocaleDateString()
            : ''
      },
      {
        key: 'alcoholConsumption',
        title: 'ALCOHOL',
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.alcoholConsumption
              ? 'Yes'
              : 'No'
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        width: 140,
        render: (row: any) => {
          const status = row?.status ?? 'ACTIVE';

          return (
            <MyBadgeStatus
              contant={status}
              color={
                status === 'CANCELLED'
                  ? '#dc3545'
                  : status === 'ACTIVE'
                    ? '#28a745'
                    : '#6c757d'
              }
            />
          );
        }
      },
      {
        key: 'exposureToSecondHandSmoke',
        title: 'SECOND HAND SMOKE',
        expandable: true,
        render: (row: any) =>
          row.patientIsFree === true
            ? '-'
            : row.exposureToSecondHandSmoke
              ? 'Yes'
              : 'No'
      },
      {
        key: 'createdDate',
        title: (
          <Translate>
            CREATED AT / BY
          </Translate>
        ),
        expandable: true,
        render: (row: any) => (
          <UserDateCell
            login={row?.createdBy}
            date={row?.createdDate}
          />
        )
      },
      {
        key: 'lastModifiedDate',
        title: 'UPDATED AT / BY',
        expandable: true,
        render: (row: any) => (
          <UserDateCell
            login={row?.lastModifiedBy}
            date={row?.lastModifiedDate}
          />
        )
      },
      {
        key: 'cancelledDate',
        title: (
          <Translate>
            CANCELLED AT / BY
          </Translate>
        ),
        expandable: true,
        render: (row: any) =>
          row?.status === 'CANCELLED' ? (
            <UserDateCell
              login={row?.cancelledBy}
              date={row?.cancelledDate}
            />
          ) : (
            <span>-</span>
          )
      },
      {
        key: 'cancellationReason',
        title: (
          <Translate>
            CANCELLATION REASON
          </Translate>
        ),
        expandable: true,
        flexGrow: 4,
        render: (row: any) =>
          row?.status === 'CANCELLED' &&
          row?.cancellationReason ? (
            <ExpandableText
              text={row.cancellationReason}
              lines={3}
              maxChars={30}
            />
          ) : (
            '-'
          )
      },
      {
        key: 'actions',
        title: '',
        flexGrow: 1,
        render: (row: any) => (
          <div
            className="flex-gap-12"
            onClick={e => e.stopPropagation()}
          >
            {row.status !== 'CANCELLED' && (
              <MdModeEdit
                size={22}
                fill="var(--primary-gray)"
                className="pointer"
                onClick={e => {
                  e.stopPropagation();
                  handleEdit(row);
                }}
              />
            )}
          </div>
        )
      }
    ],
    []
  );

  const isSelected = (row: any) =>
    selectedHistory?.id === row.id
      ? 'selected-row'
      : '';

  const direction =
    localStorage.getItem('direction') || 'LTR';

  const dir =
    direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <div className="bt-div-3">
        <div className="flex-gap-12">
          <MyButton
            appearance="primary"
            onClick={handleAdd}
          >
            Add Social History
          </MyButton>

          <MyButton
            onClick={() =>
              setOpenCancelModal(true)
            }
            prefixIcon={() => (
              <CloseOutlineIcon />
            )}
            disabled={
              !selectedHistory ||
              selectedHistory.status ===
                'CANCELLED' ||
              isCancelling
            }
          >
            <Translate>Cancel</Translate>
          </MyButton>
        </div>

        <div className="bt-right-3">
          <MyInput
            fieldLabel="Show Cancelled"
            fieldType="check"
            fieldName="showCancelled"
            record={{ showCancelled }}
            setRecord={(record: any) =>
              setShowCancelled(
                !!record.showCancelled
              )
            }
            showLabel={false}
          />
        </div>
      </div>

      <MyTable
        height={450}
        data={socialHistories}
        loading={isFetching}
        columns={columns}
        rowKey="id"
        onRowClick={row =>
          setSelectedHistory(row)
        }
        rowClassName={isSelected}
      />

      <CancellationModal
        title="Cancel Social History"
        fieldLabel="Cancellation Reason"
        open={openCancelModal}
        setOpen={value => {
          setOpenCancelModal(value);

          if (!value) {
            setCancelReason('');
          }
        }}
        object={{
          cancellationReason: cancelReason
        }}
        setObject={(object: any) =>
          setCancelReason(
            object.cancellationReason || ''
          )
        }
        handleCancle={handleCancel}
        fieldName="cancellationReason"
        required
      />

      <EditClaimEncounterCopySocialHistoryModal
        open={openEditModal}
        setOpen={value => {
          setOpenEditModal(value);

          if (!value) {
            setEditData(null);
          }
        }}
        claimEncounterCopyId={
          claimEncounterCopyId
        }
        initialData={editData}
      />
    </div>
  );
};

export default ClaimEncounterCopySocialHistory;
