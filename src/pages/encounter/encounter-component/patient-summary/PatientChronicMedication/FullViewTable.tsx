import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less'
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { formatEnumString } from '@/utils';

const FullViewTable = ({
  open,
  setOpen,
  combinedArray,
  genericMedicationListResponse,
  joinValuesFromArrayo,
  predefinedInstructionsListResponse,
  customeInstructions,
  joinValuesFromArray,
  modalTitle = null

}) => {


  const medicationColumns = [
    // {
    //   key: 'brandName',
    //   title: 'Medication Brand Name',
    //      render: (rowData: any) => {
    //     return genericMedicationListResponse?.data?.find(
    //       item => item.id === rowData.genericMedicationsId
    //     )?.name;
    //   }
    // },
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
    // don't remove this commented code, may be needed later

    // {
    //   key: 'activeIngredients',
    //   title: 'Medication Active Ingredient(s)',
    //   render: (rowData: any) => joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey)
    // },
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
    {
      key: 'instructionsType',
      title: 'Instructions Type',
      render: (rowData: any) => rowData?.instructionsTypeLvalue || ''
    },
    {
      key: 'startDate',
      title: 'Start Date',
      render: (rowData: any) => rowData.createdAt ? new Date(rowData.createdAt).toLocaleString() : ''
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={modalTitle ? modalTitle : " Patient Chronic Medication"}
      content={<MyTable
        data={combinedArray ?? []}
        columns={medicationColumns}
        height={300}
      />}
      hideCancel={false}
      bodyheight="70vh"
      size="70vw"
      hideBack={true}
      steps={[
        {
          title: modalTitle || "Patient Chronic Medication",
          icon: <FontAwesomeIcon icon={faPills} />
        }
      ]}
      hideActionBtn={true}
    />
  );
};
export default FullViewTable;