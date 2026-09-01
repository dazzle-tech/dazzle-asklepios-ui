import React, { useState } from 'react';
import { Form, Panel, Stack } from 'rsuite';

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import PrintStimulsoftReportButton from '@/components/PrintStimulsoftReportButton';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';
import { newDepartment } from '@/types/model-types-constructor-new';
import { Department } from '@/types/model-types-new';

const PatientEncounterReportPage = () => {
  const [department, setDepartment] = useState<Department>({
    ...newDepartment,
  });
  const [status, setStatus] = useState({ value: '' });
  const [paginationParam] = useState({
    page: 0,
    size: 1000,
    sort: 'id,asc',
  });

  const { data: departmentListResponse } = useGetDepartmentsQuery(paginationParam);
  const TreatmentStatusEnum = useEnumOptions('TreatmentStatus');

  return (
    <div style={{ padding: 24 }}>
      <Panel bordered header="Patient Encounter Report">
        <Form>
          <MyInput
            column
            fieldLabel="Select Departments"
            fieldType="select"
            fieldName="id"
            selectData={departmentListResponse?.data ?? []}
            selectDataLabel="name"
            selectDataValue="id"
            width={250}
            record={department}
            setRecord={setDepartment}
            required
          />
          <MyInput
            column
            width={260}
            fieldType="select"
            fieldLabel="Treatment Status"
            fieldName="value"
            selectData={TreatmentStatusEnum}
            selectDataLabel="label"
            selectDataValue="value"
            record={status}
            setRecord={setStatus}
          />
        </Form>

        <Stack spacing={12} style={{ marginTop: 12 }}>
          <PrintStimulsoftReportButton
            templateCode="PATIENT_ENCOUNTER"
            departmentId={department?.id}
            status={status?.value}
            tooltip="Print Report"
            disabled={!department?.id}
          >
            <Translate>Print Report</Translate>
          </PrintStimulsoftReportButton>
        </Stack>
      </Panel>
    </div>
  );
};

export default PatientEncounterReportPage;
