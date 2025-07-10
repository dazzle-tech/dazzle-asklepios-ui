import React, { useState, useEffect } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { Panel, Row, Col, Form } from 'rsuite';
import { useDeleteDoctorRoundStaffMutation, useGetDoctorRoundStaffListQuery, useSaveDoctorRoundStaffMutation } from '@/services/encounterService';
import { newApDoctorRound, newApDoctorRoundStaff, newApEncounter, newApPatient } from '@/types/model-types-constructor';
import MyInput from '@/components/MyInput';
import { useGetPractitionersQuery } from '@/services/setupService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import StaffAssignment from '../../procedure/StaffMember';
import MyLabel from '@/components/MyLabel';
import RecentTestResults from '../../patient-summary/RecentTestResults';
import PatientChronicMedication from '../../patient-summary/PatientChronicMedication';
import PreObservation from '../../patient-summary/PreObservation/PreObservation';
import IntakeOutputs from '../../patient-summary/IntakeOutputs';
import ChiefComplainSummary from '../../nursing-reports-summary/ChiefComplainSummary/ChiefComplainSummary';
import PainAssessmentSummary from '../../nursing-reports-summary/PainAssessmentSummary';
import GeneralAssessmentSummary from '../../nursing-reports-summary/GeneralAssessmentSummary';
import FunctionalAssessmentSummary from '../../nursing-reports-summary/FunctionalAssessmentSummary/FunctionalAssessmentSummary';
import ReviewOfSystems from '../../../medical-notes-and-assessments/review-of-systems';
import { useLocation, useNavigate } from 'react-router-dom';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { ApDoctorRound, ApEncounter, ApPatient } from '@/types/model-types';

