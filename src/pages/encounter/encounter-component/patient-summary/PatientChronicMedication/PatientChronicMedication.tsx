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
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { formatEnumString } from '@/utils';
// please dont remove any commented code in this page
//
//
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
  // const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({
  //   ...initialListRequest
  // });
  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({ page: 0, size: 1000, sort: 'id,asc' });

  // Fetch list of generic medications
  // const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({
  //   ...initialListRequest
  // });
  const { data: genericMedicationListResponse } =
    useGetAllBrandMedicationsQuery({ page: 0, size: 1000, sort: 'id,asc' });

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
  // orderMedications?.object?.forEach(order => {
  //   combinedArray.push({
  //     createdAt: order.createdAt,
  //     createdBy: order.createdBy,
  //     key: order.key,
  //     genericMedicationsKey: order.genericMedicationsKey,
  //     instructionsTypeLvalue: 'Custom',
  //     instructions: order.instructions,
  //     notes: order.notes,
  //     parametersToMonitor: order.parametersToMonitor,
  //     indication: order.indicationIcd,
  //     indicationUse: order.indicationUseLvalue?.lovDisplayVale ?? '',
  //     indicationManually: order.indicationManually,
  //     activeIngredient: order.activeIngredient,
  //     roa: order.roaLvalue?.lovDisplayVale,
  //     frequency: order.frequency,
  //     dose: order.dose,
  //     unit: order.doseUnitLvalue?.lovDisplayVale,
  //     sourceName: 'Order'
  //   });
  // });
  // Loop through prescription medications and push formatted data into the combined array
  prescriptionMedications?.object?.forEach(pre => {
    combinedArray.push({
      createdAt: pre.createdAt,
      createdBy: pre.createdBy,
      key: pre.key,
      genericMedicationsKey: pre.genericMedicationsId,
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
      render: (rowData: any) => {
        const id = rowData.genericMedicationsKey;

        const item = genericMedicationListResponse?.data?.find(item => {

          return item.id === id;
        });

        return item?.name || '-';
      }
    },

    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const cleanJoin = (vals: any[], sep = ', ') =>
          vals
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(v => v !== '' && v !== 'undefined' && v !== 'null')
            .join(sep);

        if (rowData.instructionsTypeLkey === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.data?.find(
            (item: any) => item.id === Number(rowData.instructions)
          );

          return cleanJoin([
            generic?.dose,
            formatEnumString(generic?.unit),
            formatEnumString(generic?.rout),
            formatEnumString(generic?.frequency),
          ]);
        }

        if (rowData.instructionsTypeLkey === '3010573499898196') {
          return cleanJoin([rowData?.instructions]);
        }

        if (rowData.instructionsTypeLkey === '3010606785535008') {
          const custom = customeInstructions?.object?.find(
            (item: any) => item?.prescriptionMedicationsKey === rowData.key
          );

          return cleanJoin([
            custom?.dose,
            custom?.unitLvalue?.lovDisplayVale,
            custom?.frequencyLvalue?.lovDisplayVale,
            formatEnumString(custom?.roaLkey),
          ]);
        }

        return '';
      }

    },
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
          onRowClick={rowData => { }}
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
          modalTitle="Patient Chronic Medication" />
      }
    />
  );
};
export default PatientChronicMedication;