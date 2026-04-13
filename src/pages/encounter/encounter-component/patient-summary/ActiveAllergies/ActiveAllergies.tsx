import React from 'react';
import '../styles.less';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import Section from '@/components/Section';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import { PatientAllergiesResponseVM } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
const ActiveAllergies = ({ patient }) => {
  // Define filters to fetch allergies specific to a patient and with a certain status
  
  const {
      data: allergiesListResponse,
      refetch: fetchallerges,
      isLoading
    } = useGetPatientAllergiesByPatientIdQuery(
      {
        patientId: patient?.id,
      },
      {
        skip: !patient?.id
      }
    );
     const activeAllergies = allergiesListResponse?.data?.filter(allergy => allergy.status === 'ACTIVE') || [];

   const { data: allergensListResponse } = useGetAllergensQuery({});
     const { data: medicationClassesListResponse } = useGetAllMedicationCategoriesClassesQuery({});

   // table column
    const tableColumns: any[] = [
      {
        key: 'allergenType',
        title: <Translate>Allergy Type</Translate>,
        render: (rowData: PatientAllergiesResponseVM) => <p>{formatEnumString(rowData.allergenType)}</p>
      },
      {
        key: 'allergen',
        title: <Translate>Allergen</Translate>,
        render: (rowData: PatientAllergiesResponseVM) => {
          if (rowData?.allergenId && allergensListResponse?.data) {
            const allergen = allergensListResponse.data.find(
              (item: any) => item.id === rowData.allergenId
            );
            return <p>{allergen?.name ?? '-'}</p>;
          }
  
          else if (rowData?.medicationClassId && medicationClassesListResponse) {
            const medicationClass = medicationClassesListResponse.find(
              (item: any) => item.id === rowData.medicationClassId
            );
            return <p>{medicationClass?.name ?? '-'}</p>;
          }
  
          return <p>-</p>;
        }
      },
      {
        key: 'severity',
        title: <Translate>Severity</Translate>,
        render: rowData => <p>{formatEnumString(rowData?.severity)}</p>,
      },
    ].filter(Boolean);

  
  return (
    <Section
      isContainOnlyTable
      title={<Translate>Active Allergies</Translate>}
      content={
        <MyTable
          data={activeAllergies}
          columns={tableColumns}
          height={250}
          loading={isLoading}
          onRowClick={rowData => {}}
        />
      }
      rightLink=""
      openedContent=""
      setOpen={() => {}}
    />
  );
};
export default ActiveAllergies;
