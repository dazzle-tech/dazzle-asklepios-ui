import React, { useState, useEffect } from 'react';
import '../styles.less';
import { useAppDispatch } from '@/hooks';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { initialListRequest, ListRequest } from '@/types/types';
import MyInput from '@/components/MyInput';
import { notify } from '@/utils/uiReducerActions';
import { faBed } from '@fortawesome/free-solid-svg-icons';
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
const PatientAdmission = ({ open, setOpen, admitToInpatientObject }) => {
  const [admitToInpatient, setAdmitToInpatient] = useState<ApAdmitOutpatientInpatient>({
    ...newApAdmitOutpatientInpatient
  });
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

  // modal content
  const modalContent = (
    <Form fluid>
      <Row>
        <Col md={12}>
          <div style={{ display: 'flex', gap: '5px', alignItems: 'end' }}>
            <Icd10Search
              object={admitToInpatient}
              setOpject={setAdmitToInpatient}
              fieldName="icd10"
              label="Medical Diagnosis"
            />
          </div>
        </Col>
        <Col md={6}>
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
      </Row>
      <Row>
        <Col md={8}>
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
        <Col md={8}>
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
        <Col md={8}>
          <MyInput
            require
            //   column
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
      </Row>
      <Row>
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
      </Row>
    </Form>
  );
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Admit to Inpatient"
      steps={[{ title: 'Admit to Inpatient', icon: <FontAwesomeIcon icon={faBed} /> }]}
      size="60vw"
      bodyheight="500px"
      actionButtonFunction={handleSave}
      content={modalContent}
    />
  );
};
export default PatientAdmission;