const ViewRound = () => {
    const location = useLocation();
    const { localPatient, localEncounter, localDoctorRound } = location.state || {};
    const [patient, setPatient] = useState<ApPatient>({ ...localPatient });
    const [encounter, setEncounter] = useState<ApEncounter>({ ...localEncounter });
    const [doctorRound, setDoctorRound] = useState<ApDoctorRound>({ ...localDoctorRound });
    const navigate = useNavigate();


    // State to hold the request parameters for fetching practitioners with a specific job role
    const [physicanListRequest, setPhysicanListRequest] = useState<ListRequest>({
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
    // Fetch LOV data for various fields
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
    const { data: patientStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');
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
        <Panel style={{ paddingBottom: '70px' }}>
            <Row gutter={30}>
                <div className='bt-div'>
                    <Form fluid layout="inline">
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLabel="Round Start Time"
                                fieldName="roundStartTime"
                                fieldType="datetime"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLabel="Lead Physician"
                                fieldName="practitionerKey"
                                fieldType="select"
                                selectData={practitionerListResponse?.object ?? []}
                                selectDataLabel="practitionerFullName"
                                selectDataValue="key"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>

                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLabel="Shift"
                                fieldName="shiftLkey"
                                fieldType="select"
                                selectData={shiftsLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                    </Form>
                        <div className='bt-right'>
                            <MyButton
                                onClick={handleGoBack}
                                backgroundColor="gray"
                                prefixIcon={() => <FontAwesomeIcon icon={faArrowLeft} />} >Go Back </MyButton>
                        </div>
                </div>
            </Row>
            <Row gutter={18} aria-disabled>
                <StaffAssignment
                    parentKey={doctorRound?.key}
                    label="Round Staff"
                    getQuery={useGetDoctorRoundStaffListQuery}
                    saveMutation={useSaveDoctorRoundStaffMutation}
                    deleteMutation={useDeleteDoctorRoundStaffMutation}
                    newStaffObj={newApDoctorRoundStaff}
                    filterFieldName="doctorRoundKey"
                    disabled={true}
                />

            </Row>
            <MyLabel label={<h6 >Patient Summary</h6>} />
            <br />
            <Row gutter={18}>
                <Col xs={12}>
                    <PreObservation patient={patient} />
                </Col>
                <Col xs={12}>
                    <RecentTestResults patient={patient} />
                </Col>
            </Row>
            <Row gutter={18}></Row>
            <Row gutter={18}>
                <Col xs={12}>
                    <PatientChronicMedication patient={patient} title="Last 24-h Medications " />
                </Col>
                <Col xs={12}>
                    <IntakeOutputs patient={patient} />
                </Col>
            </Row>
            <br />
            <MyLabel label={<h6 >Nursing Reports Summary</h6>} />
            <br />
            <Row gutter={18}>
                <Col xs={12}>
                    <ChiefComplainSummary patient={patient} encounter={encounter} />
                </Col>
                <Col xs={12}>
                    <PainAssessmentSummary patient={patient} encounter={encounter} />
                </Col>
            </Row>
            <Row gutter={18}></Row>
            <Row gutter={18}>
                <Col xs={12}>
                    <GeneralAssessmentSummary patient={patient} encounter={encounter} />
                </Col>
                <Col xs={12}>
                    <FunctionalAssessmentSummary patient={patient} encounter={encounter} />
                </Col>
            </Row>
            <br />
            <MyLabel label={<h6 >Physical Examination</h6>} />
            <br />
            <Row gutter={18}>
                <ReviewOfSystems patient={patient} encounter={encounter} edit={true} />
            </Row>
            <br />
            <MyLabel label={<h6 >Progress Notes</h6>} />
            <br />
            <Row gutter={30}>
                <div className='bt-div'>
                    <Form fluid layout="inline">
                        <Col xs={32} >
                            <MyInput
                                column
                                width={400}
                                fieldLabel="Initial Note"
                                fieldName="initialNote"
                                fieldType="textarea"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={400}
                                fieldLabel="Progress Note"
                                fieldName="progressNote"
                                fieldType="textarea"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={400}
                                fieldLabel="Special Event Note"
                                fieldName="specialEventNote"
                                fieldType="textarea"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                    </Form>
                </div>
            </Row>
            <br />
            <MyLabel label={<h6 >Assessment</h6>} />
            <Row gutter={30}>
                <div className='bt-div'>
                    <Form fluid layout="inline">
                        <Col xs={32} >
                            <MyInput
                                width={400}
                                column
                                fieldName="primaryDiagnosis"
                                fieldLabel="Primary Diagnosis"
                                fieldType="textarea"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLable="Major"
                                fieldName="major"
                                fieldType="checkbox"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLable="Suspected"
                                fieldName="suspected"
                                fieldType="checkbox"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLable="Clinical Impression "
                                fieldName="clinicalImpression"
                                record={doctorRound}
                                disabled={true}
                            />
                        </Col>
                        <Col xs={32} >
                            <  MyInput
                                column
                                width={200}
                                fieldLabel="Patient Status"
                                fieldName="patientStatusLkey"
                                fieldType="select"
                                selectData={patientStatusLovQueryResponse?.object ?? []}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={doctorRound}
                                disabled={true}
                                searchable={false}
                            />
                        </Col>
                    </Form>
                </div>
            </Row>
            <Row gutter={30}>
                <Form layout='inline' fluid>
                    <Col  >
                        <MyInput
                            column
                            disabled={true}
                            fieldType="textarea"
                            record={doctorRound}
                            fieldLabel="Secondary Diagnoses Selected"
                            fieldName="secondaryDiagnoses"
                            width={400}
                        />
                    </Col>
                    <Col  >
                        <MyInput
                            column
                            fieldType="textarea"
                            fieldLabel="Complications Noted"
                            record={doctorRound}
                            disabled={true}
                            fieldName="complicationsNoted"
                            width={400}
                        />
                    </Col>
                    <Col  >
                        <MyInput
                            column
                            fieldType="textarea"
                            record={doctorRound}
                            disabled={true}
                            fieldLabel="Summary Statement"
                            fieldName="summaryStatement"
                            width={400}
                        />
                    </Col>
                </Form>
            </Row>
        </Panel>
    );
};
export default ViewRound;


