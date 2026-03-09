// import React, { useState } from 'react';
// import { Divider, Text } from 'rsuite';
// import '../styles.less';
// import MyTable from '@/components/MyTable';
// import { useGetPrescriptionInstructionQuery } from '@/services/medicationsSetupService';
// import { initialListRequest } from '@/types/types';
// import { useGetDrugOrderMedicationQuery } from '@/services/encounterService';
// import { useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
// import {
//   useGetPrescriptionMedicationsQuery,
//   useGetCustomeInstructionsQuery
// } from '@/services/encounterService';
// import FullViewTable from './FullViewTable';
// import { useGetGenericMedicationActiveIngredientQuery } from '@/services/medicationsSetupService';
// import Section from '@/components/Section';
// import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
// import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
// import { formatEnumString } from '@/utils';
// // please dont remove any commented code in this page
// //
// //
// const PatientChronicMedication = ({ patient, title = null }) => {
//   const [open, setOpen] = useState(false);
//   // Initialize the state for generic medication list request with default settings and descending sort order
//   const [listGinricRequest, setListGinricRequest] = useState({
//     ...initialListRequest,
//     sortType: 'desc'
//   });
//   // Fetch custom instructions for medication prescriptions
//   const { data: customeInstructions } = useGetCustomeInstructionsQuery({ ...initialListRequest });
//   // Fetch predefined instruction list used in prescriptions
//   // const { data: predefinedInstructionsListResponse } = useGetPrescriptionInstructionQuery({
//   //   ...initialListRequest
//   // });
//   const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({ page: 0, size: 1000, sort: 'id,asc' });

//   // Fetch list of generic medications
//   // const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({
//   //   ...initialListRequest
//   // });
//   const { data: genericMedicationListResponse } =
//     useGetAllBrandMedicationsQuery({ page: 0, size: 1000, sort: 'id,asc' });

//   // Fetch prescription medications for a specific patient that are marked as chronic and active
//   const { data: prescriptionMedications } = useGetPrescriptionMedicationsQuery({
//     ...initialListRequest,
//     filters: [
//       {
//         fieldName: 'patient_key',
//         operator: 'match',
//         value: patient?.key
//       },
//       {
//         fieldName: 'chronic_medication',
//         operator: 'match',
//         value: true
//       },
//       {
//         fieldName: 'status_lkey',
//         operator: 'match',
//         value: '1804482322306061'
//       }
//     ]
//   });
//   // Fetch drug order medications for the same patient and criteria
//   const { data: orderMedications } = useGetDrugOrderMedicationQuery({
//     ...initialListRequest,
//     filters: [
//       {
//         fieldName: 'patient_key',
//         operator: 'match',
//         value: patient?.key
//       },
//       {
//         fieldName: 'chronic_medication',
//         operator: 'match',
//         value: true
//       },
//       {
//         fieldName: 'status_lkey',
//         operator: 'match',
//         value: '1804482322306061'
//       }
//     ]
//   });
//   // Fetch the list of generic medication active ingredients based on the current request state
//   const { data: genericMedicationActiveIngredientListResponseData } =
//     useGetGenericMedicationActiveIngredientQuery({ ...listGinricRequest });

//   // Initialize an empty array to store both order and prescription medications
//   const combinedArray = [];

//   // Loop through order medications and push formatted data into the combined array
//   // orderMedications?.object?.forEach(order => {
//   //   combinedArray.push({
//   //     createdAt: order.createdAt,
//   //     createdBy: order.createdBy,
//   //     key: order.key,
//   //     genericMedicationsKey: order.genericMedicationsKey,
//   //     instructionsTypeLvalue: 'Custom',
//   //     instructions: order.instructions,
//   //     notes: order.notes,
//   //     parametersToMonitor: order.parametersToMonitor,
//   //     indication: order.indicationIcd,
//   //     indicationUse: order.indicationUseLvalue?.lovDisplayVale ?? '',
//   //     indicationManually: order.indicationManually,
//   //     activeIngredient: order.activeIngredient,
//   //     roa: order.roaLvalue?.lovDisplayVale,
//   //     frequency: order.frequency,
//   //     dose: order.dose,
//   //     unit: order.doseUnitLvalue?.lovDisplayVale,
//   //     sourceName: 'Order'
//   //   });
//   // });
//   // Loop through prescription medications and push formatted data into the combined array
//   prescriptionMedications?.object?.forEach(pre => {
//     combinedArray.push({
//       createdAt: pre.createdAt,
//       createdBy: pre.createdBy,
//       key: pre.key,
//       genericMedicationsKey: pre.genericMedicationsId,
//       instructionsTypeLvalue: pre.instructionsTypeLvalue?.lovDisplayVale ?? '',
//       instructionsTypeLkey: pre.instructionsTypeLkey,
//       instructions: pre.instructions,
//       notes: pre.notes,
//       parametersToMonitor: pre.parametersToMonitor,
//       indication: pre.indicationIcd,
//       indicationUse: pre.indicationUseLvalue?.lovDisplayVale ?? '',
//       indicationManually: pre.indicationManually,
//       activeIngredient: pre.activeIngredient,
//       sourceName: 'Prescription'
//     });
//   });

