import React, { useEffect, useState } from 'react';
import { useGetPatientVaccinationRecordQuery } from '@/services/observationService'
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import {
    InputGroup,
    Form,
    Input,
    Panel,
    DatePicker,
    Text,
    Checkbox,
    Dropdown,
    Button,
    IconButton,
    SelectPicker,
    Table,
    Modal,
    Stack,
    Divider,
    Toggle,
    ButtonToolbar,
    Grid,
    Row,
    Col,
} from 'rsuite';
import {
    useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import {
    useSaveOptometricExamMutation,
    useGetOptometricExamsQuery
} from '@/services/encounterService';
import MyInput from '@/components/MyInput';
import CollaspedOutlineIcon from '@rsuite/icons/CollaspedOutline';
import Translate from '@/components/Translate';
import ExpandOutlineIcon from '@rsuite/icons/ExpandOutline';
import MyLabel from '@/components/MyLabel';
import {
    newApOptometricExam
} from '@/types/model-types-constructor';
import SearchIcon from '@rsuite/icons/Search';
import {
    ApOptometricExam
} from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { useGetIcdListQuery } from '@/services/setupService';
const { Column, HeaderCell, Cell } = Table
const OptometricExam = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [saveOptometricExam, saveOptometricExamMutation] = useSaveOptometricExamMutation();
    const [optometricExam, setOptometricExam] = useState<any>({
        ...newApOptometricExam,
        medicalHistoryLkey: null,
        followUpRequired: false,
        fundoscopySlitlampDone: false,
        performedWithLkey: null,
        distanceAcuity: null,
        rightEyeOd: null,
        leftEyeOd: null,
        rightEyeOs: null,
        leftEyeOs: null,
        nearAcuity: null,
        pinholeTestResultLkey: null,
        numberOfPlatesTested: null,
        correctAnswersCount: null,
        deficiencyTypeLkey: null,
        rightEyeSphere: null,
        leftEyeSphere: null,
        rightCylinder: null,
        leftCylinder: null,
        rightAxis: null,
        leftAxis: null,
        rightEye: null,
        leftEye: null,
        timeOfMeasurement: null,
        cornealThickness: null,
        glaucomaRiskAssessmentLkey: null,
    })
    const [searchKeyword, setSearchKeyword] = useState('');
    const [selectedicd10, setSelectedIcd10] = useState(' ');
    const [secondSelectedicd10, setSecondSelectedicd10] = useState(' ');
    const [secondSearchKeyword, setSecondSearchKeyword] = useState('');
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [optometricExamStatus, setOptometricExamStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const [time, setTime] = useState({ time: '' });
    const [diagnosisIcd, setDiagnosisIcd] = useState(null);
    const dispatch = useAppDispatch()
    const [optometricExamListRequest, setOptometricExamListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
            , {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
            },
            {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
            }
        ],
    });
    //LOV
    const { data: medicalHistoryLovQueryResponse } = useGetLovValuesByCodeQuery('EYE_MEDICAL_HISTORY');
    const { data: performedWithLovQueryResponse } = useGetLovValuesByCodeQuery('EYE_VISUAL_ACUITY');
    const { data: improvmentsStatusLovQueryResponse } = useGetLovValuesByCodeQuery('IMPROVEMENTS_STATUS');
    const { data: colorBlindTestLovQueryResponse } = useGetLovValuesByCodeQuery('COLOR_BLIND_TEST');
    const { data: lowModHighLovQueryResponse } = useGetLovValuesByCodeQuery('LOW_MOD_HIGH');
    const { data: optometricExamResponse, refetch: refetchOptometricExam } = useGetOptometricExamsQuery(optometricExamListRequest, {
        skip: !patient?.key || !encounter?.key,
    });
    const [listIcdRequest, setListIcdRequest] = useState({ ...initialListRequest });
    const { data: icdListResponseData } = useGetIcdListQuery(listIcdRequest);
    const modifiedData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    const secondData = (icdListResponseData?.object ?? []).map(item => ({
        ...item,
        combinedLabel: `${item.icdCode} - ${item.description}`
    }));
    const isSelected = rowData => {
        if (rowData && optometricExam && optometricExam.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    const handleSave = () => {
        if (optometricExam.key === undefined) {
            saveOptometricExam({ ...optometricExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: optometricExam?.followUpDate ? new Date(optometricExam.followUpDate).getTime() : 0, statusLkey: "9766169155908512", createdBy: authSlice.user.key, timeOfMeasurement: time.time.split(':').reduce((acc, time) => acc * 60 + Number(time), 0) * 60 }).unwrap().then(() => {
                dispatch(notify('Patient Optometric Exam Added Successfully'));
            });
            setOptometricExam({ ...optometricExam, statusLkey: "9766169155908512" })
            refetchOptometricExam();
        }
        else if (optometricExam.key) {
            saveOptometricExam({ ...optometricExam, patientKey: patient.key, encounterKey: encounter.key, followUpDate: optometricExam?.followUpDate ? new Date(optometricExam.followUpDate).getTime() : 0, updatedBy: authSlice.user.key, timeOfMeasurement: time.time.split(':').reduce((acc, time) => acc * 60 + Number(time), 0) * 60 }).unwrap().then(() => {
                dispatch(notify('Patient Optometric Exam Updated Successfully'));
                refetchOptometricExam();
            });
        }
    };
    const handleCancle = () => {
        saveOptometricExam({ ...optometricExam, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Optometric Exam Canceled Successfully'));
            refetchOptometricExam();
        });
    };
    const handleClearField = () => {
        setPopupCancelOpen(false);
        setOptometricExam({
            ...newApOptometricExam,
            medicalHistoryLkey: null,
            followUpRequired: false,
            fundoscopySlitlampDone: false,
            performedWithLkey: null,
            pinholeTestResultLkey: null,
            deficiencyTypeLkey: null,
            glaucomaRiskAssessmentLkey: null,

        });
        setTime({ time: null });
        setSecondSelectedicd10(" ")
        setSelectedIcd10(" ");
    }
    const handleSearch = value => {
        setSearchKeyword(value);
    };
    const handleSecondSearch = value => {
        setSecondSearchKeyword(value);
    };
    const formatTime = (totalSeconds) => {
        if (!totalSeconds) return "-";

        const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
        const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');

        return `${hours}:${minutes}`;
    };
    ///useEffect
    useEffect(() => {
        setOptometricExamListRequest((prev) => ({
            ...prev,
            filters: [
                {
                    fieldName: 'deleted_at',
                    operator: 'isNull',
                    value: undefined,
                },
                ...(patient?.key && encounter?.key
                    ? [
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                        {
                            fieldName: 'encounter_key',
                            operator: 'match',
                            value: encounter?.key
                        },
                    ]
                    : []),
            ],
        }));
    }, [patient?.key, encounter?.key]);
    useEffect(() => {
        setOptometricExamListRequest((prev) => ({
            ...prev,
            filters: [
                ...(optometricExamStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: optometricExamStatus,
                        },
                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key,
                        },
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]
                    : [
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
                        ...(allData === false
                            ? [
                                {
                                    fieldName: 'encounter_key',
                                    operator: 'match',
                                    value: encounter?.key,
                                },
                            ]
                            : []),
                    ]),
            ],
        }));
    }, [optometricExamStatus, allData]);
    useEffect(() => {
        setOptometricExamListRequest((prev) => {
            const filters =
                optometricExamStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : optometricExamStatus === '' && allData
                        ? [
                            {
                                fieldName: 'deleted_at',
                                operator: 'isNull',
                                value: undefined,
                            },
                            {
                                fieldName: 'patient_key',
                                operator: 'match',
                                value: patient?.key
                            },
                        ]
                        : prev.filters;

            return {
                ...initialListRequest,
                filters,
            };
        });
    }, [allData, optometricExamStatus]);
    useEffect(() => {
        if (searchKeyword.trim() !== "") {
            setListIcdRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'or',
                    filters: [
                        {
                            fieldName: 'icd_code',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        },
                        {
                            fieldName: 'description',
                            operator: 'containsIgnoreCase',
                            value: searchKeyword
                        }
                    ]
                }
            );
        }
    }, [searchKeyword]);
    useEffect(() => {
        if (secondSearchKeyword.trim() !== "") {
            setListIcdRequest(
                {
                    ...initialListRequest,
                    filterLogic: 'or',
                    filters: [
                        {
                            fieldName: 'icd_code',
                            operator: 'containsIgnoreCase',
                            value: secondSearchKeyword
                        },
                        {
                            fieldName: 'description',
                            operator: 'containsIgnoreCase',
                            value: secondSearchKeyword
                        }
                    ]
                }
            );
        }
    }, [secondSearchKeyword]);
    return (
        <Panel header={"Optometric Exam"}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Form fluid layout='inline'>
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Test Reason"
                        fieldName="testReason"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Medical History"
                        fieldType="select"
                        fieldName="medicalHistoryLkey"
                        selectData={medicalHistoryLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                </Form>
                <ButtonToolbar style={{ zoom: .8 }}>
                    <Button
                        appearance="primary"
                        onClick={() => handleSave()}
                        style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: '5px' }}
                    >
                        <FontAwesomeIcon icon={faCheckDouble} style={{ marginRight: '5px' }} />

                        <Translate>Save</Translate>
                    </Button>
                    <Button
                        appearance="ghost"
                        style={{ backgroundColor: 'white', color: 'var(--primary-blue)', marginLeft: "5px" }}
                        onClick={handleClearField}
                    >
                        <FontAwesomeIcon icon={faBroom} style={{ marginRight: '5px' }} />
                        <span>Clear</span>
                    </Button>
                </ButtonToolbar>
            </div>

            <Panel header={"Visual Acuity Test"} collapsible bordered>
                <Form fluid layout='inline'>
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Test Performed With"
                        fieldType="select"
                        fieldName="performedWithLkey"
                        selectData={performedWithLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />

                    <MyInput
                        width={210}
                        column
                        fieldLabel="Pinhole Test Result"
                        fieldType="select"
                        fieldName="pinholeTestResultLkey"
                        selectData={improvmentsStatusLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                </Form>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Panel header={"Distance"} bordered>
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>

                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Distance Acuity" />
                                <InputGroup style={{ width: 210 }}>

                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.distanceAcuity}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                distanceAcuity: Number(e),
                                            })
                                        }
                                    />
                                    <InputGroup.Addon><Text>m</Text></InputGroup.Addon>
                                </InputGroup>
                            </div>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Right Eye (OD)" />
                                <InputGroup style={{ width: 210 }}>
                                    <InputGroup.Addon><Text>20/</Text></InputGroup.Addon>
                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.rightEyeOd}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                rightEyeOd: Number(e),
                                            })
                                        }
                                    />
                                </InputGroup>
                            </div>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Left Eye (OD)" />
                                <InputGroup style={{ width: 210 }}>
                                    <InputGroup.Addon><Text>20/</Text></InputGroup.Addon>
                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.leftEyeOd}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                leftEyeOd: Number(e),
                                            })
                                        }
                                    />
                                </InputGroup>
                            </div>
                        </Form>
                    </Panel>
                    <Panel bordered header={"Near"} >
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Bone Conduction Thresholds" />
                                <InputGroup style={{ width: 210 }}>
                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.nearAcuity}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                nearAcuity: Number(e),
                                            })
                                        }
                                    />
                                    <InputGroup.Addon><Text>cm</Text></InputGroup.Addon>
                                </InputGroup>
                            </div>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Right Eye (OS)" />
                                <InputGroup style={{ width: 210 }}>
                                    <InputGroup.Addon><Text>20/</Text></InputGroup.Addon>
                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.rightEyeOs}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                rightEyeOs: Number(e),
                                            })
                                        }
                                    />
                                </InputGroup>
                            </div>
                            <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                                <MyLabel label="Left Eye (OS)" />
                                <InputGroup style={{ width: 210 }}>
                                    <InputGroup.Addon><Text>20/</Text></InputGroup.Addon>
                                    <Input
                                        type="number"
                                        width={165}
                                        value={optometricExam.leftEyeOs}
                                        onChange={e =>
                                            setOptometricExam({
                                                ...optometricExam,
                                                leftEyeOs: Number(e),
                                            })
                                        }
                                    />
                                </InputGroup>
                            </div>
                        </Form>
                    </Panel>
                </Form>
            </Panel>
            <Panel header={"Ishihara Color Blindness Test"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MyInput
                        width={210}
                        column
                        fieldType="number"
                        fieldLabel="Number of Plates Tested"
                        fieldName="numberOfPlatesTested"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <MyInput
                        width={210}
                        column
                        fieldType="number"
                        fieldLabel="Correct Answers Count"
                        fieldName="correctAnswersCount"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Deficiency Type"
                        fieldType="select"
                        fieldName="deficiencyTypeLkey"
                        selectData={colorBlindTestLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                </Form>
            </Panel>
            <Panel header={"Refraction Test Results"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Panel header={"Right Eye"} bordered>
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Right Eye (OD) Sphere"
                                fieldName="rightEyeSphere"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Cylinder"
                                fieldName="rightCylinder"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Axis"
                                fieldName="rightAxis"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                        </Form>
                    </Panel>
                    <Panel bordered header={"Left Eye"} >
                        <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Left Eye (OS) Sphere"
                                fieldName="leftEyeSphere"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Cylinder"
                                fieldName="leftCylinder"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                            <MyInput
                                width={210}
                                column
                                fieldType="number"
                                fieldLabel="Axis"
                                fieldName="leftAxis"
                                record={optometricExam}
                                setRecord={setOptometricExam}
                            />
                        </Form>
                    </Panel>
                </Form>
            </Panel>
            <Panel header={"Intraocular Pressure (IOP)"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                        <MyLabel label="Right Eye" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={optometricExam.rightEye}
                                onChange={e =>
                                    setOptometricExam({
                                        ...optometricExam,
                                        rightEye: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>mmHg</Text></InputGroup.Addon>
                        </InputGroup>
                    </div>
                    <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                        <MyLabel label="Left Eye" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={optometricExam.leftEye}
                                onChange={e =>
                                    setOptometricExam({
                                        ...optometricExam,
                                        leftEye: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>mmHg</Text></InputGroup.Addon>
                        </InputGroup>
                    </div>
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Measurement Method"
                        fieldName="measurementMethod"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                        <Text>Start Time</Text>
                        <DatePicker
                            format="HH:mm"
                            value={time.time ? new Date(`1970-01-01T${time.time}:00`) : null}
                            onChange={(value) => {
                                if (value) {
                                    const formattedTime = value.toTimeString().slice(0, 5);
                                    setTime({ ...time, time: formattedTime });
                                }
                            }}
                            hideHours={(hour) => false}
                            hideMinutes={(minute) => false}
                        />


                    </div>

                    <div style={{ display: 'flex', flexDirection: "column", justifyContent: "center", paddingTop: '6px', zoom: .75 }}>
                        <MyLabel label="Corneal Thickness" />
                        <InputGroup style={{ width: 210 }}>

                            <Input
                                type="number"
                                width={165}
                                value={optometricExam.cornealThickness}
                                onChange={e =>
                                    setOptometricExam({
                                        ...optometricExam,
                                        cornealThickness: Number(e),
                                    })
                                }
                            />
                            <InputGroup.Addon><Text>microns</Text></InputGroup.Addon>
                        </InputGroup>
                    </div>
                    <MyInput
                        width={210}
                        column
                        fieldLabel="Glaucoma Risk Assessment"
                        fieldType="select"
                        fieldName="glaucomaRiskAssessmentLkey"
                        selectData={lowModHighLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                </Form>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Fundoscopy & Slit Lamp Exam Done?"
                        fieldType="checkbox"
                        fieldName="fundoscopySlitlampDone"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <Form style={{ display: 'flex', flexDirection: 'column', zoom: .8 }}>
                        <MyLabel label="Clinical Observations" />
                        <Input
                            as="textarea"
                            value={optometricExam.examFindings}
                            onChange={(e) => setOptometricExam({
                                ...optometricExam,
                                examFindings: e
                            })}
                            style={{ width: 330 }}
                            rows={2}
                            disabled={!optometricExam?.fundoscopySlitlampDone}
                        />
                    </Form>
                </Form>
            </Panel>
            <Panel header={"Interpretation & Diagnosis"} collapsible bordered>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <div>
                        <InputGroup inside style={{ width: '210px', zoom: 0.80, marginTop: '20px' }}>
                            <Input
                                placeholder={'Search ICD-10'}
                                value={searchKeyword}
                                onChange={handleSearch}
                            />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>
                        {searchKeyword && (
                            <Dropdown.Menu className="dropdown-menuresult">
                                {modifiedData && modifiedData?.map(mod => (
                                    <Dropdown.Item
                                        key={mod.key}
                                        eventKey={mod.key}
                                        onClick={() => {
                                            setOptometricExam({
                                                ...optometricExam,
                                                visionDiagnosis: mod.key
                                            })
                                            setSelectedIcd10(mod.combinedLabel);
                                            setDiagnosisIcd(mod)
                                            setSearchKeyword("");
                                        }
                                        }
                                    >
                                        <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )}
                    </div>
                    <div>
                        <Text style={{ zoom: 0.85 }}>Vision Diagnosis</Text>
                        <InputGroup>
                            <Input
                                disabled={true}
                                style={{ zoom: 0.80, width: '300px' }}
                                value={selectedicd10}
                            />
                        </InputGroup>
                    </div>
                    <div>
                        <InputGroup inside style={{ width: '210px', zoom: 0.80, marginTop: '20px' }}>
                            <Input
                                placeholder={'Search ICD-10'}
                                value={secondSearchKeyword}
                                onChange={handleSecondSearch}
                            />
                            <InputGroup.Button>
                                <SearchIcon />
                            </InputGroup.Button>
                        </InputGroup>
                        {secondSearchKeyword && (
                            <Dropdown.Menu className="dropdown-menuresult">
                                {secondData && secondData?.map(mod => (
                                    <Dropdown.Item
                                        key={mod.key}
                                        eventKey={mod.key}
                                        onClick={() => {
                                            setOptometricExam({
                                                ...optometricExam,
                                                colorVisionDiagnosis: mod.key
                                            })
                                            setSecondSelectedicd10(mod.combinedLabel)
                                            setSecondSearchKeyword("");
                                        }
                                        }
                                    >
                                        <span style={{ marginRight: "19px" }}>{mod.icdCode}</span>
                                        <span>{mod.description}</span>
                                    </Dropdown.Item>
                                ))}
                            </Dropdown.Menu>
                        )}
                    </div>
                    <div>
                        <Text style={{ zoom: 0.85 }}>Vision Diagnosis</Text>
                        <InputGroup>
                            <Input
                                disabled={true}
                                style={{ zoom: 0.80, width: '300px' }}
                                value={secondSelectedicd10}
                            />
                        </InputGroup>
                    </div>
                    <MyInput
                        width={165}
                        column
                        fieldLabel="Require Follow-up"
                        fieldType="checkbox"
                        fieldName="followUpRequired"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                    />
                    <MyInput
                        width={165}
                        column
                        fieldType="date"
                        fieldLabel="Require Follow-up"
                        fieldName="followUpDate"
                        record={optometricExam}
                        setRecord={setOptometricExam}
                        disabled={!optometricExam?.followUpRequired}
                    />

                </Form>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px', zoom: .8 }}>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Recommendations" />
                        <Input
                            as="textarea"
                            value={optometricExam.recommendations}
                            onChange={(e) => setOptometricExam({
                                ...optometricExam,
                                recommendations: e
                            })}
                            style={{ width: 330 }}
                            rows={3}
                        />
                    </Form>
                    <Form style={{ display: 'flex', flexDirection: 'column' }}>
                        <MyLabel label="Additional Notes" />
                        <Input
                            as="textarea"
                            value={optometricExam.additionalNotes}
                            onChange={(e) => setOptometricExam({
                                ...optometricExam,
                                additionalNotes: e
                            })}
                            style={{ width: 330 }}
                            rows={3}
                        />
                    </Form>

                </Form>
            </Panel>
            <Panel>
                <Form fluid layout='inline' style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <ButtonToolbar>
                        <Button
                            appearance="primary"
                            style={{ backgroundColor: 'var(--primary-blue)', color: 'white', marginLeft: "5px", zoom: .8 }}
                            onClick={() => { setPopupCancelOpen(true) }}
                            disabled={!optometricExam?.key}
                        >
                            <CloseOutlineIcon style={{ marginRight: '7px' }} />
                            <Translate>Cancel</Translate>
                        </Button>

                    </ButtonToolbar>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                setOptometricExamStatus('3196709905099521');
                            }
                            else {
                                setOptometricExamStatus('');
                            }
                        }}
                    >
                        Show Cancelled
                    </Checkbox>
                    <Checkbox
                        onChange={(value, checked) => {
                            if (checked) {
                                setAllData(true);
                            }
                            else {
                                setAllData(false);
                            }
                        }}
                    >
                        Show All
                    </Checkbox>
                </Form>
                <Table
                    height={420}
                    data={optometricExamResponse?.object ?? []}
                    bordered
                    cellBordered
                    affixHeader
                    affixHorizontalScrollbar
                    rowKey="key"
                    rowClassName={isSelected}
                    onRowClick={rowData => {
                        setOptometricExam({
                            ...rowData
                        });
                        setSelectedIcd10(`${rowData.icdCode.icdCode} - ${rowData.icdCode.description}`)
                        setSecondSelectedicd10(`${rowData.icdCode2.icdCode} - ${rowData.icdCode2.description}`)
                        setTime({ time: formatTime(rowData?.timeOfMeasurement) })
                    }}
                >

                    <Column width={150} align="center" fixed resizable fullText>
                        <HeaderCell>Reason</HeaderCell>
                        <Cell dataKey="testReason" />
                    </Column>
                    <Column width={150} fixed resizable>
                        <HeaderCell>Medical History</HeaderCell>
                        <Cell>
                            {rowData => rowData?.medicalHistoryLvalue
                                ? rowData?.medicalHistoryLvalue.lovDisplayVale
                                : rowData?.medicalHistoryLkey
                            }
                        </Cell>
                    </Column>

                    <Column width={150} resizable>
                        <HeaderCell>Test Performed With</HeaderCell>
                        <Cell>
                            {rowData => rowData?.performedWithLvalue
                                ? rowData?.performedWithLvalue.lovDisplayVale
                                : rowData?.performedWithLkey
                            }
                        </Cell>
                    </Column>

                    <Column width={150}>
                        <HeaderCell>Distance Acuity</HeaderCell>
                        <Cell>
                            {rowData => <>{rowData?.distanceAcuity}{" m"}</>
                            }
                        </Cell>
                    </Column>

                    <Column width={100} resizable>
                        <HeaderCell>Right Eye OD</HeaderCell>
                        <Cell>
                            {rowData => <>{"20/ "}{rowData?.rightEyeOd}</>
                            }
                        </Cell>
                    </Column>
                    <Column width={100}>
                        <HeaderCell>Left Eye OD</HeaderCell>
                        <Cell>
                            {rowData => <>{"20/ "}{rowData?.leftEyeOd}</>
                            }
                        </Cell>
                    </Column>
                    <Column width={100}>
                        <HeaderCell>Near Acuity</HeaderCell>
                        <Cell>
                            {rowData => <>{rowData?.nearAcuity}{" m"}</>
                            }
                        </Cell>
                    </Column>
                    <Column width={100}>
                        <HeaderCell>Right Eye OS</HeaderCell>
                        <Cell>
                            {rowData => <>{"J "}{rowData?.rightEyeOs}</>
                            }
                        </Cell>
                    </Column>
                    <Column width={100}>
                        <HeaderCell>Left Eye OS</HeaderCell>
                        <Cell>
                            {rowData => <>{"J "}{rowData?.leftEyeOs}</>
                            }
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Pinhole Test Result</HeaderCell>
                        <Cell>
                            {rowData => rowData?.pinholeTestResultLvalue
                                ? rowData?.pinholeTestResultLvalue.lovDisplayVale
                                : rowData?.pinholeTestResultLkey
                            }
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Number of Plates Tested</HeaderCell>
                        <Cell>
                            {rowData => rowData?.numberOfPlatesTested}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Correct Answers Count</HeaderCell>
                        <Cell>
                            {rowData => rowData?.correctAnswersCount}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Deficiency Type</HeaderCell>
                        <Cell>
                            {rowData => rowData?.deficiencyTypeLvalue
                                ? rowData?.deficiencyTypeLvalue.lovDisplayVale
                                : rowData?.deficiencyTypeLkey
                            }
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Right Eye</HeaderCell>
                        <Cell>
                            {rowData => rowData?.rightEye}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Left Eye</HeaderCell>
                        <Cell>
                            {rowData => rowData?.leftEye}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Right Eye</HeaderCell>
                        <Cell>
                            {rowData => rowData?.rightEye}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Measurement Method</HeaderCell>
                        <Cell>
                            {rowData => rowData?.measurementMethod}
                        </Cell>
                    </Column>
                    <Column width={150}>
                        <HeaderCell>Time of Measurement</HeaderCell>
                        <Cell>
                            {rowData => {
                                if (!rowData?.timeOfMeasurement) return "-";
                                const totalSeconds = rowData.timeOfMeasurement;
                                const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
                                const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');

                                return `${hours}:${minutes}`;
                            }}
                        </Cell>
                    </Column>
                    <Column width={200} align="center" fullText>
                        <HeaderCell>Created At / Created By</HeaderCell>
                        <Cell>
                            {rowData => (
                                <>
                                    {rowData.createdAt ? new Date(rowData.createdAt).toLocaleString("en-GB") : ""}
                                    {" / "}
                                    {rowData?.createByUser?.fullName}
                                </>
                            )}
                        </Cell>
                    </Column>
                    <Column width={200} align="center" fullText>
                        <HeaderCell>Updated At / Updated By</HeaderCell>
                        <Cell>
                            {rowData => (
                                <>
                                    {rowData.updatedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                    {" / "}
                                    {rowData?.updateByUser?.fullName}
                                </>
                            )}
                        </Cell>
                    </Column>

                    <Column width={200} align="center" fullText>
                        <HeaderCell>Cancelled At / Cancelled By</HeaderCell>
                        <Cell dataKey="deletedAt" >
                            {rowData => (
                                <>
                                    {rowData.deletedAt ? new Date(rowData.updatedAt).toLocaleString("en-GB") : ""}
                                    {" / "}
                                    {rowData?.deleteByUser?.fullName}
                                </>
                            )}
                        </Cell>
                    </Column>
                    <Column width={200} align="center" fullText>
                        <HeaderCell>Cancelliton Reason</HeaderCell>
                        <Cell dataKey="cancellationReason" />
                    </Column>
                </Table>
            </Panel>

            <Modal
                open={popupCancelOpen}
                onClose={() => setPopupCancelOpen(false)}
                size="sm"
            >
                <Modal.Header>
                    <Translate><h6>Confirm Cancel</h6></Translate>
                </Modal.Header>
                <Modal.Body>
                    <Form layout="inline" fluid>
                        <MyInput
                            width={600}
                            column
                            fieldLabel="Cancellation Reason"
                            fieldType="textarea"
                            fieldName="cancellationReason"
                            height={120}
                            record={optometricExam}
                            setRecord={setOptometricExam}
                            disabled={optometricExam?.statusLkey === "3196709905099521"}
                        />
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button appearance="primary" onClick={handleCancle}
                        disabled={optometricExam?.statusLkey === "3196709905099521"}
                        style={{ backgroundColor: 'var(--primary-blue)', color: 'white', zoom: .8 }}
                    >
                        Cancel
                    </Button>
                    <Divider vertical />
                    <Button appearance="ghost" color='blue' onClick={() => { setPopupCancelOpen(false) }}
                        style={{ color: 'var(--primary-blue)', backgroundColor: 'white', zoom: .8 }}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </Panel>
    );
};
export default OptometricExam;