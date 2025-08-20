import React, { useState, useEffect } from 'react';
import { Panel, Row, Col, Text, Form } from 'rsuite';
import {
  useDeleteDoctorRoundStaffMutation,
  useGetDoctorRoundStaffListQuery,
  useSaveDoctorRoundStaffMutation
} from '@/services/encounterService';
import {
  newApDoctorRoundStaff,
} from '@/types/model-types-constructor';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import StaffAssignment from '../../procedure/StaffMember';
import MyLabel from '@/components/MyLabel';
import { useLocation, useNavigate } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ApDoctorRound, ApEncounter, ApPatient } from '@/types/model-types';
import SectionContainer from '@/components/SectionsoContainer';
import RoundInfo from './RoundInfo';
import ProgressNotes from './ProgressNotes';
import Assessment from './Assessment';
import PatientSummary from './PatientSummary';
import NursingReportsSummary from './NursingReportsSummary';
import PhysicalExamination from './PhysicalExamination';

const ViewRound = () => {
  const location = useLocation();
  const { localPatient, localEncounter, localDoctorRound } = location.state || {};
  const [patient, setPatient] = useState<ApPatient>({ ...localPatient });
  const [encounter, setEncounter] = useState<ApEncounter>({ ...localEncounter });
  const [doctorRound, setDoctorRound] = useState<ApDoctorRound>({ ...localDoctorRound });
  const navigate = useNavigate();

  // handle go back function
  const handleGoBack = () => {
    navigate(-1);
  };

  // Effects
  useEffect(() => {
    setPatient({ ...localPatient });
  }, [localPatient]);

  useEffect(() => {
    setEncounter({ ...localEncounter });
  }, [localEncounter]);

  useEffect(() => {
    setDoctorRound({ ...localDoctorRound });
  }, [localDoctorRound]);

  return (
     <Row gutter={15} className="d cont">
      <Form fluid>
        <div className='back-btn-round'>
        <MyButton
              onClick={handleGoBack}
              backgroundColor="gray"
              prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />}
            >
              Go Back{' '}
            </MyButton>
            </div>
           <Row>            
            <SectionContainer
              title={<Text>Round Information</Text>}
              content={
                <RoundInfo
                  doctorRound={doctorRound}
                  setDoctorRound={setDoctorRound}
                  saveAndComplete={() => {}}
                  handleStartNewRound={() => {}}
                  view
                />
              }
            />
            </Row>
        <Row>
            <Col md={12}>
        <StaffAssignment
          parentKey={doctorRound?.key}
          label="Round Staff"
          getQuery={useGetDoctorRoundStaffListQuery}
          saveMutation={useSaveDoctorRoundStaffMutation}
          deleteMutation={useDeleteDoctorRoundStaffMutation}
          newStaffObj={newApDoctorRoundStaff}
          filterFieldName="doctorRoundKey"
          disabled={true}
          width={200}
        />
        </Col>
         <Col md={12}>
        <SectionContainer
          title={<Text>Progress Notes</Text>}
          content={
            <ProgressNotes
              doctorRound={doctorRound}
              setDoctorRound={setDoctorRound}
              doctorRoundList=""
              view
            />
          }
        />
        </Col>
       </Row>
       <Row>
        <SectionContainer
          title={<Text>Assessment</Text>}
          content={
            <Assessment
              doctorRound={doctorRound}
              setDoctorRound={setDoctorRound}
              recordOfIndicationsDescription=""
              setRecordOfIndicationsDescription=""
              view
            />
          }
        />
          </Row>
          <Row>
        <SectionContainer
          title={<Text>Patient Summary</Text>}
          content={<PatientSummary patient={patient} />}
        />
        </Row>
          
          <Row>
        <SectionContainer
          title={<Text>Nursing Reports Summary</Text>}
          content={<NursingReportsSummary patient={patient} encounter={encounter} />}
        />
     </Row>
        <Row>
        <SectionContainer
          title={<Text>Physical Examination</Text>}
          content={<PhysicalExamination patient={patient} encounter={encounter} edit="" />}
        />
       </Row>

    </Form>
    </Row>
  );
};
export default ViewRound;
