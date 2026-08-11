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
  useGetSurgicalHistoryQuery
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

const SurgicalHistory = ({ patient, edit, toShowData = false }) => {
  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: complicationsLov } = useGetLovValuesByCodeQuery('PROC_COMPLIC');
  const { data: adverseLov } = useGetLovValuesByCodeQuery('MED_ADVERS_EFFECTS');
  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

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



  const { data, isFetching } = useGetSurgicalHistoryQuery(
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


  const handleEdit = (row: any) => {
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
      render: row => (row?.hasImplantsOrDevices ? row?.implantsOrDevicesDescription : 'No')
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
          title="Surgical History"
          action={
            !toShowData && (
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
            )
          }
          content={
            <>

              {!toShowData && (
                <div className="margin-bottom-10">
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
              )}
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
