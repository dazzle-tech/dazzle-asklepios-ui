import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetPatientAdministrativeWarningsQuery } from '@/services/patientService';
import { Form } from 'rsuite';
import { formatDateWithoutSeconds } from '@/utils';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
const RegistrationWarningsSummary = ({ open, setOpen }) => {
  // filter of type
  const [typeFilter, setTypeFilter] = useState({
    types: ['72434655888900', '72468176728600', '5002879774792840']
  });
  const [warningsAdmistritiveListRequest, setWarningsAdmistritiveListRequest] =
    useState<ListRequest>({
      ...initialListRequest
    });
  // Fetch warnings Lov response
  const { data: warningsLovQueryResponse } = useGetLovValuesByCodeQuery('ADMIN_WARNINGS');
  // Fetch adminstrative warnings list response
  const { data: warnings, isFetching } = useGetPatientAdministrativeWarningsQuery(
    warningsAdmistritiveListRequest
  );

  // filter for table
  const filters = () => (
    <Form layout="inline" fluid>
      <div className="switch-dep-dev">
        <MyInput
          column
          width={250}
          fieldName="types"
          fieldType="checkPicker"
          selectData={warningsLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          fieldLabel="Type"
          selectDataValue="key"
          record={typeFilter}
          setRecord={setTypeFilter}
          searchable={false}
        />
      </div>
    </Form>
  );

  // Table columns definition
  const tableColumns = [
    {
      key: 'fullName',
      title: <Translate>Patient Name</Translate>
    },
    {
      key: 'patientMrn',
      title: <Translate>MRN</Translate>
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData?.warningTypeLvalue?.lovDisplayVale}</span>
          </>
        );
      }
    },
    {
      key: '',
      title: <Translate>Created By/At</Translate>,
      render: (rowData: any) => {
        return (
          <>
            <span>{rowData.createdBy}</span>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(rowData.createdAt)}</span>
          </>
        );
      }
    }
  ];

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <MyTable
            data={warnings?.object ?? []}
            columns={tableColumns}
            height={300}
            loading={isFetching}
            filters={filters()}
          />
        );
    }
  };

  // Effects
  useEffect(() => {
    setWarningsAdmistritiveListRequest({
      ...initialListRequest,
      filters:
        typeFilter['types'].length > 0
          ? [
              {
                fieldName: 'warning_type_lkey',
                operator: 'in',
                value: typeFilter['types'].map(key => `(${key})`).join(' ')
              }
            ]
          : []
    });
  }, [typeFilter]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Registration Warnings Summary"
      position="right"
      content={conjureFormContent}
      hideActionBtn
      steps={[
        {
          title: 'Registration Warnings Summary',
          icon: <FontAwesomeIcon icon={faTriangleExclamation} />
        }
      ]}
    />
  );
};
export default RegistrationWarningsSummary;
