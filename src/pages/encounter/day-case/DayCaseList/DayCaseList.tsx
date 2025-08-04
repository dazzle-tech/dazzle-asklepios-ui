import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserDoctor } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import * as icons from '@rsuite/icons';
import { addFilterToListRequest, formatDate } from '@/utils';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery, useStartEncounterMutation } from '@/services/encounterService';
import { useLocation, useNavigate } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import BedAssignmentModal from './BedAssignmentModal';
import { faBed } from "@fortawesome/free-solid-svg-icons";
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
const DayCaseList = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5> DayCase List</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('P_DayCaseEncounters'));
    dispatch(setDivContent(divContentHTML));
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
    const [openBedAssigmentModal, setOpenBedAssigment] = useState(false);
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [startEncounter] = useStartEncounterMutation();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'resource_type_lkey',
                operator: 'in',
                value: ['5433343011954425', '2039548173192779']
                    .map(key => `(${key})`)
                    .join(' '),
            }, {
                fieldName: 'discharge',
                operator: 'match',
                value: "false"
            }
        ],
    });
    // Fetch the encounter list using the current listRequest
    const {
        data: encounterListResponse,
        isFetching,
        refetch: refetchEncounter,
        isLoading
    } = useGetEncountersQuery(listRequest);
    // State to manage date filtering (fromDate and toDate)
    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });
    // Function to check if a row in the list is the currently selected encounter
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };
    // Function to manually trigger search by date range
    const handleManualSearch = () => {
        setManualSearchTriggered(true);
        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            const formattedToDate = formatDate(dateFilter.toDate);
            setListRequest(
                addFilterToListRequest(
                    'planned_start_date',
                    'between',
                    formattedFromDate + '_' + formattedToDate,
                    listRequest
                )
            );
        } else if (dateFilter.fromDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            setListRequest(
                addFilterToListRequest('planned_start_date', 'gte', formattedFromDate, listRequest)
            );
        } else if (dateFilter.toDate) {
            const formattedToDate = formatDate(dateFilter.toDate);
            setListRequest(
                addFilterToListRequest('planned_start_date', 'lte', formattedToDate, listRequest)
            );
        } else {
            setListRequest({
                ...listRequest, filters: [
                    {
                        fieldName: 'resource_type_lkey',
                        operator: 'in',
                        value: ['5433343011954425', '2039548173192779']
                            .map(key => `(${key})`)
                            .join(' '),

                    }, {
                        fieldName: 'discharge',
                        operator: 'match',
                        value: "false"
                    }
                ]
            });
        }
    };
    // Function to handle navigation to a visit screen
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
                    encounter: encounterData,
                }
            });
        } else {
            navigate(targetPath, {
                state: {
                    info: 'toEncounter',
                    fromPage: 'EncounterList',
                    patient: patientData,
                    encounter: encounterData,
                }
            });
        }
        sessionStorage.setItem("encounterPageSource", "EncounterList");
    };

    //Effects
    useEffect(() => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(' '));
    }, [location.pathname, dispatch, isLoading]);
    useEffect(() => {
        if (!isFetching && manualSearchTriggered) {
            setManualSearchTriggered(false);
        }
    }, [isFetching, manualSearchTriggered]);
    useEffect(() => {
        // init list
        handleManualSearch();
    }, []);
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

    // table columns 
    const tableColumns = [
        {
            key: 'queueNumber',
            title: <Translate>#</Translate>,
            dataKey: 'queueNumber',
            render: rowData => rowData?.patientObject?.patientMrn
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
            title: <Translate>DATE</Translate>,
            dataKey: 'plannedStartDate'
        },
        {
            key: 'status',
            title: <Translate>STATUS</Translate>,
            render: rowData => <MyBadgeStatus color={rowData?.encounterStatusLvalue?.valueColor} contant={rowData.encounterStatusLvalue
                ? rowData.encounterStatusLvalue.lovDisplayVale
                : rowData.encounterStatusLkey} />
        },
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
                const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
                const tooltipBedAssessment = <Tooltip>Assign to Bed</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper trigger="hover" placement="top" speaker={tooltipDoctor}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => {
                                        const patientData = rowData?.patientObject;
                                        setLocalEncounter(rowData);
                                        handleGoToVisit(rowData, patientData);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faUserDoctor} />
                                </MyButton>
                            </div>
                        </Whisper>
                        {rowData?.encounterStatusLkey === "5256965920133084" && <Whisper trigger="hover" placement="top" speaker={tooltipBedAssessment}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => {
                                        const patientData = rowData?.patientObject;
                                        setLocalEncounter(rowData);
                                        setOpenBedAssigment(true);
                                    }}
                                    backgroundColor="Black"
                                >
                                    <FontAwesomeIcon icon={faBed} />
                                </MyButton>
                            </div>
                        </Whisper>}

                        <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                            <div>
                                <MyButton size="small">
                                    <FontAwesomeIcon icon={faRectangleXmark} />
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

    const filters = () => {
        return (
            <Form layout="inline" fluid className="date-filter-form">
                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="From Date"
                    fieldName="fromDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <MyInput
                    width={180}
                    column
                    fieldType="date"
                    fieldLabel="To Date"
                    fieldName="toDate"
                    record={dateFilter}
                    setRecord={setDateFilter}
                />
                <div className="search-btn">
                    <MyButton onClick={handleManualSearch}>
                        <icons.Search />
                    </MyButton>
                </div>
            </Form>
        );
    };
    return (
        <Panel>
            <BedAssignmentModal
                refetchEncounter={refetchEncounter}
                open={openBedAssigmentModal}
                setOpen={setOpenBedAssigment}
                encounter={encounter}
                departmentKey={encounter?.resourceTypeLkey === "5433343011954425" ? encounter?.resourceObject?.key : encounter?.departmentKey} />
            <MyTable
                filters={filters()}
                height={600}
                data={encounterListResponse?.object ?? []}
                columns={tableColumns}
                rowClassName={isSelected}
                loading={isLoading || (manualSearchTriggered && isFetching)}
                onRowClick={rowData => {
                    setLocalEncounter(rowData);
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
        </Panel>
    );
};

export default DayCaseList;