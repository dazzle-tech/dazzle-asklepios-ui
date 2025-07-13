import React, { useState, useEffect } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { Panel, Row, Col, Form, InputGroup, Input, Dropdown } from 'rsuite';
import { useDeleteDoctorRoundStaffMutation, useGetDoctorRoundsListQuery, useGetDoctorRoundStaffListQuery, useSaveDoctorRoundMutation, useSaveDoctorRoundStaffMutation } from '@/services/encounterService';
import { newApDoctorRound, newApDoctorRoundStaff } from '@/types/model-types-constructor';
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
import { useGetIcdListQuery } from '@/services/setupService';
import FunctionalAssessmentSummary from '../../nursing-reports-summary/FunctionalAssessmentSummary/FunctionalAssessmentSummary';
import SearchIcon from '@rsuite/icons/Search';
import ReviewOfSystems from '../../../medical-notes-and-assessments/review-of-systems';
import { ApDoctorRound } from '@/types/model-types';
import CheckIcon from '@rsuite/icons/Check';
import MyButton from '@/components/MyButton/MyButton';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileAlt } from '@fortawesome/free-solid-svg-icons';
import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';

const NewRound = ({ patient, encounter, edit,setIsConfirmedRound }) => {
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedicd10, setSelectedIcd10] = useState({ text: '' });
    const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: '' });
    const [doctorRound, setDoctorRound] = useState<ApDoctorRound>({ ...newApDoctorRound });
    const authSlice = useAppSelector(state => state.auth);
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [recordOfIndicationsDescription, setRecordOfIndicationsDescription] = useState({ indicationsDescription: '' });
    const dispatch = useAppDispatch();

    const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
    // Define the mutation hook to save a doctor round and get the mutation state
    const [saveRound, saveRoundMutation] = useSaveDoctorRoundMutation();

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
    // State to hold the request parameters for fetching doctor rounds related to the current patient and encounter
    const [roundListRequest, setRoundListRequest] = useState({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key,
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key,
            },
        ],
    });
    // Fetch the list of doctor rounds based on the current filters.
    // Skip the query if patient or encounter keys are not available.
    const { data: doctorRoundList, isLoading } = useGetDoctorRoundsListQuery(roundListRequest, {
        skip: !patient?.key || !encounter?.key,
    });
    // Fetch LOV data for various fields
    const { data: practitionerListResponse } = useGetPractitionersQuery(physicanListRequest);
    const { data: shiftsLovQueryResponse } = useGetLovValuesByCodeQuery('SHIFTS');
    const { data: patientStatusLovQueryResponse } = useGetLovValuesByCodeQuery('PATIENT_STATUS');

    // Initialize the state for ICD list request with default values
    const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
    const [secondlistIcdRequest, setSecondListIcdRequest] = useState({ ...initialListRequest });

    // Fetch ICD list data based on the current request parameters
    const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
    const { data: secondIcdListResponseData } = useGetIcdListQuery(secondlistIcdRequest);

    // Transform the ICD list data by combining the ICD code and description into a single label for easier display
    const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    // Similarly, transform the second ICD list data with the combined label for consistent display format

    const secondlistForICD10 = (secondIcdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));

    // handle Start New Round Function
    const handleStartNewRound = async () => {
        dispatch(showSystemLoader());
        try {
            if (!doctorRound?.key) {
                await saveRound({
                    ...doctorRound,
                    patientKey: patient.key,
                    encounterKey: encounter.key,
                    statusLkey: "91063195286200",
                    roundStartTime: doctorRound?.roundStartTime
                        ? new Date(doctorRound?.roundStartTime).getTime()
                        : 0,
                    secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
                    createdBy: authSlice.user.key
                }).unwrap();

                dispatch(notify({ msg: 'New Round Started Successfully', sev: 'success' }));
            } else {
                await saveRound({
                    ...doctorRound,
                    secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
                    updatedBy: authSlice.user.key
                }).unwrap();

                dispatch(notify({ msg: ' Round Updated Successfully', sev: 'success' }));
            }
        } catch (error) {
            console.error("Failed to Start New Round:", error);
            dispatch(notify({ msg: 'Failed to Start New Round', sev: 'error' }));
        } finally {
            dispatch(hideSystemLoader());
        }
    };

    // handle Complete Round Function
    const handleCompleteRound = async () => {
        dispatch(showSystemLoader());

        try {
            await handleStartNewRound();

            await saveRound({
                ...doctorRound,
                statusLkey: "91109811181900",
                secondaryDiagnoses: recordOfIndicationsDescription?.indicationsDescription,
                updatedBy: authSlice.user.key
            }).unwrap();

            dispatch(notify({ msg: 'Round Completed Successfully', sev: 'success' }));

            setDoctorRound({
                ...newApDoctorRound,
                major: false,
                suspected: false,
                shiftLkey: null,
                patientStatusLkey: null,
                statusLkey: "91063195286200",
            });
            setIsConfirmedRound(true);
            setSelectedIcd10({ text: '' });
            setRecordOfIndicationsDescription({ indicationsDescription: '' });

        } catch (error) {
            console.error("Failed to Complete Round:", error);
            dispatch(notify({ msg: 'Failed to Complete Round', sev: 'error' }));
        } finally {
            dispatch(hideSystemLoader());
        }
    };

    // Handle the search input for the first search field ICD 10
    const handleSearch = value => {
        setSearchKeyword(value);
    };


    // Effects
    useEffect(() => {
        if (indicationsIcd.indications != null) {
            const currentIcd = secondIcdListResponseData?.object?.find(
                item => item.key === indicationsIcd.indications
            );
            if (!currentIcd) return;

            const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;

            setindicationsDescription(prev => {
                const updated = prev ? `${prev}\n${newEntry}` : newEntry;
                setRecordOfIndicationsDescription({
                    indicationsDescription: updated
                });
                return updated;
            });
        }
    }, [indicationsIcd.indications]);
    useEffect(() => {
        if (saveRoundMutation && saveRoundMutation.status === 'fulfilled') {
            setDoctorRound(saveRoundMutation.data);
        }
    }, [saveRoundMutation]);
    useEffect(() => {
        if (recordOfSearch['searchKeyword'].trim() !== '') {
            setSecondListIcdRequest({
                ...initialListRequest,
                filterLogic: 'or',
                filters: [
                    {
                        fieldName: 'icd_code',
                        operator: 'containsIgnoreCase',
                        value: recordOfSearch['searchKeyword']
                    },
                    {
                        fieldName: 'description',
                        operator: 'containsIgnoreCase',
                        value: recordOfSearch['searchKeyword']
                    }
                ]
            });
        }
    }, [recordOfSearch['searchKeyword']]);
    useEffect(() => {
        if (isLoading || saveRoundMutation.isLoading) {
            dispatch(showSystemLoader());
        } else {
            dispatch(hideSystemLoader());
        }
        return () => {
            dispatch(hideSystemLoader());
        };
    }, [isLoading, saveRoundMutation.isLoading, dispatch]);
    useEffect(() => {
        if (!patient?.key || !encounter?.key) return;

        const filters = [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            },
            {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter.key
            },
        ];

        setRoundListRequest(prev => ({
            ...prev,
            filters
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        const list = doctorRoundList?.object ?? [];

        if (list.length === 0) {
            setDoctorRound({ ...newApDoctorRound });
            return;
        }

        const openRound = list.find(item => item.statusLkey !== '91109811181900');

        if (openRound) {
            setDoctorRound({ ...openRound });
            setSelectedIcd10({ text: openRound.primaryDiagnosis });
            setRecordOfIndicationsDescription({
                indicationsDescription: openRound.secondaryDiagnoses,
            });

            setRoundListRequest(prev => {
                const newFilters = prev.filters.filter(
                    f => f.fieldName !== 'key' && f.fieldName !== 'status_lkey'
                );

                return {
                    ...prev,
                    filters: [
                        ...newFilters,
                        {
                            fieldName: 'key',
                            operator: 'match',
                            value: openRound.key,
                        },
                        {
                            fieldName: 'status_lkey',
                            operator: 'notMatch',
                            value: '91109811181900',
                        },
                    ],
                };
            });
        } else {
            const firstItem = list[0];
            setDoctorRound({
                ...newApDoctorRound,
                initialNote: firstItem?.initialNote || '',
            });
            setRoundListRequest(prev => {
                const newFilters = prev.filters.filter(
                    f => f.fieldName !== 'key' && f.fieldName !== 'status_lkey'
                );

                return {
                    ...prev,
                    filters: newFilters,
                };
            });
        }
    }, [doctorRoundList]);



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
                                setRecord={setDoctorRound}
                                disabled={doctorRound?.key}
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
                                setRecord={setDoctorRound}
                                disabled={doctorRound?.key}
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
                                </MyButton></div>
                        </Col>

                    </Form>
                </div>
            </Row>
            <Row gutter={18}>
                <StaffAssignment
                    parentKey={doctorRound?.key}
                    label="Round Staff"
                    getQuery={useGetDoctorRoundStaffListQuery}
                    saveMutation={useSaveDoctorRoundStaffMutation}
                    deleteMutation={useDeleteDoctorRoundStaffMutation}
                    newStaffObj={newApDoctorRoundStaff}
                    filterFieldName="doctorRoundKey"
                    width={200}
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
                <ReviewOfSystems patient={patient} encounter={encounter} edit={edit} />
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
                                width={350}
                                fieldLabel="Initial Note"
                                fieldName="initialNote"
                                fieldType="textarea"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key || (doctorRoundList?.object?.[0]?.initialNote ?? '') !== ''}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={350}
                                fieldLabel="Progress Note"
                                fieldName="progressNote"
                                fieldType="textarea"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={350}
                                fieldLabel="Special Event Note"
                                fieldName="specialEventNote"
                                fieldType="textarea"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
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
                            <Form fluid layout="inline" className='container-search-field'>
                                <div className='content-div-search-field'>
                                    <InputGroup className='content-input-search-field' inside>
                                        <Input placeholder={'Search ICD-10'} value={searchKeyword} onChange={handleSearch} disabled={!doctorRound?.key} />
                                        <InputGroup.Button>
                                            <SearchIcon />
                                        </InputGroup.Button>
                                    </InputGroup>
                                    {searchKeyword && (
                                        <div className="dropdown-menu-icd">
                                            {modifiedData?.map(mod => (
                                                <div
                                                    key={mod.key}
                                                    onClick={() => {
                                                        setDoctorRound({
                                                            ...doctorRound,
                                                            primaryDiagnosis: mod.combinedLabel
                                                        });
                                                        setSelectedIcd10({ text: mod.combinedLabel });
                                                        setSearchKeyword('');
                                                    }}
                                                    className='dropdown-menu-icd-item' >
                                                    <span>{mod.icdCode}</span>
                                                    <span>{mod.description}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <MyInput
                                    width={200}
                                    column
                                    fieldLabel="Primary Diagnosis"
                                    fieldName="text"
                                    record={selectedicd10}
                                    disabled={true}
                                />
                            </Form>
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={100}
                                fieldLable="Major"
                                fieldName="major"
                                fieldType="checkbox"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={100}
                                fieldLable="Suspected"
                                fieldName="suspected"
                                fieldType="checkbox"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
                            />
                        </Col>
                        <Col xs={32} >
                            <MyInput
                                column
                                width={200}
                                fieldLable="Clinical Impression "
                                fieldName="clinicalImpression"
                                record={doctorRound}
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
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
                                setRecord={setDoctorRound}
                                disabled={!doctorRound?.key}
                                searchable={false}
                            />
                        </Col>
                    </Form>
                </div>
            </Row>
            <Row gutter={30}>
                <Form layout='inline' fluid>
                    <Col xs={32} >
                        <MyInput
                            width={200}
                            fieldLabel="Secondary Diagnoses"
                            fieldName="searchKeyword"
                            record={recordOfSearch}
                            setRecord={setRecordOfSearch}
                            rightAddon={<SearchIcon />}
                            disabled={!doctorRound?.key}
                        />
                        <div className="container-of-menu-diagnostic">
                            {recordOfSearch['searchKeyword'] && (
                                <Dropdown.Menu className="menu-diagnostic">
                                    {secondlistForICD10?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setIndicationsIcd({
                                                    ...indicationsIcd,
                                                    indications: mod.key
                                                });
                                                setRecordOfSearch({ searchKeyword: '' });
                                            }}
                                        >
                                            <span>{mod.icdCode} </span>
                                            <span>{mod.description}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            )}
                        </div>
                    </Col>
                    <Col  >
                        <MyInput
                            column
                            disabled={true}
                            fieldType="textarea"
                            record={recordOfIndicationsDescription}
                            setRecord={setRecordOfIndicationsDescription}
                            fieldLabel="Secondary Diagnoses Selected"
                            fieldName="indicationsDescription"
                            width={270}
                        />
                    </Col>
                    <Col  >
                        <MyInput
                            column
                            disabled={!doctorRound?.key}
                            fieldType="textarea"
                            fieldLabel="Complications Noted"
                            record={doctorRound}
                            setRecord={setDoctorRound}
                            fieldName="complicationsNoted"
                            width={270}
                        />
                    </Col>
                    <Col  >
                        <MyInput
                            column
                            disabled={!doctorRound?.key}
                            fieldType="textarea"
                            record={doctorRound}
                            setRecord={setDoctorRound}
                            fieldLabel="Summary Statement"
                            fieldName="summaryStatement"
                            width={270}
                        />
                    </Col>
                </Form>
            </Row>
            <Row gutter={30} className='bt-div'>
                <div className='bt-right'>
                    <Col>  <MyButton
                        onClick={handleStartNewRound}
                        prefixIcon={() => <FontAwesomeIcon icon={faFileAlt} />}
                        disabled={!doctorRound?.key}
                    >
                        Save Draft
                    </MyButton></Col>
                    <Col xs={32} >
                        <MyButton
                            appearance="ghost"
                            onClick={handleCompleteRound}
                            prefixIcon={() => <FontAwesomeIcon icon={faCircleCheck} />}
                            disabled={!doctorRound?.key}
                        >
                            Complete Round
                        </MyButton>
                    </Col></div>
            </Row>
        </Panel>
    );
};
export default NewRound;


