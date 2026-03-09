import React, { useState } from 'react';

import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandDots } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest } from '@/types/types';
import { useGetPatientAllergiesByPatientIdQuery } from '@/services/encounters/patientAllergiesService';
import { useGetAllergensQuery } from '@/services/setup/allergensService';
import { PatientAllergiesResponseVM } from '@/types/model-types-new';
import { formatEnumString } from '@/utils';
import { useGetAllMedicationCategoriesClassesQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import './styles.less';

import Draggable from 'react-draggable';
import { FaTimes } from 'react-icons/fa'; // أيقونة X

const AllergyFloatingButton = ({ patient }: { patient: any }) => {
  const [visible, setVisible] = useState(true);
  const [wasDragged, setWasDragged] = useState(false);

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
    <>
       {visible ? (
        <Draggable>
          <div className="allergy-floating-fab">
            <div className="fab-header">
              <span>Allergies</span>
              <FaTimes className="close-icon" onClick={() => setVisible(false)} />
            </div>
            <div className="table-scroll-wrapper">
              <MyTable
                columns={tableColumns}
                data={activeAllergies || []}
                loading={isLoading}
                hidePagination
                compact
              />
            </div>
          </div>
        </Draggable>
      ) : (
        <Draggable
          onStart={() => setWasDragged(false)}
          onDrag={() => setWasDragged(true)}
          onStop={() => {
            setTimeout(() => setWasDragged(false), 200); // Reset after small delay
          }}
        >
          <div
            className="fab-toggle-button"
            onClick={() => {
              if (!wasDragged) {
                setVisible(true);
              }
            }}
          >
            <FontAwesomeIcon icon={faHandDots} />
            Allergies
          </div>
        </Draggable>
      )}
    </>
  );
};

export default AllergyFloatingButton;
