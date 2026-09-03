import React from 'react';
import { Checkbox } from 'rsuite';
import { MdAttachFile, MdModeEdit } from 'react-icons/md';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { newPatientPrescriptionMedication } from '@/types/model-types-constructor-new';

import UserDateCell from '@/components/UserDateCell';

type Props = {
  edit: boolean;
  currentPrescription: any;
  medications: any[];
  loading: boolean;
  tableFilters: React.ReactNode;
  showCanceled: boolean;
  setShowCanceled: React.Dispatch<React.SetStateAction<boolean>>;
  patientPrescriptionMedicationObject: any;
  setPatientPrescriptionMedicationObject: React.Dispatch<React.SetStateAction<any>>;
  selectedPreviewMedication: any;
  setSelectedPreviewMedication: React.Dispatch<React.SetStateAction<any>>;
  setOpenDetailsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setOpenToAdd: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedMedicationForAttachments: React.Dispatch<React.SetStateAction<any>>;
  setAttachmentsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  genericMedicationListResponse: any;
  predefinedInstructionsListResponse: any;
  customeInstructions: any;
  unitLovQueryResponse: any;
  frequencyLov: any;
  activeIngredientsMap: Map<any, any>;
  getLovDisplay: (list: any[], key: any, labelKey?: string) => string;
};

