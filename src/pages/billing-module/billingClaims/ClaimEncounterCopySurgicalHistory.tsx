import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
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

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useCancelClaimEncounterCopySurgicalHistoryMutation,
  useCreateClaimEncounterCopySurgicalHistoryMutation,
  useGetClaimEncounterCopySurgicalHistoriesQuery,
  useUpdateClaimEncounterCopySurgicalHistoryMutation
} from '@/services/billing/claimEncounterCopySurgicalHistoryService';

import { ClaimEncounterCopySurgicalHistory } from '@/types/model-types-new';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import AddClaimEncounterCopySurgicalHistory from './AddClaimEncounterCopySurgicalHistory';

import {
  conjureValueBasedOnKeyFromList,
} from '@/utils';

const ClaimEncounterCopySurgicalHistoryTable = ({
  claimEncounterCopyId
}: {
  claimEncounterCopyId: number;
}) => {
  const dispatch = useAppDispatch();

  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedHistory, setSelectedHistory] =
    useState<ClaimEncounterCopySurgicalHistory | null>(null);

  const [editData, setEditData] =
    useState<ClaimEncounterCopySurgicalHistory | null>(null);

  const [openEditModal, setOpenEditModal] = useState(false);

  const [freeTextRecord, setFreeTextRecord] = useState({
    freeText: ''
  });
  const [editingFreeTextId, setEditingFreeTextId] =
    useState<number | null>(null);

  const [openCancelModal, setOpenCancelModal] =
    useState(false);

  const [cancelReason, setCancelReason] = useState('');

  const { data: anesthesiaLov } =
    useGetLovValuesByCodeQuery('ANESTH_TYPES');

  const { data: complicationsLov } =
    useGetLovValuesByCodeQuery('PROC_COMPLIC');

  const { data: adverseLov } =
    useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');

  const {
    data: surgicalHistories = [],
    isFetching,
    refetch
  } = useGetClaimEncounterCopySurgicalHistoriesQuery(
    {
      claimEncounterCopyId,
      showCancelled
    },
    {
      skip: !claimEncounterCopyId
    }
  );

  const [
    cancelSurgicalHistory,
    { isLoading: isCancelling }
  ] = useCancelClaimEncounterCopySurgicalHistoryMutation();

  const [
    createSurgicalHistory,
    { isLoading: isSavingFreeText }
  ] = useCreateClaimEncounterCopySurgicalHistoryMutation();

  const [
    updateSurgicalHistory,
    { isLoading: isUpdatingFreeText }
  ] = useUpdateClaimEncounterCopySurgicalHistoryMutation();

  const handleSaveFreeText = async () => {
    const freeText = freeTextRecord.freeText?.trim();

    if (!freeText) {
      dispatch(notify({ msg: 'Free Text is required.', sev: 'warning' }));
      return;
    }

    const payload = {
      surgery: null,
      facility: null,
      anesthesiaType: null,
      dateOfSurgery: null,
      complications: null,
      adverseReactionsToAnesthesia: null,
      hasImplantsOrDevices: null,
      implantsOrDevicesDescription: null,
      patientIsFree: true,
      freeText
    };

    try {
      if (editingFreeTextId !== null) {
        await updateSurgicalHistory({
          id: editingFreeTextId,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'Free Text updated successfully.', sev: 'success' }));
      } else {
        await createSurgicalHistory({
          claimEncounterCopyId,
          ...payload
        }).unwrap();

        dispatch(notify({ msg: 'Free Text saved successfully.', sev: 'success' }));
      }

      setFreeTextRecord({ freeText: '' });
      setEditingFreeTextId(null);
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        `Failed to ${editingFreeTextId !== null ? 'update' : 'save'} Free Text.`;

      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const handleAdd = () => {
    setEditData(null);
    setOpenEditModal(true);
  };

  const handleEdit = (
    row: ClaimEncounterCopySurgicalHistory
  ) => {
    if (row?.patientIsFree === true) {
      setEditingFreeTextId(row.id!);
      setFreeTextRecord({ freeText: row.freeText || '' });
      return;
    }

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
      await cancelSurgicalHistory({
        id: selectedHistory.id!,
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
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => {
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
        key: 'surgery',
        title: 'SURGERY',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.surgery || ''
      },
      {
        key: 'dateOfSurgery',
        title: 'DATE OF SURGERY',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.dateOfSurgery
              ? new Date(
                  row.dateOfSurgery
                ).toLocaleDateString()
              : ''
      },
      {
        key: 'facility',
        title: 'FACILITY',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.facility || ''
      },
      {
        key: 'anesthesiaType',
        title: 'ANESTHESIA TYPE',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          const value =
            conjureValueBasedOnKeyFromList(
              anesthesiaLov?.object ?? [],
              row.anesthesiaType,
              'lovDisplayVale'
            );

          return value ?? row.anesthesiaType ?? '';
        }
      },
      {
        key: 'complications',
        title: 'COMPLICATIONS',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          const keys = (row.complications || '')
            .split(',')
            .map(key => key.trim())
            .filter(Boolean);

          if (!keys.length) {
            return '';
          }

          return keys
            .map(
              key =>
                conjureValueBasedOnKeyFromList(
                  complicationsLov?.object ?? [],
                  key,
                  'lovDisplayVale'
                ) ?? key
            )
            .join(', ');
        }
      },
      {
        key: 'adverseReactionsToAnesthesia',
        title: 'ADVERSE REACTIONS',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          const keys = (
            row.adverseReactionsToAnesthesia || ''
          )
            .split(',')
            .map(key => key.trim())
            .filter(Boolean);

          if (!keys.length) {
            return '';
          }

          return keys
            .map(
              key =>
                conjureValueBasedOnKeyFromList(
                  adverseLov?.object ?? [],
                  key,
                  'lovDisplayVale'
                ) ?? key
            )
            .join(', ');
        }
      },
      {
        key: 'hasImplantsOrDevices',
        title: 'IMPLANTS / DEVICES',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.hasImplantsOrDevices
              ? row.implantsOrDevicesDescription ||
                'Yes'
              : 'No'
      },
      {
        key: 'status',
        title: (
          <Translate>STATUS</Translate>
        ),
        width: 140,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => {
          const status =
            row?.status ?? 'ACTIVE';

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
        key: 'createdDate',
        title: (
          <Translate>
            CREATED AT / BY
          </Translate>
        ),
        expandable: true,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => (
          <UserDateCell
            login={row?.createdBy}
            date={row?.createdDate}
          />
        )
      },
      {
        key: 'lastModifiedDate',
        title: (
          <Translate>
            UPDATED AT / BY
          </Translate>
        ),
        expandable: true,
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => (
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
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
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
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) =>
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
        render: (
          row: ClaimEncounterCopySurgicalHistory
        ) => (
          <div
            className="flex-gap-12"
            onClick={e =>
              e.stopPropagation()
            }
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
    [
      anesthesiaLov,
      complicationsLov,
      adverseLov
    ]
  );

  const isSelected = (
    row: ClaimEncounterCopySurgicalHistory
  ) =>
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
            Add Surgical History
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

          <MyButton
            disabled={
              isSavingFreeText ||
              isUpdatingFreeText ||
              !freeTextRecord.freeText?.trim()
            }
            onClick={handleSaveFreeText}
          >
            {isSavingFreeText || isUpdatingFreeText
              ? 'Saving...'
              : editingFreeTextId !== null
                ? 'Update'
                : 'Save'}
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

      <Form
        fluid
        formValue={freeTextRecord}
        onChange={(value: any) => setFreeTextRecord(value)}
      >
        <div style={{ marginBottom: 20, width: '100%' }}>
          <MyInput
            fieldType="textarea"
            fieldLabel="Free Text"
            fieldName="freeText"
            record={freeTextRecord}
            setRecord={setFreeTextRecord}
            disabled={isSavingFreeText || isUpdatingFreeText}
            width="100%"
          />
        </div>
      </Form>

      <MyTable
        height={450}
        data={surgicalHistories}
        loading={isFetching}
        columns={columns}
        rowKey="id"
        onRowClick={row =>
          setSelectedHistory(row)
        }
        rowClassName={isSelected}
      />

      <CancellationModal
        title="Cancel Surgical History"
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

      <AddClaimEncounterCopySurgicalHistory
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

export default ClaimEncounterCopySurgicalHistoryTable;