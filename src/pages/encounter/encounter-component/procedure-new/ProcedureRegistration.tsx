import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { useSaveProcedureRegistrationMutation } from '@/services/patients/patientProcedureService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { notify } from '@/utils/uiReducerActions';
import React, { useEffect, useState } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import ProcedureStaff from './ProcedureStaff';

const ProcedureRegistration = ({ procedure, setProcedure, setActiveTab }) => {
  const dispatch = useAppDispatch();
  const [proReg, setProReg] = useState<any>({});
  const { data: consentLovQueryResponse } = useGetLovValuesByCodeQuery('CONSENT_FORM');
  const { data: departments } = useGetAllDepartmentsWithoutPaginationQuery(undefined);
  const { data: practitionerListResponse } = useGetAllPractitionersQuery({ page: 0, size: 1000 });
  const [saveRegistration] = useSaveProcedureRegistrationMutation();

  useEffect(() => {
    setProReg({
      consentForm: procedure?.consentForm,
      registrationDateTime: procedure?.registrationDateTime
        ? new Date(procedure.registrationDateTime)
        : null,
      performingDepartmentId: procedure?.performingDepartmentId,
      performingPractitionerId: procedure?.performingPractitionerId
    });
  }, [procedure]);

  const handleSave = async () => {
    try {
      const saved = await saveRegistration({
        id: procedure.id,
        body: {
          ...proReg,
          registrationDateTime: proReg?.registrationDateTime
            ? new Date(proReg.registrationDateTime).toISOString()
            : null
        }
      }).unwrap();
      setProcedure({ ...procedure, ...saved });
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Save failed', sev: 'error' }));
    }
  };
  return (
    <>
      <Panel>
        <Form fluid>
          <Row>
            <Col md={5}>
              <MyInput
                width="100%"
                fieldType="select"
                selectData={consentLovQueryResponse?.object ?? []}
                 selectDataLabel="lovDisplayVale"
 disableByField='isValid'

                selectDataValue="lovDisplayVale"
                fieldName="consentForm"
                record={proReg}
                setRecord={setProReg}
                searchable={false}
              />
            </Col>
            <Col md={5}>
              <MyInput
                width="100%"
                fieldType="datetime"
                fieldName="registrationDateTime"
                record={proReg}
                setRecord={setProReg}
              />
            </Col>
            <Col md={5}>
              <MyInput
                width="100%"
                fieldLabel="Procedure Location"
                fieldName="performingDepartmentId"
                fieldType="select"
                selectData={departments ?? []}
                selectDataLabel="name"
                selectDataValue="id"
                record={proReg}
                setRecord={setProReg}
                searchable={false}
              />
            </Col>
            <Col md={5}>
              <MyInput
                menuMaxHeight={140}
                width="100%"
                fieldName="performingPractitionerId"
                fieldLabel="Practitioner"
                fieldType="select"
                selectData={practitionerListResponse?.data ?? []}
                selectDataLabel="practitionerFirstName"
                selectDataValue="id"
                record={proReg}
                setRecord={setProReg}
                searchable={false}
              />
            </Col>
            <Col md={4}>{procedure?.createdBy}</Col>
          </Row>
          <Row>
            <Col md={22}></Col>
            <Col md={1}>
              <MyButton onClick={handleSave}>Save</MyButton>
            </Col>
          </Row>
        </Form>
      </Panel>
      <ProcedureStaff procedureId={procedure?.id} />
      <Panel>
        <div className="bt-div">
          <div className="bt-right">
            <MyButton onClick={() => setActiveTab('2')}>Complete and Next</MyButton>
          </div>
        </div>
      </Panel>
    </>
  );
};
export default ProcedureRegistration;
