import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';

import PlusIcon from '@rsuite/icons/Plus';
import React, { useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import AddFamilyHistory from './AddFamilyHistory';

import {
  useCancelFamilyHistoryMutation,
  useGetFamilyHistoryQuery,
  useAddFamilyHistoryMutation,
  useUpdateFamilyHistoryMutation
} from '@/services/patients/familyHistoryService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import './familyHistory.less';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

import { Form, Tooltip, Whisper } from 'rsuite';

const FamilyHistory = ({ patient, edit, toShowData = false, showFreeText = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [freeTextRecord, setFreeTextRecord] = useState({
    freeText: ''
  });
  const [editingFreeTextId, setEditingFreeTextId] = useState<number | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  // Show cancelled
  const [showCancelled, setShowCancelled] = useState(false);

  // Cancellation modal
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: '',
    cancellationReason: ''
  });

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data: familyHistoryData, isLoading, refetch } = useGetFamilyHistoryQuery({
    patientId: Number(patient?.id),
    showCancelled,
    page,
    size,
    sort: 'id,desc'
  });

  const tableData = familyHistoryData?.data ?? [];
  const totalCount = familyHistoryData?.totalCount ?? 0;

  const [cancelFamilyHistory] = useCancelFamilyHistoryMutation();

  // ENUM
  const relations = useEnumOptions('Relations');

  // ACTIONS
  const [addFamilyHistory, { isLoading: isSavingFreeText }] =
    useAddFamilyHistoryMutation();
  const [updateFamilyHistory, { isLoading: isUpdatingFreeText }] =
    useUpdateFamilyHistoryMutation();

  const handleSaveFreeText = async () => {
    const freeText = freeTextRecord.freeText?.trim();

    if (!freeText) {
      dispatch(notify({ msg: 'Free Text is required.', sev: 'warning' }));
      return;
    }

    if (!isValidPatientId) {
      dispatch(notify({ msg: 'Invalid patient.', sev: 'error' }));
      return;
    }

    const payload = {
      patientId,
      condition: null,
      relation: null,
      inheritedDiseases: null,
      patientIsFree: true,
      freeText
    };

    try {
      if (editingFreeTextId !== null) {
        await updateFamilyHistory({
          ...payload,
          id: editingFreeTextId
        }).unwrap();

        dispatch(notify({ msg: 'Free Text updated successfully.', sev: 'success' }));
      } else {
        await addFamilyHistory(payload).unwrap();

        dispatch(notify({ msg: 'Free Text saved successfully.', sev: 'success' }));
      }

      setFreeTextRecord({ freeText: '' });
      setEditingFreeTextId(null);
      refetch();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        `Failed to ${editingFreeTextId !== null ? 'update' : 'save'} Free Text.`;

      dispatch(notify({ msg: errorMessage, sev: 'error' }));
    }
  };

  const handleEdit = (row: any) => {
    if (row?.patientIsFree === true) {
      setEditingFreeTextId(row.id);
      setFreeTextRecord({
        freeText: row.freeText || ''
      });
      return;
    }
    setSelectedRow(row);
    setOpen(true);
  };

  const openCancelDialog = (row: any) => {
    setOpen(false);
    setSelectedRow(null);

    setCancelObject({
      id: row.id,
      status: row.status || 'ACTIVE',
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

  const handleCancel = async () => {
    try {
      await cancelFamilyHistory({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Family History cancelled successfully.',
          sev: 'success'
        })
      );

      setOpenCancelModal(false);

      setCancelObject({
        id: null,
        status: '',
        cancellationReason: ''
      });
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.data?.detail ||
        error?.error ||
        'Failed to cancel Family History.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };


  // TABLE COLUMNS
  const columns = [
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
        if (!row?.patientIsFree) {
          return '-';
        }

        const text = row?.freeText?.trim() || '-';

        return (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={
              <Tooltip
                style={{
                  maxWidth: 500,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word'
                }}
              >
                {text}
              </Tooltip>
            }
          >
            <div
              style={{
                display: 'block',
                width: '100%',
                minWidth: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflowWrap: 'anywhere'
              }}
            >
              {text}
            </div>
          </Whisper>
        );
      }
    },
    {
      key: 'condition',
      title: 'CONDITION',
      flexGrow: 4,
      dataKey: 'condition'
    },
    {
      key: 'relation',
      title: 'RELATION',
      flexGrow: 3,
      render: row =>
        relations?.find(r => r.value === row.relation)?.label ?? row.relation
    },
    {
      key: 'inheritedDiseases',
      title: 'INHERITED DISEASES',
      flexGrow: 3,
      render: row => (row.patientIsFree === true ? '-' : row.inheritedDiseases ? 'Yes' : 'No')
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 2,
      render: (row: any) => {
        const status = row?.status ?? 'ACTIVE';

        return (
          <MyBadgeStatus
            contant={formatEnumString(status)}
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
      title: <Translate>CREATED AT / BY</Translate>,
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
      title: <Translate>UPDATED AT / BY</Translate>,
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
      title: <Translate>CANCELLED AT / BY</Translate>,
      expandable: true,
      render: (row: any) => {
        if (row?.status !== 'CANCELLED') {
          return <span>-</span>;
        }

        return (
          <UserDateCell
            login={row?.cancelledBy}
            date={row?.cancelledDate}
          />
        );
      }
    },
    {
      key: 'cancellationReason',
      title: <Translate>CANCELLATION REASON</Translate>,
      expandable: true,
      flexGrow: 4,
      render: (row: any) =>
        row?.status === 'CANCELLED' && row?.cancellationReason ? (
          <ExpandableText
            text={row.cancellationReason}
            lines={3}
            maxChars={30}
          />
        ) : (
          '-'
        )
    },
    ...(!toShowData
      ? [
        {
          key: 'actions',
          title: '',
          flexGrow: 1,
          render: (row: any) => (
            <div
              className="family-history-actions"
              style={{ display: 'flex', gap: 12 }}
            >
              {row?.status !== 'CANCELLED' && (
                <>
                  <MdModeEdit
                    size={24}
                    className="edit-icon view-only-action-edit-delete-encounter"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => handleEdit(row)}
                  />

                  <MdDelete
                    size={24}
                    className="view-only-action-edit-delete-encounter"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                      color: 'var(--rs-red-500, #f44336)'
                    }}
                    title="Cancel"
                    onClick={() => openCancelDialog(row)}
                  />
                </>
              )}
            </div>
          )
        }
      ]
      : [])
  ];

  // PAGINATION
  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  // RENDER
  return (
    <div className="medical-container-div">
      <SectionContainer
        action={
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {!toShowData && (
              <MyButton
                disabled={edit}
                prefixIcon={() => <PlusIcon />}
                onClick={() => {
                  setSelectedRow(null);
                  setOpen(true);
                }}
              >
                Add
              </MyButton>
            )}

            {showFreeText && (
              <MyButton
                disabled={
                  edit ||
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
            )}
          </div>
        }
        title="Family History"
        content={
          <>
            {showFreeText && (
              <Form
                fluid
                formValue={freeTextRecord}
                onChange={(value: any) => setFreeTextRecord(value)}
              >
                <MyInput
                  fieldType="textarea"
                  fieldLabel="Free Text"
                  fieldName="freeText"
                  record={freeTextRecord}
                  setRecord={setFreeTextRecord}
                  disabled={edit || isSavingFreeText || isUpdatingFreeText}
                  width="100%"
                />
              </Form>
            )}
           
              <div className="margin-bottom-10 show-cancelled">
                <MyInput
                  fieldType="check"
                  fieldLabel="Show Cancelled"
                  showLabel={false}
                  fieldName="showCancelled"
                  record={{ showCancelled }}
                  setRecord={(record: any) => {
                    setShowCancelled(record.showCancelled);
                    setPage(0);
                  }}
                />
              </div>
            

            <MyTable
              height={450}
              data={tableData}
              loading={isLoading}
              columns={columns}
              page={page}
              rowsPerPage={size}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />

            <AddFamilyHistory
              open={open}
              setOpen={() => {
                setSelectedRow(null);
                setOpen(false);
              }}
              initialData={selectedRow}
              patient={patient}
            />

            <CancellationModal
              open={openCancelModal}
              setOpen={() => {
                setOpenCancelModal(false);
                setCancelObject({
                  id: null,
                  status: '',
                  cancellationReason: ''
                });
              }}
              handleCancle={(e?: any) => {
                e?.preventDefault?.();
                e?.stopPropagation?.();
                handleCancel();
              }}
              object={cancelObject}
              setObject={setCancelObject}
              title="Family History"
              fieldName="cancellationReason"
              fieldLabel="Cancellation Reason"
              statusField="status"
              statusKey="CANCELLED"
              withReason
              required
              size="33vw"
            />
          </>
        }
      />
    </div>
  );
};

export default FamilyHistory;
