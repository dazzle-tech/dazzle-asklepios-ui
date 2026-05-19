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
  useGetFamilyHistoryQuery
} from '@/services/patients/familyHistoryService';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import './familyHistory.less';
import ExpandableText from '@/components/ExpandMore/ExpandableText';

const FamilyHistory = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<any>(null);

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

  const { data: familyHistoryData, isLoading } = useGetFamilyHistoryQuery({
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


const UserFullNameCell = ({ login }: { login?: string | null }) => {
  const { data: fullName } = useGetUserFullNameByLoginQuery(login!, {
    skip: !login
  });

  if (!login) {
    return <span>-</span>;
  }

  return <span>{fullName || login}</span>;
};

const UserDateCell = ({
  login,
  date
}: {
  login?: string | null;
  date?: string | null;
}) => {
  if (!login && !date) {
    return <span>-</span>;
  }

  return (
    <>
      <UserFullNameCell login={login} />
      <br />
      <span className="date-table-style">
        {date ? formatDateWithoutSeconds(date) : ''}
      </span>
    </>
  );
};


  // TABLE COLUMNS
  const columns = [
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
      render: row => (row.inheritedDiseases ? 'Yes' : 'No')
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
                      className="edit-icon"
                      style={{ cursor: 'pointer' }}
                      onClick={() => handleEdit(row)}
                    />

                    <MdDelete
                      size={24}
                      style={{
                        cursor: 'pointer',
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
        title="Family History"
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
                    setPage(0);
                  }}
                />
              </div>
            )}

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