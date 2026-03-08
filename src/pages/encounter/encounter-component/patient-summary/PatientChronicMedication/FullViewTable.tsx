// import React from 'react';
// import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
// import '../styles.less'
// import MyTable from '@/components/MyTable';
// import MyModal from '@/components/MyModal/MyModal';
// import { faPills } from '@fortawesome/free-solid-svg-icons';
// import { formatEnumString } from '@/utils';

// const FullViewTable = ({
//   open,
//   setOpen,
//   combinedArray,
//   genericMedicationListResponse,
//   joinValuesFromArrayo,
//   predefinedInstructionsListResponse,
//   customeInstructions,
//   joinValuesFromArray,
//   modalTitle = null

// }) => {


//   const medicationColumns = [
//     // {
//     //   key: 'brandName',
//     //   title: 'Medication Brand Name',
//     //      render: (rowData: any) => {
//     //     return genericMedicationListResponse?.data?.find(
//     //       item => item.id === rowData.genericMedicationsId
//     //     )?.name;
//     //   }
//     // },
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
//     // don't remove this commented code, may be needed later

//     // {
//     //   key: 'activeIngredients',
//     //   title: 'Medication Active Ingredient(s)',
//     //   render: (rowData: any) => joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey)
//     // },
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
//     {
//       key: 'instructionsType',
//       title: 'Instructions Type',
//       render: (rowData: any) => rowData?.instructionsTypeLvalue || ''
//     },
//     {
//       key: 'startDate',
//       title: 'Start Date',
//       render: (rowData: any) => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
//     }
//   ];

//   return (
//     <MyModal
//       open={open}
//       setOpen={setOpen}
//       title={modalTitle ? modalTitle : " Patient Chronic Medication"}
//       content={<MyTable
//         data={combinedArray ?? []}
//         columns={medicationColumns}
//         height={300}
//       />}
//       hideCancel={false}
//       bodyheight="70vh"
//       size="70vw"
//       hideBack={true}
//       steps={[
//         {
//           title: modalTitle || "Patient Chronic Medication",
//           icon: <FontAwesomeIcon icon={faPills} />
//         }
//       ]}
//       hideActionBtn={true}
//     />
//   );
// };
// export default FullViewTable;

// please dont remove the commented code


import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less'
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { formatEnumString } from '@/utils';
import Translate from '@/components/Translate';

const FullViewTable = ({
  open,
  setOpen,
  data,
  genericMedicationListResponse,
  predefinedInstructionsListResponse,
  unitLovQueryResponse,
  frequencyLov,
  customeInstructions,
  getLovDisplay,
  toStr,
  totalCount,
  isLoading,
  paginationParams,
  setPaginationParams,
  sortColumn,
  sortType,
  handlePageChange,
  handleSortChange
}) => {

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
      {
        key: 'instructionsType',
        title: <Translate>Instructions Type</Translate>,
        flexGrow: 1,
        render: (rowData: any) => (
          <span>{formatEnumString(rowData.instructionsType)}</span>
        ),
      },
      
    ];
 
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Chronic Medication"
      content={
      <MyTable
                columns={tableColumns}
                totalCount={totalCount}
                loading={isLoading}
                data={data ?? []}
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
      hideCancel={false}
      bodyheight="70vh"
      size="70vw"
      hideBack={true}
      steps={[
        {
          title: "Patient Chronic Medication",
          icon: <FontAwesomeIcon icon={faPills} />
        }
      ]}
      hideActionBtn={true}
    />
  );
};
export default FullViewTable;