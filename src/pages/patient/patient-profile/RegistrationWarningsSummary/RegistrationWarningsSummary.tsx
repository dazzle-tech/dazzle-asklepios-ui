import MyModal from '@/components/MyModal/MyModal';
import React, { useEffect, useState } from 'react';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetWarningsByTypesQuery } from '@/services/patient/patientAdministrativeWarningsService';
import { Form } from 'rsuite';
import { formatDateWithoutSeconds } from '@/utils';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { PatientAdministrativeWarningsResponseVM } from '@/types/model-types-new';
const RegistrationWarningsSummary = ({ open, setOpen }) => {
  // filter of type
  const [typeFilter, setTypeFilter] = useState({
    types: ['72434655888900', '72468176728600', '5002879774792840']
  });
  // Fetch warnings Lov response
  const { data: warningsLovQueryResponse } = useGetLovValuesByCodeQuery('ADMIN_WARNINGS');
  // Fetch adminstrative warnings list response
  const { data: warnings, isFetching, refetch } = useGetWarningsByTypesQuery({
    types: typeFilter.types && typeFilter.types.length ? typeFilter.types : undefined
  });
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
      title: <Translate>Patient Name</Translate>,
      render: (rowData: PatientAdministrativeWarningsResponseVM) => {
        const fullName = rowData?.patient?.firstName + " " + rowData?.patient?.lastName;

        return (
            <span>{fullName ?? ''}</span>
        );
      }
    },
    {
      key: 'patientMrn',
      title: <Translate>MRN</Translate>,
      render: (rowData: PatientAdministrativeWarningsResponseVM) => {
        const medicalRecordNumber = rowData?.patient?.medicalRecordNumber

        return (
            <span>{medicalRecordNumber ?? ''}</span>
        );
      }
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      render: (rowData: PatientAdministrativeWarningsResponseVM) => {
        const typeLabel = warningsLovQueryResponse?.object?.find(
          (lov: any) => lov?.key === rowData?.warningType
        )?.lovDisplayVale;

        return (
          <>
            <span>{typeLabel ?? rowData?.warningType}</span>
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
            <span className="date-table-style">
              {formatDateWithoutSeconds(rowData.createdDate)}
            </span>
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
            data={ warnings ?? []}
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
   if(open)
    refetch();
  }, [open, refetch]);

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
