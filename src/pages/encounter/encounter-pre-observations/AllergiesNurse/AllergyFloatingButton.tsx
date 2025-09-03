import React, { useState } from 'react';
import { useGetAllergiesQuery } from '@/services/observationService';
import { useGetAllergensQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHandDots } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest } from '@/types/types';
import './styles.less';

import Draggable from 'react-draggable';
import { FaTimes } from 'react-icons/fa'; // أيقونة X

const AllergyFloatingButton = ({ patientKey }: { patientKey: string }) => {
  const [visible, setVisible] = useState(true);
  const [wasDragged, setWasDragged] = useState(false);

  const listRequest = {
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patientKey
      },
      {
        fieldName: 'status_lkey',
        operator: 'notMatch',
        value: '3196709905099521'
      }
    ]
  };

  const { data: allergiesListResponse, isLoading } = useGetAllergiesQuery(listRequest);
  const { data: allergensListToGetName } = useGetAllergensQuery({ ...initialListRequest });

  const tableColumns = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Type</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale
    },
    {
      key: 'allergenKey',
      dataKey: 'allergenKey',
      title: <Translate>Allergen</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        if (!allergensListToGetName?.object) return 'Loading...';
        const found = allergensListToGetName.object.find(item => item.key === rowData.allergenKey);
        return found?.allergenName || 'No Name';
      }
    },
    {
      key: 'severityLvalue',
      dataKey: 'severityLvalue',
      title: <Translate>Severity</Translate>,
      flexGrow: 1,
      render: (rowData: any) => rowData.severityLvalue?.lovDisplayVale
    }
  ];

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
                data={allergiesListResponse?.object || []}
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
