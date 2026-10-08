
import React, { useMemo, useState } from 'react';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { MdModeEdit } from 'react-icons/md';

import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import CancellationModal from '@/components/CancellationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import UserDateCell from '@/components/UserDateCell';
import Translate from '@/components/Translate';
import ExpandableText from '@/components/ExpandMore/ExpandableText';

import { formatEnumString } from '@/utils';

import {
  ClaimEncounterCopyCurrentMedication
} from '@/types/model-types-new';

import {
  useCancelClaimEncounterCopyCurrentMedicationMutation,
  useGetClaimEncounterCopyCurrentMedicationsQuery
} from '@/services/billing/claimEncounterCopyCurrentMedicationService';

import AddClaimEncounterCopyCurrentMedication from './AddClaimEncounterCopyCurrentMedication';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';

interface ClaimEncounterCopyCurrentMedicationTableProps {
  claimEncounterCopyId: number;
}

const ClaimEncounterCopyCurrentMedicationTable = ({
  claimEncounterCopyId
}: ClaimEncounterCopyCurrentMedicationTableProps) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedMedication, setSelectedMedication] =
    useState<ClaimEncounterCopyCurrentMedication | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const {
    data: medications = [],
    isFetching
  } = useGetClaimEncounterCopyCurrentMedicationsQuery({
    claimEncounterCopyId,
    showCancelled
  });

  const [
    cancelClaimEncounterCopyCurrentMedication,
    { isLoading: isCancelling }
  ] = useCancelClaimEncounterCopyCurrentMedicationMutation();

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

  const handleAdd = () => {
    setSelectedMedication(null);
    setOpenModal(true);
  };

  const handleEdit = (
    row: ClaimEncounterCopyCurrentMedication
  ) => {
    setSelectedMedication(row);
    setOpenModal(true);
  };

  const handleCancel = async () => {
    if (!selectedMedication || !cancelReason.trim()) {
      return;
    }

    try {
      await cancelClaimEncounterCopyCurrentMedication({
        id: selectedMedication.id,
        data: {
          cancellationReason: cancelReason.trim()
        }
      }).unwrap();

      setOpenCancelModal(false);
      setCancelReason('');
      setSelectedMedication(null);
    } catch (error) {
      console.error(error);
    }
  };

  const isSelected = (
    row: ClaimEncounterCopyCurrentMedication
  ) =>
    row.id === selectedMedication?.id
      ? 'selected-row'
      : '';

  const columns = [
    {
      key: 'freeText',
      title: <Translate>Free Text</Translate>,
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.patientIsFree && row.freeText ? (
          <ExpandableText text={row.freeText} />
        ) : (
          '-'
        )
    },
    {
      key: 'medication',
      title: <Translate>Medication Name</Translate>,
      flexGrow: 3,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.patientIsFree
          ? '-'
          : activeIngredientMap.get(
              String(row.activeIngredientId)
            ) || '-'
    },
    {
      key: 'dosage',
      title: <Translate>Dosage</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.patientIsFree
          ? '-'
          : row.dosage != null || row.unit
            ? `${row.dosage ?? ''} ${
                formatEnumString(row.unit) ?? ''
              }`.trim()
            : '-'
    },
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>,
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.patientIsFree
          ? '-'
          : row.frequency
            ? formatEnumString(row.frequency)
            : '-'
    },
    {
      key: 'startDate',
      title: <Translate>Start Date</Translate>,
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.startDate
          ? new Date(row.startDate).toLocaleDateString()
          : '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) => (
        <MyBadgeStatus
          contant={formatEnumString(row.status)}
          color={
            row.status === 'CANCELLED'
              ? '#dc3545'
              : row.status === 'ACTIVE'
                ? '#28a745'
                : '#6c757d'
          }
        />
      )
    },
    {
      key: 'created',
      title: <Translate>Created By / Date</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) => (
        <UserDateCell
          login={row.createdBy}
          date={row.createdDate}
        />
      )
    },
    {
      key: 'lastModified',
      title: (
        <Translate>Last Modified By / Date</Translate>
      ),
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) => (
        <UserDateCell
          login={row.lastModifiedBy}
          date={row.lastModifiedDate}
        />
      )
    },
    {
      key: 'cancelled',
      title: <Translate>Cancelled By / Date</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.status === 'CANCELLED' ? (
          <UserDateCell
            login={row.cancelledBy}
            date={row.cancelledDate}
          />
        ) : (
          '-'
        )
    },
    {
      key: 'cancellationReason',
      title: <Translate>Cancellation Reason</Translate>,
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) =>
        row.status === 'CANCELLED' &&
        row.cancellationReason ? (
          <ExpandableText
            text={row.cancellationReason}
          />
        ) : (
          '-'
        )
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (
        row: ClaimEncounterCopyCurrentMedication
      ) => (
        <div
          className="flex-gap-12"
          onClick={e => e.stopPropagation()}
        >
          {row.status !== 'CANCELLED' && (
            <MdModeEdit
              size={22}
              fill="var(--primary-gray)"
              className="pointer"
              onClick={event => {
                event.stopPropagation();
                handleEdit(row);
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div dir={dir}>
      <div className="bt-div-3">
        <div className="flex-gap-12">
          <MyButton
            appearance="primary"
            onClick={handleAdd}
          >
            Add Current Medication
          </MyButton>

          <MyButton
            onClick={() => setOpenCancelModal(true)}
            prefixIcon={() => <CloseOutlineIcon />}
            disabled={
              !selectedMedication ||
              selectedMedication.status === 'CANCELLED' ||
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
              setShowCancelled(!!record.showCancelled)
            }
            showLabel={false}
          />
        </div>
      </div>

      <MyTable
        height={450}
        data={medications}
        loading={isFetching || isLoadingIngredients}
        columns={columns}
        rowKey="id"
        onRowClick={row =>
          setSelectedMedication(row)
        }
        rowClassName={isSelected}
      />

      <AddClaimEncounterCopyCurrentMedication
        open={openModal}
        setOpen={setOpenModal}
        claimEncounterCopyId={claimEncounterCopyId}
        initialData={selectedMedication}
      />

      <CancellationModal
        title="Cancel Current Medication"
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
    </div>
  );
};

export default ClaimEncounterCopyCurrentMedicationTable;