//   // Table Columns
//   const columns = [
//     {
//       key: 'medicationBrandName',
//       title: 'MEDICATION BRAND NAME',
//       render: (rowData: any) => {
//         const id = rowData.genericMedicationsKey;

//         const item = genericMedicationListResponse?.data?.find(item => {

//           return item.id === id;
//         });

//         return item?.name || '-';
//       }
//     },

//     {
//       key: 'instructions',
//       dataKey: '',
//       title: 'Instructions',
//       flexGrow: 3,
//       render: (rowData: any) => {
//         const cleanJoin = (vals: any[], sep = ', ') =>
//           vals
//             .map(v => (v == null ? '' : String(v).trim()))
//             .filter(v => v !== '' && v !== 'undefined' && v !== 'null')
//             .join(sep);

//         if (rowData.instructionsTypeLkey === '3010591042600262') {
//           const generic = predefinedInstructionsListResponse?.data?.find(
//             (item: any) => item.id === Number(rowData.instructions)
//           );

//           return cleanJoin([
//             generic?.dose,
//             formatEnumString(generic?.unit),
//             formatEnumString(generic?.rout),
//             formatEnumString(generic?.frequency),
//           ]);
//         }

//         if (rowData.instructionsTypeLkey === '3010573499898196') {
//           return cleanJoin([rowData?.instructions]);
//         }

//         if (rowData.instructionsTypeLkey === '3010606785535008') {
//           const custom = customeInstructions?.object?.find(
//             (item: any) => item?.prescriptionMedicationsKey === rowData.key
//           );

//           return cleanJoin([
//             custom?.dose,
//             custom?.unitLvalue?.lovDisplayVale,
//             custom?.frequencyLvalue?.lovDisplayVale,
//             formatEnumString(custom?.roaLkey),
//           ]);
//         }

//         return '';
//       }

//     },
//   ];

//   // Join non-empty (truthy) values from an array into a comma-separated string
//   function joinValuesFromArray(values: any[]): string {
//     return values.filter(Boolean).join(', ');
//   }
//   // Combines the names and strengths of active ingredients for a given generic medication
//   const joinValuesFromArrayo = (objects, genericMedicationsKey) => {
//     return objects
//       .map(obj => {
//         const matchingActiveIngredient =
//           genericMedicationActiveIngredientListResponseData?.object?.find(ingredient => {
//             return (
//               ingredient?.genericMedicationKey === genericMedicationsKey &&
//               ingredient?.activeIngredientKey === obj.key
//             );
//           });

//         if (matchingActiveIngredient) {
//           return `${obj.name}:${matchingActiveIngredient?.strength} ${matchingActiveIngredient?.unitLvalue?.lovDisplayVale} `;
//         }

//         return obj.name;
//       })
//       .join(', ');
//   };
//   return (
//     <Section
//       isContainOnlyTable
//       title={title ? title : ' Patient Chronic Medication'}
//       content={
//         <MyTable
//           data={combinedArray ?? []}
//           columns={columns}
//           height={250}
//           onRowClick={rowData => { }}
//         />
//       }
//       setOpen={setOpen}
//       rightLink="Full view"
//       openedContent={
//         <FullViewTable open={open} setOpen={setOpen} combinedArray={combinedArray} genericMedicationListResponse={genericMedicationListResponse}
//           joinValuesFromArrayo={joinValuesFromArrayo}
//           predefinedInstructionsListResponse={predefinedInstructionsListResponse}
//           customeInstructions={customeInstructions}
//           joinValuesFromArray={joinValuesFromArray}
//           modalTitle="Patient Chronic Medication" />
//       }
//     />
//   );
// };
// export default PatientChronicMedication;




// please dont remove The commented code 


