import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRepeat } from '@fortawesome/free-solid-svg-icons';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEmergencyEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import BedManagementModal from '@/pages/Inpatient/inpatientList/bedBedManagementModal';
import { faBed } from '@fortawesome/free-solid-svg-icons';
import ChangeBedModal from '@/pages/Inpatient/inpatientList/changeBedModal';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
import './styles.less'
import MyInput from "@/components/MyInput";
import { faArrowRightArrowLeft } from '@fortawesome/free-solid-svg-icons';
import TransferPatientModal from '@/pages/Inpatient/inpatientList/transferPatient';

const ERList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>ER Department</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('ER_Patient_Encounters'));
    dispatch(setDivContent(divContentHTML));
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
    const [openBedManagementModal, setOpenBedManagementModal] = useState(false);
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [openChangeBedModal, setOpenChangeBedModal] = useState(false);
    const [startEncounter] = useStartEncounterMutation();
    const [departmentFilter, setDepartmentFilter] = useState({ key: '' });
    const [switchDepartment, setSwitchDepartment] = useState(false);
    const [openTransferPatientModal, setOpenTransferPatientModal] = useState(false);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'resource_type_lkey',
                operator: 'match',
                value: '6743167799449277'
            },
            {
                fieldName: 'encounter_status_lkey',
                operator: 'in',
                value: ['91084250213000', '91063195286200']
                    .map(key => `(${key})`)
                    .join(' '),
            }, {
                fieldName: 'discharge',
                operator: 'match',
                value: "false"
            }
        ]
    });
    // Fetch encounter list response based on the list request and department filter
    const {
        data: encounterListResponse,
        isFetching,
        refetch: refetchEncounter,
        isLoading
    } = useGetEmergencyEncountersQuery({
        listRequest,
        department_key: switchDepartment ? departmentFilter?.key != null ? departmentFilter?.key : '' : ''
    });

    // Fetch department list response
    const departmentListResponse = useGetResourceTypeQuery("6743167799449277");

    //Functions
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };

    // handle go to visit (medical sheets) function
    const handleGoToVisit = async (encounterData, patientData) => {
        await startEncounter(encounterData).unwrap();
        if (encounterData && encounterData.key) {
            dispatch(setEncounter(encounterData));
            dispatch(setPatient(encounterData['patientObject']));
        }
        const privatePatientPath = '/user-access-patient-private';
        const encounterPath = '/encounter';
        const targetPath = patientData.privatePatient ? privatePatientPath : encounterPath;
        if (patientData.privatePatient) {
            navigate(targetPath, {
                state: {
                    info: 'toEncounter',
                    fromPage: 'EncounterList',
                    patient: patientData,
                    encounter: encounterData
                }
            });
        } else {
            navigate(targetPath, {
                state: {
                    info: 'toEncounter',
                    fromPage: 'EncounterList',
                    patient: patientData,
                    encounter: encounterData
                }
            });
        }
        sessionStorage.setItem("encounterPageSource", "EncounterList");
    };
    // Function to search for patients based on the search keyword
    const filters = () => (
        <Form layout="inline" fluid>
            <div className="switch-dep-dev "> <MyInput
                require
                column
                fieldLabel="Select Department"
                fieldType="select"
                fieldName="key"
                selectData={departmentListResponse?.data?.object ?? []}
                selectDataLabel="name"
                selectDataValue="key"
                record={departmentFilter}
                setRecord={(value) => {
                    setDepartmentFilter(value);
                    setSwitchDepartment(false);
                }}
                searchable={false}
                width={200}
            />

                <MyButton
                    size="small"
                    backgroundColor="gray"
                    onClick={() => { setSwitchDepartment(true); }}
                    prefixIcon={() => <FontAwesomeIcon icon={faRepeat} />
                    }
                >
                    Switch Department
                </MyButton></div>
        </Form>
    );

    //useEffect
    useEffect(() => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(' '));
    }, [location.pathname, dispatch, isLoading]);
    useEffect(() => {
        refetchEncounter();
    }, []);
    useEffect(() => {
        if (!isFetching && manualSearchTriggered) {
            setManualSearchTriggered(false);
        }
    }, [isFetching, manualSearchTriggered]);
    useEffect(() => {
        if (isLoading || (manualSearchTriggered && isFetching)) {
            dispatch(showSystemLoader());
        } else if ((isFetching && isLoading)) {
            dispatch(hideSystemLoader());
        }
        return () => {
            dispatch(hideSystemLoader());
        };
    }, [isLoading, isFetching, dispatch]);
    useEffect(() => {
        if (isFetching) {
            refetchEncounter();

        }
    }, [departmentFilter, isFetching])

    // table columns 
    const tableColumns = [
        {
            key: 'visitId',
            title: <Translate>#</Translate>,
            dataKey: 'visitId',
            render: rowData => rowData?.visitId
        },
        {
            key: 'patientFullName',
            title: <Translate>PATIENT NAME</Translate>,
            fullText: true,
            render: rowData => {
                const tooltipSpeaker = (
                    <Tooltip>
                        <div>MRN : {rowData?.patientObject?.patientMrn}</div>
                        <div>Age : {rowData?.patientAge}</div>
                        <div>
                            Gender :{' '}
                            {rowData?.patientObject?.genderLvalue
                                ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                                : rowData?.patientObject?.genderLkey}
                        </div>
                        <div>Visit ID : {rowData?.visitId}</div>
                    </Tooltip>
                );

                return (
                    <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
                        <div style={{ display: 'inline-block' }}>
                            {rowData?.patientObject?.privatePatient ? (
                                <Badge color='blue' content="Private">
                                    <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                                        {rowData?.patientObject?.fullName}
                                    </p>
                                </Badge>
                            ) : (
                                <>
                                    <p style={{ cursor: 'pointer' }}>{rowData?.patientObject?.fullName}</p>
                                </>
                            )}
                        </div>
                    </Whisper>
                );
            }
        },
        {
            key: 'location',
            title: <Translate>LOCATION</Translate>,
            render: (row: any) => <span className='location-table-style '>{row?.apRoom?.name}<br />{row?.apBed?.name}</span>
        },
        {
            key: 'chiefComplaint',
            title: <Translate>CHIEF COMPLAIN</Translate>,
            render: rowData => rowData.chiefComplaint,
        },
        {
            key: 'diagnosis',
            title: <Translate>DIAGNOSIS</Translate>,
            render: rowData => rowData.diagnosis
        },
        {
            key: 'hasPrescription',
            title: <Translate>PRESCRIPTION</Translate>,
            render: rowData =>
                rowData.hasPrescription ? (
                    <MyBadgeStatus contant="YES" color="#45b887" />
                ) : (
                    <MyBadgeStatus contant="NO" color="#969fb0" />
                )
        },
        {
            key: 'hasOrder',
            title: <Translate>HAS ORDER</Translate>,
            render: rowData =>
                rowData.hasOrder ? (
                    <MyBadgeStatus contant="YES" color="#45b887" />
                ) : (
                    <MyBadgeStatus contant="NO" color="#969fb0" />
                )
        },
        {
            key: 'encounterPriority',
            title: <Translate>PRIORITY</Translate>,
            render: rowData =>
                rowData.encounterPriorityLvalue
                    ? rowData.encounterPriorityLvalue.lovDisplayVale
                    : rowData.encounterPriorityLkey
        },
        {
            key: 'plannedStartDate',
            title: <Translate>ADMISSION DATE</Translate>,
            dataKey: 'plannedStartDate'
        },
        {
            key: 'status',
            title: <Translate>STATUS</Translate>,
            render: rowData =>
                !rowData.discharge && rowData.encounterStatusLkey !== "91109811181900" ? (
                    <MyBadgeStatus
                        color={rowData?.encounterStatusLvalue?.valueColor}
                        contant={
                            rowData.encounterStatusLvalue
                                ? rowData.encounterStatusLvalue.lovDisplayVale
                                : rowData.encounterStatusLkey
                        }
                    />
                ) : null
        }
        ,
        {
            key: 'hasObservation',
            title: <Translate>IS OBSERVED</Translate>,
            render: rowData =>
                rowData.hasObservation ? (
                    <MyBadgeStatus contant="YES" color="#45b887" />
                ) : (
                    <MyBadgeStatus contant="NO" color="#969fb0" />
                )
        },
        {
            key: 'actions',
            title: <Translate> </Translate>,
            render: rowData => {
                const tooltipDoctor = <Tooltip>Go to Visit</Tooltip>;
                const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
                const tooltipChangeBed = <Tooltip>Change Bed</Tooltip>;
                const toolTransferPatient = <Tooltip>Transfer Patient</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => {
                                        const patientData = rowData.patientObject;
                                        setLocalEncounter(rowData);
                                        setLocalPatient(patientData);
                                        handleGoToVisit(rowData, patientData);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faUserDoctor} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipChangeBed}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="gray"
                                    onClick={() => { setOpenChangeBedModal(true) }}
                                >
                                    <FontAwesomeIcon icon={faBed} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={toolTransferPatient}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="var(--deep-blue)"
                                    onClick={() => {
                                        setOpenTransferPatientModal(true);
                                        setLocalEncounter(rowData);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faArrowRightArrowLeft} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="violet"
                                >
                                    <FontAwesomeIcon icon={faFileWaveform} />
                                </MyButton>
                            </div>
                        </Whisper>
                    </Form>
                );
            },
            expandable: false
        }
    ];

    const pageIndex = listRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listRequest.pageSize;

    // total number of items in the backend:
    const totalCount = encounterListResponse?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API
        setManualSearchTriggered(true);
        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setManualSearchTriggered(true);
        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };

    return (
        <Panel>
            <div className="inpatient-list-btns">
                <MyButton
                    onClick={() => setOpenBedManagementModal(true)}
                    disabled={!departmentFilter?.key}
                    prefixIcon={() => <FontAwesomeIcon icon={faBedPulse} />}>
                    Bed Management
                </MyButton>
            </div>
            <MyTable
                height={600}
                filters={filters()}
                data={encounterListResponse?.object ?? []}
                columns={tableColumns}
                rowClassName={isSelected}
                loading={isLoading || (manualSearchTriggered && isFetching) || isFetching}
                onRowClick={rowData => {
                    setLocalEncounter(rowData);
                    setLocalPatient(rowData.patientObject);
                }}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortChange={(sortBy, sortType) => {
                    setListRequest({ ...listRequest, sortBy, sortType });
                }}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <ChangeBedModal
                open={openChangeBedModal}
                setOpen={setOpenChangeBedModal}
                localEncounter={encounter}
                refetchInpatientList={refetchEncounter} />
            <BedManagementModal
                open={openBedManagementModal}
                setOpen={setOpenBedManagementModal}
                departmentKey={departmentFilter?.key} />
            <TransferPatientModal
                open={openTransferPatientModal}
                setOpen={setOpenTransferPatientModal}
                localEncounter={encounter}
                refetchInpatientList={refetchEncounter}
            />
        </Panel>
    );
};

export default ERList;