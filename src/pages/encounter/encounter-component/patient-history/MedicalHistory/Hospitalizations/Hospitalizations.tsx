import PlusIcon from '@rsuite/icons/Plus';
import React, { useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import SectionContainer from '@/components/SectionsoContainer';
import MyInput from '@/components/MyInput';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';

import AddHospitalizations from './AddHospitalizations';

import {
  useCancelHospitalizationMutation,
  useGetHospitalizationsQuery
} from '@/services/patients/hospitalizationsService';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import '../styles.less';
import ExpandableText from '@/components/ExpandMore/ExpandableText';
import UserDateCell from '@/components/UserDateCell/UserDateCell';

const Hospitalizations = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(15);

  const [showCancelled, setShowCancelled] = useState(false);

  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: '',
    cancellationReason: ''
  });

  const patientId = Number(patient?.id);
  const isValidPatientId = Number.isFinite(patientId) && patientId > 0;

  const { data, isFetching } = useGetHospitalizationsQuery(
    {
      patientId: Number(patient?.id),
      showCancelled,
      page,
      size,
      sort: 'id,desc'
    },
    {
      skip: !patient?.id
    }
  );

  const tableData = data?.data ?? [];
  const totalCount = data?.totalCount ?? 0;

  const [cancelHospitalization] = useCancelHospitalizationMutation();

  const handleEdit = (row: any) => {
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
      await cancelHospitalization({
        id: cancelObject.id,
        cancellationReason: cancelObject.cancellationReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Hospitalization cancelled successfully.',
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
        'Failed to cancel Hospitalization.';

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
      key: 'facility',
      title: 'FACILITY',

      dataKey: 'facility'
    },
    {
      key: 'reason',
      title: 'REASON',

      dataKey: 'reason'
    },
    {
      key: 'admissionType',
      title: 'ADMISSION TYPE',

      dataKey: 'admissionType'
    },
    {
      key: 'dateOfAdmission',
      title: 'DATE OF ADMISSION',

      render: (row: any) =>
        row?.dateOfAdmission
          ? new Date(row.dateOfAdmission).toLocaleDateString()
          : ''
    },
    {
      key: 'lengthOfStayDays',
      title: (
        <span>
          <Translate>LENGTH OF STAY</Translate>{' '}
          <Translate>(Days)</Translate>
        </span>
      ),

      dataKey: 'lengthOfStayDays'
    },
    {
      key: 'outcomes',
      title: 'OUTCOMES',

      dataKey: 'outcomes'
    },
    {
      key: 'medicalInterventionsPerformed',
      title: 'MEDICAL INTERVENTIONS PERFORMED',

      dataKey: 'medicalInterventionsPerformed'
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
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
    ...(!toShowData
      ? [
        {
          key: 'actions',
          title: '',

          render: (row: any) => (
            <div style={{ display: 'flex', gap: 12 }}>
              {row?.status !== 'CANCELLED' && (
                <>
                  <MdModeEdit
                    className="view-only-action-edit-delete-encounter"
                    size={22}
                    fill="var(--primary-gray)"
                    style={{
                      opacity: edit ? 0.5 : 1,
                      pointerEvents: edit ? 'none' : 'auto',
                      cursor: edit ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => handleEdit(row)}
                  />

                  <MdDelete
                    className="view-only-action-edit-delete-encounter"
                    size={22}
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

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div className="medical-container-div" dir={dir}>
      <SectionContainer
        title="Hospitalizations"
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
              data={tableData}
              loading={isFetching}
              columns={columns}
              page={page}
              rowsPerPage={size}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={handleRowsPerPageChange}
            />
            <AddHospitalizations
              open={open}
              setOpen={() => {
                setOpen(false);
                setSelectedRow(null);
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
              title="Hospitalization"
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

export default Hospitalizations;