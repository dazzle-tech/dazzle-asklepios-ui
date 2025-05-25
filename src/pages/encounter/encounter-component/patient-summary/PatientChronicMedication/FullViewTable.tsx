import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../styles.less'
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
import { faPills } from '@fortawesome/free-solid-svg-icons';

const FullViewTable = ({ 
    open, 
    setOpen, 
    combinedArray,
    genericMedicationListResponse,
    joinValuesFromArrayo ,
    predefinedInstructionsListResponse,
    customeInstructions,
    joinValuesFromArray

}) => {


    const medicationColumns = [
        {
          key: 'brandName',
          title: 'Medication Brand Name',
          render: (rowData: any) =>
            genericMedicationListResponse?.object?.find(item => item.key === rowData.genericMedicationsKey)?.genericName || ''
        },
        {
          key: 'activeIngredients',
          title: 'Medication Active Ingredient(s)',
          render: (rowData: any) => joinValuesFromArrayo(rowData.activeIngredient, rowData.genericMedicationsKey)
        },
        {
          key: 'instructions',
          title: 'Instructions',
          render: (rowData: any) => {
            if (rowData.sourceName === 'Prescription') {
              if (rowData.instructionsTypeLkey === "3010591042600262") {
                const generic = predefinedInstructionsListResponse?.object?.find(
                  item => item.key === rowData.instructions
                );
                return [generic?.dose, generic?.unitLvalue?.lovDisplayVale, generic?.routLvalue?.lovDisplayVale, generic?.frequencyLvalue?.lovDisplayVale]
                  .filter(Boolean)
                  .join(', ');
              }
      
              if (rowData.instructionsTypeLkey === "3010573499898196") {
                return rowData.instructions;
              }
      
              if (rowData.instructionsTypeLkey === "3010606785535008") {
                const custom = customeInstructions?.object?.find(item => item.prescriptionMedicationsKey === rowData.key);
                return [custom?.dose, custom?.roaLvalue?.lovDisplayVale, custom?.unitLvalue?.lovDisplayVale, custom?.frequencyLvalue?.lovDisplayVale]
                  .filter(Boolean)
                  .join(', ');
              }
            } else {
              return joinValuesFromArray([
                rowData.dose,
                rowData.unit,
                rowData.drugOrderTypeLkey === '2937757567806213' ? 'STAT' : `every ${rowData.frequency} hours`,
                rowData.roa
              ]);
            }
          }
        },
        {
          key: 'instructionsType',
          title: 'Instructions Type',
          render: (rowData: any) => rowData.instructionsTypeLvalue || ''
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
            title="Patient Chronic Medications"
            content={<MyTable
                data={combinedArray  ?? []}
                columns={medicationColumns}
                height={300}
            />}
            hideCancel={false}
            bodyheight="70vh"
            size="70vw"
            hideBack={true}
            steps={[{ title: "Chronic Medications", icon:  <FontAwesomeIcon icon={faPills }/>}]}
            hideActionBtn={true}
        />
    );
};
export default FullViewTable;