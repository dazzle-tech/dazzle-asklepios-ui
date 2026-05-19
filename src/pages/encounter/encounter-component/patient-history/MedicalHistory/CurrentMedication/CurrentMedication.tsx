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

import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import {
  useCancelCurrentMedicationMutation,
  useGetCurrentMedicationsQuery
} from '@/services/patients/currentMedicationService';

import PlusIcon from '@rsuite/icons/Plus';
import React, { useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import AddCurrentMedication from './AddCurrentMedication';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import ExpandableText from '@/components/ExpandMore/ExpandableText';

const CurrentMedication = ({ patient, edit, toShowData = false }) => {
  const dispatch = useAppDispatch();

  const [open, setOpen] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<any>(null);

  const [pagination, setPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc'
  });

  const [showCancelled, setShowCancelled] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelObject, setCancelObject] = useState<any>({
    id: null,
    status: '',
    cancellationReason: ''
  });

const { data: medicationsResponse, isLoading } =
  useGetCurrentMedicationsQuery(
    {
      patientId: patient?.id,
      ...pagination,
      showCancelled
    },
    {
      skip: !patient?.id
    }
  );

  const [cancelCurrentMedication] =
    useCancelCurrentMedicationMutation();

  const {
    data: activeIngredientsResponse,
    isLoading: isLoadingIngredients
  } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const activeIngredientMap = useMemo(() => {
    const map = new Map<string, string>();

    activeIngredientsResponse?.data?.forEach(item => {
      map.set(String(item.id), item.name);
    });

    return map;
  }, [activeIngredientsResponse]);

  const isSelected = (row: any) =>
    selectedMedication && row.id === selectedMedication.id
      ? 'selected-row'
      : '';

  const handleEdit = (row: any) => {
    setSelectedMedication(row);
    setOpen(true);
  };

  const openCancelDialog = (row: any) => {
    setOpen(false);
    setSelectedMedication(null);

    setCancelObject({
      id: row.id,
      status: row.status || 'ACTIVE',
      cancellationReason: ''
    });

    setOpenCancelModal(true);
  };

    const handleCancel = async () => {
      try {
        await cancelCurrentMedication({
          id: cancelObject.id,
          cancellationReason: cancelObject.cancellationReason
        }).unwrap();

        dispatch(
          notify({
            msg: 'Current Medication cancelled successfully.',
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
          'Failed to cancel Current Medication.';

        dispatch(
          notify({
            msg: errorMessage,
            sev: 'error'
          })
        );
      }
    };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPagination(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0
    }));
  };

const tableData = useMemo(
  () => medicationsResponse?.data ?? [],
  [medicationsResponse?.data]
);

const totalCount = medicationsResponse?.totalCount ?? 0;

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


const columns = [
  {
    key: 'medication',
    title: 'MEDICATION NAME',
    flexGrow: 4,
    render: (row: any) =>
      activeIngredientMap.get(
        String(row.activeIngredientId)
      ) ?? ''
  },
  {
    key: 'instructions',
    title: 'INSTRUCTIONS',
    flexGrow: 5,
    render: (row: any) => row.instructions ?? ''
  },
  {
    key: 'startDate',
    title: 'START DATE',
    flexGrow: 3,
    render: (row: any) =>
      row?.startDate
        ? new Date(row.startDate).toLocaleDateString()
        : ''
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
      row?.status?.toString?.() === 'CANCELLED' ? (
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
          flexGrow: 2,
          render: (row: any) => {
            const status =
              row?.status?.toString?.() || 'ACTIVE';

            return (
              <div
                className="container-of-icons"
                style={{
                  display: 'flex',
                  gap: 12
                }}
              >
                {status !== 'CANCELLED' && (
                  <>
                    <MdModeEdit
                      className="icons-style"
                      size={22}
                      fill="var(--primary-gray)"
                      onClick={() =>
                        handleEdit(row)
                      }
                    />

                    <MdDelete
                      size={22}
                      style={{
                        cursor: 'pointer',
                        color:
                          'var(--rs-red-500, #f44336)'
                      }}
                      title="Cancel"
                      onClick={() =>
                        openCancelDialog(row)
                      }
                    />
                  </>
                )}
              </div>
            );
          }
        }
      ]
    : [])
];

  return (
    <div className="medical-container-div">
      <SectionContainer
        title={<>Current Medication</>}
        action={
          !toShowData && (
            <MyButton
              disabled={edit}
              prefixIcon={() => <PlusIcon />}
              onClick={() => {
                setSelectedMedication(null);
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
                    setShowCancelled(
                      record.showCancelled
                    );
                  }}
                />
              </div>
            )}

            <MyTable
              height={450}
              data={tableData}
              loading={
                isLoading || isLoadingIngredients
              }
              columns={columns}
              rowClassName={isSelected}
              page={pagination.page}
              rowsPerPage={pagination.size}
              totalCount={totalCount}
              onPageChange={handlePageChange}
              onRowsPerPageChange={
                handleRowsPerPageChange
              }
            />

            <AddCurrentMedication
              open={open}
              initialData={selectedMedication}
              patient={patient}
              setOpen={() => {
                setOpen(false);
                setSelectedMedication(null);
              }}
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
              title="Current Medication"
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

export default CurrentMedication;