import React, { useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { Col, Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from '@/components/MyButton/MyButton';
import CheckIcon from '@rsuite/icons/Check';
const RoundInfo = ({ doctorRound, setDoctorRound, saveAndComplete, handleStartNewRound }) => {
  const [physicanListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153854130600'
      }
    ],
    pageSize: 1000
  });
  // Fetch practitioners list response
  const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
  // Fetch shifts lov response
  const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');

  return (
    <Form fluid layout="inline" className="container-of-round-info">
      <div>
        <Col xs={32}>
          <MyInput
            width={150}
            fieldLabel="Round Start Time"
            fieldName="roundStartTime"
            fieldType="datetime"
            record={doctorRound}
            setRecord={setDoctorRound}
            disabled={doctorRound?.key}
          />
        </Col>
        <Col xs={32}>
          <MyInput
            width={150}
            fieldLabel="Lead Physician"
            fieldName="practitionerKey"
            fieldType="select"
            selectData={practitionerListResponse?.object ?? []}
            selectDataLabel="practitionerFullName"
            selectDataValue="key"
            record={doctorRound}
            setRecord={setDoctorRound}
            disabled={doctorRound?.key}
          />
        </Col>
        <Col xs={32}>
          <MyInput
            width={150}
            fieldLabel="Shift"
            fieldName="shiftLkey"
            fieldType="select"
            selectData={shiftsLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={doctorRound}
            setRecord={setDoctorRound}
            disabled={doctorRound?.key}
          />
        </Col>
        <Col xs={32}>
          <div className="search-btn">
            <MyButton
              prefixIcon={() => <CheckIcon />}
              color="var(--deep-blue)"
              onClick={handleStartNewRound}
              disabled={doctorRound?.key}
            >
              Start New Round
            </MyButton>
          </div>
        </Col>
      </div>
      <div>{saveAndComplete()}</div>
    </Form>
  );
};
export default RoundInfo;
