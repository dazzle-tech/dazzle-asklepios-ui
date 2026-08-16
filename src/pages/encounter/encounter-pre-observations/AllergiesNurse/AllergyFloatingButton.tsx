import React, { useRef, useState } from 'react';

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
import { FaTimes } from 'react-icons/fa';
import DetailsModal from '@/pages/encounter/encounter-pre-observations-new/AllergiesNurse/DetailsModal';
import MyButton from '@/components/MyButton/MyButton';

const AllergyFloatingButton = ({ patient, encounter }: { patient: any; encounter?: any }) => {
  const [openAddAllergy, setOpenAddAllergy] = useState(false);
  const [selectedAllergy, setSelectedAllergy] = useState<any>({});
  const [visible, setVisible] = useState(true);
  const [wasDragged, setWasDragged] = useState(false);
  const fabRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLDivElement>(null);

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
        <Draggable nodeRef={fabRef}>
          <div ref={fabRef} className="allergy-floating-fab">
            <div className="fab-header">
              <div className="fab-title">
                Allergies
              </div>

              <div className="fab-header-actions">

                <MyButton
                  size="xs"
                  className="fab-add-btn"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedAllergy({});
                    setOpenAddAllergy(true);
                  }}
                >
                  Add
                </MyButton>

                <FaTimes
                  className="close-icon"
                  onMouseDown={e => e.stopPropagation()}
                  onClick={() => setVisible(false)}
                />

              </div>
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
          nodeRef={toggleRef}
          onStart={() => setWasDragged(false)}
          onDrag={() => setWasDragged(true)}
          onStop={() => {
            setTimeout(() => setWasDragged(false), 200);
          }}
        >
          <div
            ref={toggleRef}
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


      <DetailsModal
        open={openAddAllergy}
        setOpen={setOpenAddAllergy}
        allerges={selectedAllergy}
        setAllerges={setSelectedAllergy}
        edit={false}
        patient={patient}
        encounter={encounter}
        fetchallerges={fetchallerges}
        openToAdd={openAddAllergy}
      />
    </>
  );
};

export default AllergyFloatingButton;
