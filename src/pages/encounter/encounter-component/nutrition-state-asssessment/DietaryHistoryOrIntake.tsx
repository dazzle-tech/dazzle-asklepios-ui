import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetAllergiesQuery } from '@/services/observationService';
import { useGetAllergensQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Col, Row } from 'rsuite';
import "./styles.less";
const DietaryHistoryOrIntake = ({ object, setObject }) => {
  const location = useLocation();
  const { patient } = location.state || {};
  const [allerges, setAllerges] = useState({});
  const [listRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient.key
      },
      {
        fieldName: 'allergy_type_lkey',
        operator: 'match',
        value: '7957051243851240'
      }
    ]
  });
  // Fetch allergies list response
  const { data: allergiesListResponse } = useGetAllergiesQuery(listRequest);

  // Fetch fluid intake Types lov response
  const { data: fluidIntakeTypesLovQueryResponse } =
    useGetLovValuesByCodeQuery('FLUID_INTAKE_TYPES');
  // Fetch allergens List response
  const { data: allergensListToGetName } = useGetAllergensQuery({
    ...initialListRequest
  });

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && allerges && rowData.key === allerges.key) {
      return 'selected-row';
    } else return '';
  };

  // table columns
  const tableColumns = [
    {
      key: 'allergyTypeLvalue',
      dataKey: 'allergyTypeLvalue',
      title: <Translate>Allergy Type</Translate>,
      flexGrow: 2,
      render: (rowData: any) => rowData.allergyTypeLvalue?.lovDisplayVale
    },
    {
      key: 'allergenKey',
      dataKey: 'allergenKey',
      title: <Translate>Allergen</Translate>,
      flexGrow: 2,
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
    },
    {
      key: 'onsetDate',
      dataKey: 'onsetDate',
      title: <Translate>Onset Date Time</Translate>,
      flexGrow: 2,
      render: (rowData: any) =>
        rowData.onsetDate ? new Date(rowData.onsetDate).toLocaleDateString('en-GB') : 'Undefined'
    }
  ];

  return (
    <div>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="usualDietPattern"
            record={object}
            setRecord={setObject}
          />
        </Col>
        <Col md={12}>
          <MyInput width="100%" fieldName="24-HourRecall" record={object} setRecord={setObject} />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            fieldType="select"
            fieldName="oralIntakeType"
            selectData={fluidIntakeTypesLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            width="100%"
            record={object}
            setRecord={setObject}
            searchable={false}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="fluidIntakeStatus"
            record={object}
            setRecord={setObject}
            disabled
          />
        </Col>
      </Row>
      <Row className='table-container-nutrition'>
        <MyTable
          height={300}
          columns={tableColumns}
          data={allergiesListResponse?.object || []}
          onRowClick={rowData => {
            setAllerges(rowData);
          }}
          rowClassName={isSelected}
          sortColumn={listRequest.sortBy}
          sortType={listRequest.sortType}
        />
      </Row>
      <Row>
        <MyInput
          width="100%"
          fieldName="notes"
          fieldType="textarea"
          record={object}
          setRecord={setObject}
        />
      </Row>
    </div>
  );
};
export default DietaryHistoryOrIntake;
