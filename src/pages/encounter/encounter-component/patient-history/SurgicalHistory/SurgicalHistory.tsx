import PlusIcon from '@rsuite/icons/Plus';
import React, { useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useCancelSurgicalHistoryMutation,
  useGetSurgicalHistoryQuery,
  useAddSurgicalHistoryMutation,
  useUpdateSurgicalHistoryMutation
} from '@/services/patients/surgicalHistoryService';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import AddSurgicalHistory from './AddSurgicalHistory';

import { conjureValueBasedOnKeyFromList, formatDateWithoutSeconds, formatEnumString } from '@/utils';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import '../styles.less';
import Translate from '@/components/Translate';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

import { Form, Tooltip, Whisper } from 'rsuite';

const SurgicalHistory = ({ patient, edit, toShowData = false, showFreeText = false,  collapsible = false, defaultCollapsed = false }) => {
  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: complicationsLov } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
  const { data: adverseLov } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [freeTextRecord, setFreeTextRecord] = useState({
    freeText: ''
  });
  const [editingFreeTextId, setEditingFreeTextId] = useState<number | null>(null);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  const dispatch = useAppDispatch();

  const [showCancelled, setShowCancelled] = useState(false);

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: '',
    cancellationReason: ''
  });

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;



  const { data, isFetching, refetch } = useGetSurgicalHistoryQuery(
    {
      patientId,
      page,
      size,
      sort: 'id,desc',
      showCancelled
    },
    { skip: !isValidPatientId }
  );


  const [cancelSurgicalHistory] = useCancelSurgicalHistoryMutation();


  const filteredData = data?.data ?? [];


  const [addSurgicalHistory, { isLoading: isSavingFreeText }] =
    useAddSurgicalHistoryMutation();
  const [updateSurgicalHistory, { isLoading: isUpdatingFreeText }] =
    useUpdateSurgicalHistoryMutation();

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
          ...payload,
          id: editingFreeTextId
        }).unwrap();

        dispatch(notify({ msg: 'Free Text updated successfully.', sev: 'success' }));
      } else {
        await addSurgicalHistory(payload).unwrap();

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
    setCancelObject({
      id: row.id,
      status: row.status || 'ACTIVE',
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

  const handleCancel = async () => {
    try {
      await cancelSurgicalHistory({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Surgical History cancelled successfully.',
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
        'Failed to cancel Surgical History.';

      dispatch(
        notify({
          msg: errorMessage,
          sev: 'error'
        })
      );
    }
  };


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
        if (row?.patientIsFree !== true) {
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
    { key: 'surgery', title: 'SURGERY', flexGrow: 3 },
    {
      key: 'dateOfSurgery',
      title: 'DATE OF SURGERY',
      flexGrow: 3,
      render: (row: any) =>
        row?.dateOfSurgery ? new Date(row.dateOfSurgery).toLocaleDateString() : ''
    },
    { key: 'facility', title: 'FACILITY', flexGrow: 3 },
    {
      key: 'anesthesiaType',
      title: 'ANESTHESIA TYPE',
      flexGrow: 3,
      render: (row: any) => {
        const value = conjureValueBasedOnKeyFromList(
          anesthesiaLov?.object ?? [],
          row?.anesthesiaType,
          'lovDisplayVale'
        );

        return value ?? row?.anesthesiaType ?? '';
      }
    },
    {
      key: 'complications',
      title: 'COMPLICATIONS',
      flexGrow: 3,
      render: (row: any) => {
        const keys = (row?.complications || '')
          .split(',')
          .map((k: string) => k.trim())
          .filter(Boolean);

        if (!keys.length) return '';

        return keys
          .map((key: string) =>
            conjureValueBasedOnKeyFromList(complicationsLov?.object ?? [], key, 'lovDisplayVale') ?? key
          )
          .join(', ');
      }
    },
     {
      key: 'AdverseReactions',
      title: 'Adverse Reactions',
      flexGrow: 3,
      render: (row: any) => {
        const keys = (row?.adverseReactionsToAnesthesia || '')
          .split(',')
          .map((k: string) => k.trim())
          .filter(Boolean);

        if (!keys.length) return '';

        return keys
          .map((key: string) =>
            conjureValueBasedOnKeyFromList(adverseLov?.object ?? [], key, 'lovDisplayVale') ?? key
          )
          .join(', ');
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      flexGrow: 3,
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
    {
      key: 'hasImplantsOrDevices',
      title: 'IMPLANTS / DEVICES',
      flexGrow: 3,
      render: row =>
        row?.patientIsFree === true
          ? '-'
          : row?.hasImplantsOrDevices ? row?.implantsOrDevicesDescription : 'No'
    },
    ...(!toShowData
      ? [
        {
          key: 'actions',
          title: '',
          flexGrow: 1,
          render: (row: any) => (
            <div className="flex-gap-12">
              {row?.status !== 'CANCELLED' && (
                <>
                  <MdModeEdit
                    size={22}
                    fill="var(--primary-gray)"
                    className="pointer view-only-action-edit-delete-encounter"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => handleEdit(row)}
                  />

                  <MdDelete
                    size={22}
                    fill="var(--rs-red-500, #f44336)"
                    className="pointer view-only-action-edit-delete-encounter"
                    title="Cancel"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
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

  const handlePageChange = (_: unknown, newPage: number) => setPage(newPage);
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSize(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="medical-main-container" dir={dir}>
      <div className="medical-container-div" dir={dir}>
        <SectionContainer
          collapsible={collapsible}
          defaultCollapsed={defaultCollapsed}
          title="Surgical History"
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
          content={
            <>
              {showFreeText && (
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
                      disabled={edit || isSavingFreeText || isUpdatingFreeText}
                      width="100%"
                    />
                  </div>
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
                    }}
                  />
                </div>
              
              <MyTable
                height={450}
                data={filteredData}
                totalCount={data?.totalCount ?? 0}
                loading={isFetching}
                columns={columns}
                page={page}
                rowsPerPage={size}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
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
                handleCancle={handleCancel}
                object={cancelObject}
                setObject={setCancelObject}
                title="Surgical History"
                fieldName="cancellationReason"
                fieldLabel="Cancellation Reason"
                statusField="status"
                statusKey="CANCELLED"
                withReason
                required
                size="33vw"
              />

              <AddSurgicalHistory
                open={open}
                setOpen={() => {
                  setOpen(false);
                  setSelectedRow(null);
                }}
                initialData={selectedRow}
                patient={patient}
              />
            </>
          }
        />
      </div>
    </div>
  );
};

export default SurgicalHistory;
