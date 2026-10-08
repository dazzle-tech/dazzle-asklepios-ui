
import React, { useState } from 'react';
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
  useCancelClaimEncounterCopyHospitalizationMutation,
  useGetClaimEncounterCopyHospitalizationsQuery
} from '@/services/billing/claimEncounterCopyHospitalizationService';

import AddClaimEncounterCopyHospitalization from './AddClaimEncounterCopyHospitalization';

import { ClaimEncounterCopyHospitalization } from '@/types/model-types-new';

interface ClaimEncounterCopyHospitalizationsProps {
  claimEncounterCopyId: number;
  edit?: boolean;
  toShowData?: boolean;
}

const ClaimEncounterCopyHospitalizations = ({
  claimEncounterCopyId,
  edit = false,
  toShowData = false
}: ClaimEncounterCopyHospitalizationsProps) => {
  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  const [showCancelled, setShowCancelled] = useState(false);

  const [selectedHospitalization, setSelectedHospitalization] =
    useState<ClaimEncounterCopyHospitalization | null>(null);

  const [openModal, setOpenModal] = useState(false);
  const [openCancelModal, setOpenCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const {
    data: hospitalizations = [],
    isFetching
  } = useGetClaimEncounterCopyHospitalizationsQuery(
    {
      claimEncounterCopyId,
      showCancelled
    },
    {
      skip: !claimEncounterCopyId
    }
  );

  const [
    cancelClaimEncounterCopyHospitalization,
    { isLoading: isCancelling }
  ] = useCancelClaimEncounterCopyHospitalizationMutation();

  const handleAdd = () => {
    setSelectedHospitalization(null);
    setOpenModal(true);
  };

  const handleEdit = (
    row: ClaimEncounterCopyHospitalization
  ) => {
    if (row.status === 'CANCELLED') {
      return;
    }

    setSelectedHospitalization(row);
    setOpenModal(true);
  };

  const handleCancel = async () => {
    if (
      !selectedHospitalization ||
      !cancelReason.trim()
    ) {
      return;
    }

    try {
      await cancelClaimEncounterCopyHospitalization({
        id: selectedHospitalization.id,
        data: {
          cancellationReason: cancelReason.trim()
        }
      }).unwrap();

      setOpenCancelModal(false);
      setCancelReason('');
      setSelectedHospitalization(null);
    } catch (error) {
      console.error(error);
    }
  };

  const isSelected = (
    row: ClaimEncounterCopyHospitalization
  ) =>
    row.id === selectedHospitalization?.id
      ? 'selected-row'
      : '';

  const columns = [
    {
      key: 'freeText',
      title: <Translate>Free Text</Translate>,
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree && row.freeText ? (
          <ExpandableText text={row.freeText} />
        ) : (
          '-'
        )
    },
    {
      key: 'facility',
      title: <Translate>Facility</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.facility || '-'
    },
    {
      key: 'reason',
      title: <Translate>Reason</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.reason || '-'
    },
    {
      key: 'admissionType',
      title: <Translate>Admission Type</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.admissionType || '-'
    },
    {
      key: 'dateOfAdmission',
      title: <Translate>Date of Admission</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.dateOfAdmission
            ? new Date(
                row.dateOfAdmission
              ).toLocaleDateString()
            : '-'
    },
    {
      key: 'lengthOfStayDays',
      title: (
        <span>
          <Translate>Length of Stay</Translate>{' '}
          <Translate>(Days)</Translate>
        </span>
      ),
      flexGrow: 1.2,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.lengthOfStayDays ?? '-'
    },
    {
      key: 'outcomes',
      title: <Translate>Outcomes</Translate>,
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.outcomes || '-'
    },
    {
      key: 'medicalInterventionsPerformed',
      title: (
        <Translate>
          Medical Interventions Performed
        </Translate>
      ),
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) =>
        row.patientIsFree
          ? '-'
          : row.medicalInterventionsPerformed || '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (
        row: ClaimEncounterCopyHospitalization
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
      title: (
        <Translate>
          Created By / Date
        </Translate>
      ),
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
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
        <Translate>
          Last Modified By / Date
        </Translate>
      ),
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
      ) => (
        <UserDateCell
          login={row.lastModifiedBy}
          date={row.lastModifiedDate}
        />
      )
    },
    {
      key: 'cancelled',
      title: (
        <Translate>
          Cancelled By / Date
        </Translate>
      ),
      flexGrow: 1.5,
      render: (
        row: ClaimEncounterCopyHospitalization
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
      title: (
        <Translate>
          Cancellation Reason
        </Translate>
      ),
      flexGrow: 2,
      render: (
        row: ClaimEncounterCopyHospitalization
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
        row: ClaimEncounterCopyHospitalization
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
              className={
                edit
                  ? undefined
                  : 'pointer'
              }
              style={{
                opacity: edit ? 0.5 : 1,
                cursor: edit
                  ? 'not-allowed'
                  : 'pointer'
              }}
              onClick={event => {
                event.stopPropagation();

                if (!edit) {
                  handleEdit(row);
                }
              }}
            />
          )}
        </div>
      )
    }
  ];

  return (
    <div dir={dir}>
      {!toShowData && (
        <div className="bt-div-3">
          <div className="flex-gap-12">
            <MyButton
              appearance="primary"
              onClick={handleAdd}
              disabled={edit}
            >
              Add Hospitalization
            </MyButton>

            <MyButton
              onClick={() =>
                setOpenCancelModal(true)
              }
              prefixIcon={() => (
                <CloseOutlineIcon />
              )}
              disabled={
                edit ||
                !selectedHospitalization ||
                selectedHospitalization.status ===
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
      )}

      <MyTable
        height={450}
        data={hospitalizations}
        loading={isFetching}
        columns={columns}
        rowKey="id"
        onRowClick={row =>
          setSelectedHospitalization(row)
        }
        rowClassName={isSelected}
      />

      {!toShowData && (
        <>
          <AddClaimEncounterCopyHospitalization
            open={openModal}
            setOpen={setOpenModal}
            claimEncounterCopyId={
              claimEncounterCopyId
            }
            initialData={
              selectedHospitalization
            }
          />

          <CancellationModal
            title="Cancel Hospitalization"
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
        </>
      )}
    </div>
  );
};

export default ClaimEncounterCopyHospitalizations;