const PrescriptionTable = ({
  edit,
  currentPrescription,
  medications,
  loading,
  tableFilters,
  showCanceled,
  setShowCanceled,
  patientPrescriptionMedicationObject,
  setPatientPrescriptionMedicationObject,
  selectedPreviewMedication,
  setSelectedPreviewMedication,
  setOpenDetailsModal,
  setOpenToAdd,
  setSelectedMedicationForAttachments,
  setAttachmentsModalOpen,
  genericMedicationListResponse,
  predefinedInstructionsListResponse,
  customeInstructions,
  unitLovQueryResponse,
  frequencyLov,
  activeIngredientsMap,
  getLovDisplay
}: Props) => {
  const isSelected = (rowData: any) => {
    if (
      rowData &&
      patientPrescriptionMedicationObject &&
      String(rowData.id) === String(patientPrescriptionMedicationObject.id)
    ) {
      return 'selected-row';
    }
    return '';
  };

  const cleanJoin = (vals: any[], sep = ', ') =>
    vals
      .map(v => (v == null ? '' : String(v).trim()))
      .filter(v => v !== '' && v !== 'undefined' && v !== 'null')
      .join(sep);

  const columns: any[] = [
    {
      key: 'activeIngredientId',
      title: 'Active Ingredients',
      flexGrow: 1,
      render: (rowData: any) => {
        const ingredient = activeIngredientsMap.get(rowData.activeIngredientId);
        return ingredient?.name ? String(ingredient.name) : '-';
      }
    },
    {
      key: 'medicationName',
      dataKey: 'medicationsId',
      title: <Translate> Medication Name</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        const medId = rowData.medicationsId ?? rowData.genericMedicationsId;
        return genericMedicationListResponse?.data?.find(
          (item: any) => String(item.id) === String(medId)
        )?.name;
      }
    },
    {
      key: 'instructions',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const type = String(rowData.instructionsType ?? rowData.instructionsTypeLkey ?? '');

        if (type === 'PRE_DEFINED_INSTRUCTIONS' || type === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.data?.find(
            (item: any) => item.id === Number(rowData.instructions)
          );

          return cleanJoin([
            generic?.dose,
            formatEnumString(generic?.unit),
            formatEnumString(generic?.rout),
            formatEnumString(generic?.frequency)
          ]);
        }

        if (type === 'MANUAL_INSTRUCTIONS' || type === '3010573499898196') {
          return cleanJoin([rowData?.instructions]);
        }

        if (type === 'CUSTOM_INSTRUCTIONS' || type === '3010606785535008') {
          if (rowData?.dose != null || rowData?.doesUnit || rowData?.frequency || rowData?.rout) {
            const unitLovArray = Array.isArray(unitLovQueryResponse)
              ? unitLovQueryResponse
              : unitLovQueryResponse?.object ?? [];

            const freqLovArray = Array.isArray(frequencyLov)
              ? frequencyLov
              : frequencyLov?.object ?? [];

            const unitDisplay =
              getLovDisplay(unitLovArray, rowData?.doesUnit) ||
              formatEnumString(rowData?.doesUnit) ||
              (rowData?.doesUnit ? String(rowData.doesUnit) : '');

            const freqDisplay =
              getLovDisplay(freqLovArray, rowData?.frequency) ||
              formatEnumString(rowData?.frequency) ||
              (rowData?.frequency ? String(rowData.frequency) : '');

            return cleanJoin([
              rowData?.dose,
              unitDisplay,
              formatEnumString(rowData?.rout),
              freqDisplay
            ]);
          }

          const custom = customeInstructions?.object?.find(
            (item: any) => String(item?.prescriptionMedicationsKey) === String(rowData.id)
          );

          return cleanJoin([
            custom?.dose,
            custom?.unitLvalue?.lovDisplayVale,
            formatEnumString(custom?.roaLkey),
            custom?.frequencyLvalue?.lovDisplayVale
          ]);
        }

        return '';
      }
    },
    {
      key: 'instructionsType',
      title: 'Instructions Type',
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.instructionsType ? formatEnumString(rowData.instructionsType) : ''
    },
    {
      key: 'validUtil',
      dataKey: 'validUtil',
      title: 'Valid Util',
      flexGrow: 2
    },
    {
      key: 'isChronic',
      dataKey: 'chronicMedication',
      title: 'Is Chronic',
      flexGrow: 2,
      render: (rowData: any) => (rowData.chronicMedication ? 'Yes' : 'No')
    },
    {
      key: 'status',
      dataKey: 'status',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) => (rowData?.status ? formatEnumString(rowData.status) : '')
    },
    {
      key: 'cancelled',
      title: <Translate>Cancelled By / At</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (rowData: any) =>
        rowData.cancelledBy || rowData.cancelledDate ? (
          <>
            <UserDateCell login={rowData.cancelledBy} />
            <br />
            <span className="date-table-style">
              {rowData.cancelledDate
                ? formatDateWithoutSeconds(rowData.cancelledDate)
                : ''}
            </span>
          </>
        ) : (
          <span>-</span>
        )
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason',
      expandable: true
    },
    {
      key: 'actions',
      title: 'Actions',
      flexGrow: 1.5,
      render: (rowData: any) => {
        const isSubmitted = String(currentPrescription?.status ?? '').toUpperCase() === 'SUBMITTED';
        const isCancelled = String(rowData.status ?? '').toUpperCase() === 'CANCELLED';
        console.log(currentPrescription?.status);
        return (
          <div className="flex-c8">
            <MdModeEdit
              title={
                edit
                  ? 'View Only'
                  : isSubmitted
                    ? 'Prescription is submitted'
                    : 'Edit'
              }
              size={20}
              className={!edit ? 'font-aws' : 'font-aws view-only-action-edit-delete-encounter'}
              style={{
                opacity: edit || isSubmitted || isCancelled ? 0.5 : 1,
                cursor: edit || isSubmitted || isCancelled ? 'not-allowed' : 'pointer'
              }}
              onClick={e => {
                e.stopPropagation();

                if (edit || isSubmitted || isCancelled) return;

                setPatientPrescriptionMedicationObject({
                  ...rowData,
                  key: rowData.key ?? rowData.id,
                  id: rowData.id ?? rowData.key
                });

                setOpenDetailsModal(true);
                setOpenToAdd(false);
              }}
            />
          </div>
        );
      }
    },
    {
      key: 'attachments',
      title: <Translate>Attachments</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <MdAttachFile
          size={20}
          fill={rowData?.id ? 'var(--primary-gray)' : '#ccc'}
          onClick={e => {
            e.stopPropagation();
            if (rowData?.id) {
              setSelectedMedicationForAttachments(rowData);
              setAttachmentsModalOpen(true);
            }
          }}
          style={{ cursor: rowData?.id ? 'pointer' : 'not-allowed' }}
          title="View Attachments"
        />
      )
    },
    {
      key: 'created',
      title: <Translate>Created At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <UserDateCell login={rowData.createdBy} date={rowData.createdDate} />
      )
    },
    {
      key: 'updated',
      title: <Translate>Updated At/By</Translate>,
      expandable: true,
      render: (rowData: any) => (
        <UserDateCell login={rowData.lastModifiedBy} date={rowData.lastModifiedDate} />
      )
    }
  ];

  const tableButtons = (
    <div className="bt-div">
      <div className="bt-right">
        <Checkbox checked={showCanceled} onChange={() => setShowCanceled(v => !v)} className="show-cancelled">
          Show cancelled
        </Checkbox>
      </div>
    </div>
  );

  return (
    <MyTable
      columns={columns}
      data={medications ?? []}
      onRowClick={(rowData: any) => {
        const isSameRow = String(patientPrescriptionMedicationObject?.id) === String(rowData?.id);

        if (isSameRow && selectedPreviewMedication) {
          setSelectedPreviewMedication(null);
          setPatientPrescriptionMedicationObject({
            ...newPatientPrescriptionMedication,
            prescriptionHeaderId: currentPrescription?.id ?? null
          } as any);
        } else {
          setSelectedPreviewMedication(rowData);
          setPatientPrescriptionMedicationObject(rowData);
          setOpenToAdd(false);
        }
      }}
      loading={loading}
      filters={tableFilters}
      tableButtons={tableButtons}
      rowClassName={isSelected}
    />
  );
};

export default PrescriptionTable;