import React, { useState } from 'react';
import '../styles.less';
import MyTable from '@/components/MyTable';
import {
  useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import FullViewTable from './FullViewTable';
import Section from '@/components/Section';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { useGetAllChronicRawQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const PatientChronicMedication = ({ patient, title = null }) => {
  const [open, setOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const {
    data: chronicMedications,
    isLoading
  } = useGetAllChronicRawQuery(
    {
      patientId: patient?.id,
      ...paginationParams
    },
    {
      skip: !patient?.id
    }
  );

  const { data: genericMedicationListResponse, isLoading: isLoadingGenericMedication } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: predefinedInstructionsListResponse, isLoading: isLoadingPredefinedInstructions } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000
  });

  const { data: customeInstructions, isLoading: isLoadingCustomeInstructions } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });


  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const totalCount = chronicMedications?.totalCount ?? 0;
  const tableColumns = [
    {
      key: 'medicationsId',
      dataKey: 'medicationsId',
      title: <Translate>Medication Name</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const medId = rowData.medicationsId ?? rowData.genericMedicationsId;
        return genericMedicationListResponse?.data?.find(
          (item: any) => String(item.id) === String(medId)
        )?.name;
      }
    },
    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const type = rowData?.instructionsType;

        if (rowData?.instructionsType === 'PRE_DEFINED_INSTRUCTIONS') {
          const inst = (predefinedInstructionsListResponse?.data ?? []).find(
            (x: any) => Number(x.id) === Number(rowData?.instructions)
          );
          if (!inst) return 'No predefined instructions';
          return [inst?.dose, formatEnumString(inst?.unit), formatEnumString(inst?.rout), formatEnumString(inst?.frequency)]
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(Boolean)
            .join(', ');
        }

        if (type === 'MANUAL_INSTRUCTIONS') {
          return rowData?.instructions || 'No instructions';
        }

        if (type === 'CUSTOM_INSTRUCTIONS') {
          // Try reading from medication object first (new API)
          if (rowData?.dose != null || rowData?.doesUnit || rowData?.frequency || rowData?.rout) {
            // Get LOV arrays - handle both object and direct array formats
            const unitLovArray = Array.isArray(unitLovQueryResponse) ? unitLovQueryResponse : (unitLovQueryResponse?.object ?? []);
            const freqLovArray = Array.isArray(frequencyLov) ? frequencyLov : (frequencyLov?.object ?? []);

            const unitDisplay = getLovDisplay(unitLovArray, rowData?.doesUnit) ||
              formatEnumString(rowData?.doesUnit) ||
              (rowData?.doesUnit ? String(rowData.doesUnit) : '');
            const freqDisplay = getLovDisplay(freqLovArray, rowData?.frequency) ||
              formatEnumString(rowData?.frequency) ||
              (rowData?.frequency ? String(rowData.frequency) : '');
            return [
              toStr(rowData?.dose),
              unitDisplay,
              formatEnumString(rowData?.rout),
              freqDisplay
            ]
              .map(s => s.trim())
              .filter(Boolean)
              .join(', ');
          }

          // Fallback to legacy custom instructions lookup
          const ci = customeInstructions.find(
            (x: any) => String(x.prescriptionMedicationsKey) === String(rowData?.id ?? rowData?.key)
          );

          return [
            toStr(ci?.dose),
            toStr(ci?.unitLvalue?.lovDisplayVale),
            formatEnumString(ci?.roaLkey),
            toStr(ci?.frequencyLvalue?.lovDisplayVale)
          ]
            .map(s => s.trim())
            .filter(Boolean)
            .join(', ');
        }

        return '-';
      }
    },
  ];

  const getLovDisplay = (list: any[] = [], key: any, labelKey = 'lovDisplayVale') => {
    if (!key && key !== 0) return '';
    const lovList = list ?? [];
    if (!lovList.length) return '';

    // Normalize key to string and number for comparison
    const keyStr = String(key);
    const keyNum = Number(key);

    // Try multiple matching strategies
    for (const item of lovList) {
      // Match by key (string or number) - most common case
      if (String(item?.key) === keyStr || Number(item?.key) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
      // Match by id (string or number)
      if (String(item?.id) === keyStr || Number(item?.id) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
      // Match by valueCode (for enum-based LOVs)
      if (item?.valueCode && String(item?.valueCode) === keyStr) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
    }

    // Fallback to original utility function
    const fallback = conjureValueBasedOnKeyFromList(lovList, key, labelKey);
    if (fallback && fallback !== key) return String(fallback);

    return '';
  };
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    const sortValue = `${newSortColumn},${newSortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  return (
    <Section
      isContainOnlyTable
      title={title ? title : ' Patient Chronic Medication'}
      content={
        <MyTable
          columns={tableColumns}
          totalCount={totalCount}
          loading={isLoading || isLoadingCustomeInstructions || isLoadingGenericMedication || isLoadingPredefinedInstructions}
          data={chronicMedications?.data ?? []}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />
      }
      setOpen={setOpen}
      rightLink="Full view"
      openedContent={
        <FullViewTable open={open} setOpen={setOpen}
          data={chronicMedications?.data ?? []}
          genericMedicationListResponse={genericMedicationListResponse}
          predefinedInstructionsListResponse={predefinedInstructionsListResponse}
          unitLovQueryResponse={unitLovQueryResponse}
          frequencyLov={frequencyLov}
          customeInstructions={customeInstructions}
          getLovDisplay={getLovDisplay}
          toStr={toStr}
          totalCount={totalCount}
          isLoading={isLoading}
          paginationParams={paginationParams}
          setPaginationParams={setPaginationParams}
          sortColumn={sortColumn}
          sortType={sortType}
          handlePageChange={handlePageChange}
          handleSortChange={handleSortChange}
        />
      }
    />
  );
};
export default PatientChronicMedication;