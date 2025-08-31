import React, { useState, useEffect } from 'react';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import { newApAdmitOutpatientInpatient } from '@/types/model-types-constructor';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useSavePatientAdmissionMutation } from '@/services/encounterService';
import { useGetRoomListQuery } from '@/services/setupService';
import { Form, Row, Col } from 'rsuite';
import { ApAdmitOutpatientInpatient } from '@/types/model-types';
import { useGetBedListQuery } from '@/services/setupService';
import { useNavigate } from 'react-router-dom';
import Icd10Search from '@/pages/medical-component/Icd10Search';
import AdvancedModal from '@/components/AdvancedModal';
import { newApPatient } from '@/types/model-types-constructor';
import { ApPatient } from '@/types/model-types';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { newApEncounter } from '@/types/model-types-constructor';
import MyButton from '@/components/MyButton/MyButton';
import './style.less';
import SectionContainer from '@/components/SectionsoContainer';
const PatientAdmission = ({ open, setOpen, admitToInpatientObject }) => {
  const [admitToInpatient, setAdmitToInpatient] = useState<ApAdmitOutpatientInpatient>({
    ...newApAdmitOutpatientInpatient
  });
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [encounter, setEncounter] = useState<any>({ ...newApEncounter });
  const [showPreviousAdmission, setShowPreviousAdmission] = useState(false);

  const inpatientDepartmentListResponse = useGetResourceTypeQuery('4217389643435490');
  const navigate = useNavigate();
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'department_key',
        operator: 'match',
        value: admitToInpatient?.admissionDepartmentKey
      }
    ],
    pageSize: 100
  });

  const [bedListRequest, setBedListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 100,
    filters: [
      {
        fieldName: 'room_key',
        operator: 'match',
        value: admitToInpatient?.roomKey
      },
      {
        fieldName: 'status_lkey',
        operator: 'match',
        value: '5258243122289092'
      }
    ]
  });
  // Fetch Room list response
  const { data: roomListResponseLoading } = useGetRoomListQuery(listRequest);
  const dispatch = useAppDispatch();
  const [saveAdmitToInpatient] = useSavePatientAdmissionMutation();
  const { data: fetchBedsListQueryResponce } = useGetBedListQuery(bedListRequest, {
    skip: !admitToInpatient?.roomKey
  });

  // lov query response
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

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
  const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);

  // handle save To admit outpatient to inpatient function
  const handleSave = async () => {
    try {
      await saveAdmitToInpatient({
        ...admitToInpatient
      }).unwrap();
      navigate('/inpatient-encounters-list');
      dispatch(notify({ msg: 'Admit Successfully', sev: 'success' }));
      setOpen(false);
      setAdmitToInpatient({ ...newApAdmitOutpatientInpatient });
    } catch (error) {}
  };
  // use Effect
  useEffect(() => {
    setAdmitToInpatient({
      ...admitToInpatientObject,
      admissionDepartmentKey: admitToInpatientObject?.inpatientDepartmentKey
    });
  }, [admitToInpatientObject]);
  useEffect(() => {
    setListRequest(prev => {
      let updatedFilters = [...(prev.filters || [])];
      updatedFilters = updatedFilters.filter(f => f.fieldName !== 'department_key');
      if (admitToInpatient) {
        updatedFilters.push({
          fieldName: 'department_key',
          operator: 'match',
          value: admitToInpatient?.admissionDepartmentKey
        });
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [admitToInpatient]);
  useEffect(() => {
    setBedListRequest(prev => {
      let updatedFilters = [...(prev.filters || [])];
      updatedFilters = updatedFilters.filter(f => f.fieldName !== 'room_key');
      if (admitToInpatient) {
        updatedFilters.push({
          fieldName: 'room_key',
          operator: 'match',
          value: admitToInpatient?.roomKey
        });
      }

      return {
        ...prev,
        filters: updatedFilters
      };
    });
  }, [admitToInpatient]);

  // right modal content
  const rightModalContent = (
    <Form fluid>
      <div className="fields-containerss margin-top-10">
        <Col md={12}>
          <div className="dis-flex">
            <Icd10Search
              object={admitToInpatient}
              setOpject={setAdmitToInpatient}
              fieldName="icd10"
              label="Medical Diagnosis"
            />
          </div>
        </Col>
        <Col md={6} className="margin-n">
          <MyInput
            require
            fieldLabel="Admission Department"
            fieldType="select"
            fieldName="admissionDepartmentKey"
            selectData={inpatientDepartmentListResponse?.data?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
          />
        </Col>
      </div>

      <div className="fields-containerss margin-top-9">
        <Col md={6}>
          <MyInput
            require
            fieldLabel="Select Room"
            fieldType="select"
            fieldName="roomKey"
            selectData={roomListResponseLoading?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
            searchable={false}
          />
        </Col>
        <Col md={6}>
          <MyInput
            require
            fieldLabel="Select Bed"
            fieldType="select"
            fieldName="bedKey"
            selectData={fetchBedsListQueryResponce?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            searchable={false}
            width="100%"
          />
        </Col>
        <Col md={6}>
          <MyInput
            require
            fieldLabel="Responsible Department"
            fieldType="select"
            fieldName="inpatientDepartmentKey"
            selectData={inpatientDepartmentListResponse?.data?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
            disabled
          />
        </Col>
      </div>

      {/* New Row for Resident and Secondary Physicians */}
      <div className="fields-containerss margin-top-10">
        <Col md={6}>
          <MyInput
            require
            fieldLabel="Responsible physician"
            fieldType="select"
            fieldName="physicianKey"
            selectData={practitionerListResponse?.object ?? []}
            selectDataLabel="practitionerFullName"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
            disabled
          />
        </Col>
        <Col md={6}>
          <MyInput
            fieldLabel="Resident"
            fieldType="select"
            fieldName="residentKey"
            selectData={practitionerListResponse?.object ?? []}
            selectDataLabel="practitionerFullName"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
          />
        </Col>
        <Col md={6}>
          <MyInput
            fieldLabel="Secondary Physicians"
            fieldType="multiselect"
            fieldName="secondaryPhysicianKeys"
            selectData={practitionerListResponse?.object ?? []}
            selectDataLabel="practitionerFullName"
            selectDataValue="key"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
          />
        </Col>
      </div>

      {/* Last Admission Date and View Previous Admission Button */}
      <div className="fields-containerss margin-top-10">
        <Col md={6}>
          <MyInput
            fieldLabel="Last Admission Date"
            fieldType="text"
            fieldName="lastAdmissionDate"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width={232}
            disabled
            readOnly
          />
        </Col>
        <Col md={8}>
          <div className="margin-top-23">
            <MyButton
              appearance="primary"
              onClick={() => setShowPreviousAdmission(!showPreviousAdmission)}
            >
              View Previous Admission
            </MyButton>
          </div>
        </Col>
      </div>

      {/* Previous Admission Details - Show/Hide based on button click */}
      <div className="margin-top-bottom-10">
        {showPreviousAdmission && (
          <SectionContainer
            title="Conclusion"
            content={
              <>
                <div className="fields-containerss">
                  <Col md={6}>
                    <MyInput
                      fieldLabel="Date of Previous Admission"
                      fieldType="text"
                      fieldName="previousAdmissionDate"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width="100%"
                      disabled
                      readOnly
                    />
                  </Col>
                  <Col md={6}>
                    <MyInput
                      fieldLabel="Period in Days"
                      fieldType="text"
                      fieldName="periodInDays"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width={310}
                      disabled
                      readOnly
                    />
                  </Col>
                </div>
                <div className="fields-containerss margin-top-10">
                  <Col md={6}>
                    <MyInput
                      fieldLabel="Status of Discharge"
                      fieldType="text"
                      fieldName="statusOfDischarge"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width="100%"
                      disabled
                      readOnly
                    />
                  </Col>
                  <Col md={8}>
                    <MyInput
                      fieldLabel="Responsible Physician of Last Admission"
                      fieldType="text"
                      fieldName="responsiblePhysicianLastAdmission"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width={310}
                      disabled
                      readOnly
                    />
                  </Col>
                </div>
                <div className="fields-containerss margin-top-10">
                  <Col md={6}>
                    <MyInput
                      fieldLabel="Specialty of Last Admission"
                      fieldType="text"
                      fieldName="specialtyLastAdmission"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width="100%"
                      disabled
                      readOnly
                    />
                  </Col>
                  <Col md={8}>
                    <MyInput
                      fieldLabel="Department Discharge Patient for Last Admission"
                      fieldType="text"
                      fieldName="departmentDischargeLastAdmission"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width="100%"
                      disabled
                      readOnly
                    />
                  </Col>
                </div>
                <div className="fields-containerss margin-top-10">
                  <Col md={12}>
                    <MyInput
                      fieldLabel="Discharge Diagnosis for Last Admission"
                      fieldType="textarea"
                      fieldName="dischargeDiagnosisLastAdmission"
                      record={admitToInpatient}
                      setRecord={setAdmitToInpatient}
                      width="100%"
                      disabled
                      readOnly
                    />
                  </Col>
                </div>
              </>
            }
          />
        )}
      </div>
      {/* Original textarea fields */}
      <div className="fields-containerss margin-top-10">
        <Col md={12}>
          <MyInput
            fieldType="textarea"
            fieldLabel="Handoff Information"
            fieldName="handoffInformation"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
          />
        </Col>
        <Col md={12}>
          <MyInput
            fieldType="textarea"
            fieldLabel="Reason of Admission"
            fieldName="reasonOfAdmission"
            record={admitToInpatient}
            setRecord={setAdmitToInpatient}
            width="100%"
          />
        </Col>
      </div>
    </Form>
  );
  // let modalContent;
  const leftModalContent = (
    <Form fluid layout="inline" className="fields-container">
      <MyInput
        width={200}
        column
        fieldLabel="Patient Name"
        fieldName="fullName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled
      />
      <MyInput
        width={200}
        column
        fieldLabel="Patient MRN"
        fieldName="patientMrn"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled
      />
      <MyInput
        width={200}
        column
        fieldLabel="Gender"
        fieldType="select"
        fieldName="genderLkey"
        selectData={genderLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled
      />

      <MyInput
        width={200}
        column
        fieldType="date"
        fieldLabel="Date of Birth"
        fieldName="dateofBirth"
        record={admitToInpatient}
        setRecord={setAdmitToInpatient}
        disabled
      />
      <MyInput
        width={200}
        column
        fieldType="number"
        fieldLabel="Age"
        fieldName="age"
        record={admitToInpatient}
        setRecord={setAdmitToInpatient}
        disabled
      />
      <MyInput
        column
        fieldLabel="Responsible physician"
        fieldType="select"
        fieldName="physicianKey"
        selectData={practitionerListResponse?.object ?? []}
        selectDataLabel="practitionerFullName"
        selectDataValue="key"
        record={admitToInpatient}
        setRecord={setAdmitToInpatient}
        width={200}
        disabled
      />
      <MyInput
        width={200}
        fieldType="textarea"
        fieldLabel="Diagnosis"
        fieldName="diagnosis"
        record={encounter}
        setRecord={setEncounter}
        disabled
      />
    </Form>
  );
  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        leftTitle="Patient Information"
        rightTitle="Admit to Inpatient"
        leftContent={leftModalContent}
        rightContent={rightModalContent}
        actionButtonLabel="Admit"
        actionButtonFunction={handleSave}
        leftWidth="19%"
        rightWidth="81%"
      />
    </>
  );
};
export default PatientAdmission;
