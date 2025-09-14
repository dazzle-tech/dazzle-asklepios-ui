import React, { useState } from 'react';
import { Divider, Text } from 'rsuite';
import '../styles.less';
import MyTable from '@/components/MyTable';
import { useGetPrescriptionInstructionQuery } from '@/services/medicationsSetupService';
import { initialListRequest } from '@/types/types';
import { useGetDrugOrderMedicationQuery } from '@/services/encounterService';
import { useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
import {
  useGetPrescriptionMedicationsQuery,
  useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import FullViewTable from './FullViewTable';
import { useGetGenericMedicationActiveIngredientQuery } from '@/services/medicationsSetupService';
import Section from '@/components/Section';

const PatientChronicMedication = ({ patient, title = null }) => {
  const [open, setOpen] = useState(false);
  // Initialize the state for generic medication list request with default settings and descending sort order
  const [listGinricRequest, setListGinricRequest] = useState({
    ...initialListRequest,
    sortType: 'desc'
  });
  // Fetch custom instructions for medication prescriptions
  const { data: customeInstructions } = useGetCustomeInstructionsQuery({ ...initialListRequest });
  // Fetch predefined instruction list used in prescriptions
  const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({
    ...initialListRequest
  });
  // Fetch list of generic medications
  const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({
    ...initialListRequest
  });
  // Fetch prescription medications for a specific patient that are marked as chronic and active
  const { data: prescriptionMedications } = useGetPrescriptionMedicationsQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'chronic_medication',
        operator: 'match',
        value: true
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ]
  });
  // Fetch drug order medications for the same patient and criteria
  const { data: orderMedications } = useGetDrugOrderMedicationQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'chronic_medication',
        operator: 'match',
        value: true
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '1804482322306061'
      }
    ]
  });
  // Fetch the list of generic medication active ingredients based on the current request state
  const { data: genericMedicationActiveIngredientListResponseData } =
    useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });

  // Initialize an empty array to store both order and prescription medications
  const combinedArray = [];

  // Loop through order medications and push formatted data into the combined array
  orderMedications?.object?.forEach(order => {
    combinedArray.push({
      createdAt: order.createdAt,
      createdBy: order.createdBy,
      key: order.key,
      genericMedicationsKey: order.genericMedicationsKey,
      instructionsTypeLvalue: 'Custom',
      instructions: order.instructions,
      notes: order.notes,
      parametersToMonitor: order.parametersToMonitor,
      indication: order.indicationIcd,
      indicationUse: order.indicationUseLvalue?.lovDisplayVale ?? '',
      indicationManually: order.indicationManually,
      activeIngredient: order.activeIngredient,
      roa: order.roaLvalue?.lovDisplayVale,
      frequency: order.frequency,
      dose: order.dose,
      unit: order.doseUnitLvalue?.lovDisplayVale,
      sourceName: 'Order'
    });
  });
  // Loop through prescription medications and push formatted data into the combined array
  prescriptionMedications?.object?.forEach(pre => {
    combinedArray.push({
      createdAt: pre.createdAt,
      createdBy: pre.createdBy,
      key: pre.key,
      genericMedicationsKey: pre.genericMedicationsKey,
      instructionsTypeLvalue: pre.instructionsTypeLvalue?.lovDisplayVale ?? '',
      instructionsTypeLkey: pre.instructionsTypeLkey,
      instructions: pre.instructions,
      notes: pre.notes,
      parametersToMonitor: pre.parametersToMonitor,
      indication: pre.indicationIcd,
      indicationUse: pre.indicationUseLvalue?.lovDisplayVale ?? '',
      indicationManually: pre.indicationManually,
      activeIngredient: pre.activeIngredient,
      sourceName: 'Prescription'
    });
  });

  // Table Columns
  const columns = [
    {
      key: 'medicationBrandName',
      title: 'MEDICATION BRAND NAME',
      render: rowData =>
        genericMedicationListResponse?.object?.find(
          item => item.key === rowData.genericMedicationsKey
        )?.genericName || ''
    },
    {
      key: 'instructions',
      title: 'INSTRUCTIONS',
      render: rowData => {
        if (rowData.sourceName === 'Prescription') {
          if (rowData.instructionsTypeLkey === '3010591042600262') {
            const generic = predefinedInstructionsListResponse?.object?.find(
              item => item.key === rowData.instructions
            );
            return [
              generic?.dose,
              generic?.unitLvalue?.lovDisplayVale,
              generic?.routLvalue?.lovDisplayVale,
              generic?.frequencyLvalue?.lovDisplayVale
            ]
              .filter(Boolean)
              .join(', ');
          }

          if (rowData.instructionsTypeLkey === '3010573499898196') {
            return rowData.instructions;
          }

          if (rowData.instructionsTypeLkey === '3010606785535008') {
            const custom = customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            );
            return [
              custom?.dose,
              custom?.roaLvalue?.lovDisplayVale,
              custom?.unitLvalue?.lovDisplayVale,
              custom?.frequencyLvalue?.lovDisplayVale
            ]
              .filter(Boolean)
              .join(', ');
          }
        } else {
          return joinValuesFromArray([
            rowData.dose,
            rowData.unit,
            rowData.frequency > 0 ? `every ${rowData.frequency} hours` : 'STAT',
            rowData.roa
          ]);
        }
      }
    }
  ];

  // Join non-empty (truthy) values from an array into a comma-separated string
  function joinValuesFromArray(values: any[]): string {
    return values.filter(Boolean).join(', ');
  }
  // Combines the names and strengths of active ingredients for a given generic medication
  const joinValuesFromArrayo = (objects, genericMedicationsKey) => {
    return objects
      .map(obj => {
        const matchingActiveIngredient =
          genericMedicationActiveIngredientListResponseData?.object?.find(ingredient => {
            return (
              ingredient?.genericMedicationKey === genericMedicationsKey &&
              ingredient?.activeIngredientKey === obj.key
            );
          });

        if (matchingActiveIngredient) {
          return `${obj.name}:${matchingActiveIngredient?.strength} ${matchingActiveIngredient?.unitLvalue?.lovDisplayVale} `;
        }

        return obj.name;
      })
      .join(', ');
  };
  return (
    <Section
    isContainOnlyTable
      title={title ? title : ' Patient Chronic Medication'}
      content={
        <MyTable
          data={combinedArray ?? []}
          columns={columns}
          height={250}
          onRowClick={rowData => {}}
        />
      }
      setOpen={setOpen}
      rightLink="Full view"
      openedContent={
        <FullViewTable open={open} setOpen={setOpen} combinedArray={combinedArray} genericMedicationListResponse={genericMedicationListResponse}
            joinValuesFromArrayo={joinValuesFromArrayo}
            predefinedInstructionsListResponse={predefinedInstructionsListResponse}
            customeInstructions={customeInstructions}
            joinValuesFromArray={joinValuesFromArray}
            modalTitle="Last 24-h Medications" />
      }
    />
  );
};
export default PatientChronicMedication;
