
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
  useCancelClaimEncounterCopyPatientProblemMutation,
  useGetClaimEncounterCopyPatientProblemsQuery
} from '@/services/billing/claimEncounterCopyPatientProblemService';

import { ClaimEncounterCopyPatientProblem } from '@/types/model-types-new';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';

import AddClaimEncounterCopyPatientProblem from './AddClaimEncounterCopyPatientProblem';

import {
  conjureValueBasedOnKeyFromList,
  formatEnumString
} from '@/utils';

const ClaimEncounterCopyPatientProblemsTable = ({
  claimEncounterCopyId
}: {
  claimEncounterCopyId: number;
}) => {
  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedProblem, setSelectedProblem] =
    useState<ClaimEncounterCopyPatientProblem | null>(null);

  const [editData, setEditData] =
    useState<ClaimEncounterCopyPatientProblem | null>(null);

  const [openEditModal, setOpenEditModal] =
    useState(false);

  const [openCancelModal, setOpenCancelModal] =
    useState(false);

  const [cancelReason, setCancelReason] =
    useState('');

  const { data: diagnosisTypeLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_TYPE');

  const { data: sourceLov } =
    useGetLovValuesByCodeQuery('RELATION');

  const { data: diagnosisStatusLov } =
    useGetLovValuesByCodeQuery('DIAGNOSIS_STATUS');

  const {
    data: patientProblems = [],
    isFetching,
    refetch
  } = useGetClaimEncounterCopyPatientProblemsQuery(
    {
      claimEncounterCopyId,
      showCancelled
    },
    {
      skip: !claimEncounterCopyId
    }
  );

  const [
    cancelPatientProblem,
    { isLoading: isCancelling }
  ] =
    useCancelClaimEncounterCopyPatientProblemMutation();

  const handleAdd = () => {
    setEditData(null);
    setOpenEditModal(true);
  };

  const handleEdit = (
    row: ClaimEncounterCopyPatientProblem
  ) => {
    setEditData(row);
    setOpenEditModal(true);
  };

  const handleCancel = async () => {
    if (
      !selectedProblem ||
      !cancelReason.trim()
    ) {
      return;
    }

    try {
      await cancelPatientProblem({
        id: selectedProblem.id!,
        cancellationReason: cancelReason.trim()
      }).unwrap();

      setOpenCancelModal(false);
      setSelectedProblem(null);
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
          <div
            style={{
              minWidth: 350,
              width: '100%'
            }}
          >
            <Translate>FREE TEXT</Translate>
          </div>
        ),
        minWidth: 350,
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) => {
          if (row?.patientIsFree !== true) {
            return '-';
          }

          return (
            <ExpandableText
              text={
                row?.freeText?.trim() || '-'
              }
              lines={2}
              maxChars={80}
            />
          );
        }
      },
      {
        key: 'condition',
        title: 'CONDITION',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) =>
          row.patientIsFree === true
            ? '-'
            : formatEnumString(row.condition)
      },
      {
        key: 'dateOfDiagnosis',
        title: 'DATE OF DIAGNOSIS',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.dateOfDiagnosis
              ? new Date(
                  row.dateOfDiagnosis
                ).toLocaleDateString()
              : ''
      },
      {
        key: 'type',
        title: 'TYPE',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          const value =
            conjureValueBasedOnKeyFromList(
              diagnosisTypeLov?.object ?? [],
              row.type,
              'lovDisplayVale'
            );

          return (
            value ??
            row.type ??
            ''
          );
        }
      },
      {
        key: 'dateOfResolution',
        title: 'DATE OF RESOLUTION',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) =>
          row.patientIsFree === true
            ? '-'
            : row.dateOfResolution
              ? new Date(
                  row.dateOfResolution
                ).toLocaleDateString()
              : ''
      },
      {
        key: 'sourceOfInformation',
        title: 'SOURCE OF INFORMATION',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          if (row.byPatient === true) {
            return <Translate>Patient</Translate>;
          }

          const value =
            conjureValueBasedOnKeyFromList(
              sourceLov?.object ?? [],
              row.sourceOfInformation,
              'lovDisplayVale'
            );

          return (
            value ??
            row.sourceOfInformation ??
            ''
          );
        }
      },
      {
        key: 'conditionStatus',
        title: 'CONDITION STATUS',
        flexGrow: 3,
        render: (
          row: ClaimEncounterCopyPatientProblem
        ) => {
          if (row.patientIsFree === true) {
            return '-';
          }

          const value =
            conjureValueBasedOnKeyFromList(
              diagnosisStatusLov?.object ?? [],
              row.conditionStatus,
              'lovDisplayVale'
            );

          return (
            value ??
            row.conditionStatus ??
            ''
          );
        }
      },
      {
        key: 'status',
        title: (
          <Translate>STATUS</Translate>
        ),
        width: 140,
        render: (
          row: ClaimEncounterCopyPatientProblem
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
          row: ClaimEncounterCopyPatientProblem
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
          row: ClaimEncounterCopyPatientProblem
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
          row: ClaimEncounterCopyPatientProblem
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
          row: ClaimEncounterCopyPatientProblem
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
        render: (
          row: ClaimEncounterCopyPatientProblem
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
      diagnosisTypeLov,
      sourceLov,
      diagnosisStatusLov
    ]
  );

  const isSelected = (
    row: ClaimEncounterCopyPatientProblem
  ) =>
    selectedProblem?.id === row.id
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
            Add Patient Problem
          </MyButton>

          <MyButton
            onClick={() =>
              setOpenCancelModal(true)
            }
            prefixIcon={() => (
              <CloseOutlineIcon />
            )}
            disabled={
              !selectedProblem ||
              selectedProblem.status ===
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
        data={patientProblems}
        loading={isFetching}
        columns={columns}
        rowKey="id"
        onRowClick={row =>
          setSelectedProblem(row)
        }
        rowClassName={isSelected}
      />

      <CancellationModal
        title="Cancel Patient Problem"
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

      <AddClaimEncounterCopyPatientProblem
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

export default ClaimEncounterCopyPatientProblemsTable;
