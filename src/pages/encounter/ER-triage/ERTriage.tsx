import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { newApEncounter } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { addFilterToListRequest, formatDate } from '@/utils';
import { faCommentMedical } from '@fortawesome/free-solid-svg-icons';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEREncountersListQuery, useSaveEncounterChangesMutation, useCancelEncounterMutation } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faBarcode } from '@fortawesome/free-solid-svg-icons';
import { faCirclePlay } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { resetRefetchEncounter } from '@/reducers/refetchEncounterState';
import { useSelector } from "react-redux";
import { useNavigate } from 'react-router-dom';
import SendToModal from './SendToModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';

const ERTriage = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const [cancelEncounter] = useCancelEncounterMutation();
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
    const [emergencyLevel, setEmergencyLevel] = useState({ key: '' });
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [openSendToModal, setOpenSendToModal] = useState(false);
    const [open, setOpen] = useState(false);

    const [startEncounter] = useSaveEncounterChangesMutation();
    const navigate = useNavigate();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        ignore: true,
        filters: [
            {
                fieldName: 'resource_type_lkey',
                operator: 'match',
                value: '6743167799449277'
            }
        ]
    });
    // State to manage the date filters for the manual search
    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });

    // Create a JSX element to display as the page header content
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>ER Triage</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('ER_Triage'));
    dispatch(setDivContent(divContentHTML));
    // Get the refetchEncounter flag from Redux state

    const refetch = useSelector((state: any) => state?.refetch?.refetchEncounter);
    // Hook to fetch encounter list based on the current listRequest filters
    const {
        data: encounterListResponse,
        isFetching,
        refetch: refetchEncounter,
        isLoading
    } = useGetEREncountersListQuery(listRequest);
    // Fetch list of values (LOV) for emergency levels using the provided code

    const { data: emergencyLevellovqueryresponse } = useGetLovValuesByCodeQuery('EMERGENCY_LEVEL');

    // Function to check if a row is currently selected based on encounter key
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };

    // Function to handle go to view triage
    const handleGoToViewTriage = async (encounterData, patientData) => {
        const targetPath = '/view-triage';
        navigate(targetPath, {
            state: { from: 'ER_Triage', info: 'toViewTriage', patient: patientData, encounter: encounterData }
        });
    };

    // Function to handle manual search based on date filters
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
                        operator: 'match',
                        value: '6743167799449277'
                    }
                ]
            });
        }
    };
    // handle cancel encounter function
    const handleCancelEncounter = async () => {
        try {
            if (encounter) {
                await cancelEncounter(encounter).unwrap();
                refetchEncounter();
                dispatch(notify({ msg: 'Cancelled Successfully', sev: 'success' }));
                setOpen(false);
            }
        } catch (error) {
            console.error("Encounter completion error:", error);
            dispatch(notify({ msg: 'An error occurred while canceling the encounter', sev: 'error' }));
        }
    };
    const handleGoToVisit = async (encounterData, patientData) => {
        await startEncounter({
            ...encounterData,
            encounterStatusLkey: '6742295599423814'
        }).unwrap();

        const targetPath = '/ER-start-triage';

        // Save source in sessionStorage before navigating
        sessionStorage.setItem("encounterPageSource", "EncounterList");

        navigate(targetPath, {
            state: {
                info: 'to_Start_Triage',
                fromPage: 'ER_Triage',
                patient: patientData,
                encounter: encounterData
            }
        });
    };
    //useEffect
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
        if (isLoading || isFetching) {
            dispatch(showSystemLoader());
        } else {
            dispatch(hideSystemLoader());
        }

        return () => {
            dispatch(hideSystemLoader());
        };
    }, [isLoading, isFetching, dispatch]);
    useEffect(() => {
        if (refetch) {
            dispatch(showSystemLoader());

            const doRefetch = async () => {
                try {
                    await refetchEncounter();
                } catch (error) {
                    console.error('Error while refetching encounter:', error);
                } finally {
                    dispatch(hideSystemLoader());
                    dispatch(resetRefetchEncounter());
                }
            };

            doRefetch();
        }
    }, [refetch, refetchEncounter, dispatch]);
    useEffect(() => {
        let filters = [
            {
                fieldName: 'resource_type_lkey',
                operator: 'match',
                value: '6743167799449277'
            }
        ];

        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            const formattedToDate = formatDate(dateFilter.toDate);
            filters.push({
                fieldName: 'planned_start_date',
                operator: 'between',
                value: `${formattedFromDate}_${formattedToDate}`
            });
        } else if (dateFilter.fromDate) {
            const formattedFromDate = formatDate(dateFilter.fromDate);
            filters.push({
                fieldName: 'planned_start_date',
                operator: 'gte',
                value: formattedFromDate
            });
        } else if (dateFilter.toDate) {
            const formattedToDate = formatDate(dateFilter.toDate);
            filters.push({
                fieldName: 'planned_start_date',
                operator: 'lte',
                value: formattedToDate
            });
        }

        if (emergencyLevel.key) {
            filters.push({
                fieldName: 'emergency_level_lkey',
                operator: 'match',
                value: emergencyLevel.key
            });
        }

        setManualSearchTriggered(true);
        setListRequest(prev => ({
            ...prev,
            pageNumber: 1,
            filters
        }));
    }, [dateFilter, emergencyLevel]);



    // table Columns
    const tableColumns = [
        {
            key: 'queueNumber',
            title: <Translate>#</Translate>,
            dataKey: 'queueNumber',
            render: rowData => rowData?.patientObject.patientMrn
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
            key: 'emergencyLevelLkey',
            title: <Translate>ER Level</Translate>,
            render: rowData => rowData?.emergencyLevelLkey ?
                <MyBadgeStatus color={rowData?.emergencyLevelLvalue?.valueColor} contant={rowData?.emergencyLevelLvalue
                    ? rowData?.emergencyLevelLvalue?.lovDisplayVale
                    : rowData?.emergencyLevelLkey} /> : ''
        },
        {
            key: 'erLevel',
            title: <Translate>Visit Type</Translate>,
            render: rowData =>
                rowData.visitTypeLvalue ? rowData.visitTypeLvalue.lovDisplayVale : rowData.visitTypeLkey
        },
        {
            key: 'chiefComplaint',
            title: <Translate>CHIEF COMPLAIN</Translate>,
            render: rowData => rowData.chiefComplaint,
        },
        {
            key: 'plannedStartDate',
            title: <Translate>DATE</Translate>,
            dataKey: 'plannedStartDate'
        },
        {
            key: 'destinationLkey',
            title: 'Destination',
            render: (row: any) =>
                row?.emergencyTriage?.destinationLkey
                    ? row?.emergencyTriage?.destinationLvalue?.lovDisplayVale
                    : ''
        },
        {
            key: 'status',
            title: <Translate>STATUS</Translate>,
            render: rowData => <MyBadgeStatus color={rowData?.encounterStatusLvalue?.valueColor} contant={rowData.encounterStatusLvalue
                ? rowData.encounterStatusLvalue.lovDisplayVale
                : rowData.encounterStatusLkey} />
        },
        {
            key: 'actions',
            title: <Translate> </Translate>,
            render: rowData => {
                const tooltipPrint = <Tooltip>Print wrist band</Tooltip>;
                const tooltipStart = <Tooltip>Start Triage</Tooltip>;
                const tooltipTriage = <Tooltip>View Triage</Tooltip>;
                const tooltipSendTo = <Tooltip>Send to</Tooltip>;
                const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        {(rowData?.encounterStatusLkey === '91109811181900' || rowData?.encounterStatusLkey === '6550164111662337') ? (
                            <Whisper trigger="hover" placement="top" speaker={tooltipTriage}>
                                <div>
                                    <MyButton
                                        size="small"
                                        onClick={() => {
                                            const patientData = rowData?.patientObject;
                                            setLocalEncounter(rowData);
                                            handleGoToViewTriage(rowData, patientData);
                                        }}
                                    >
                                        <FontAwesomeIcon icon={faCommentMedical} />
                                    </MyButton>
                                </div>
                            </Whisper>
                        ) : (
                            <Whisper trigger="hover" placement="top" speaker={tooltipStart}>
                                <div>
                                    <MyButton
                                        size="small"
                                        backgroundColor="black"
                                        onClick={() => {
                                            setLocalEncounter(rowData);
                                            handleGoToVisit(rowData, rowData?.patientObject);
                                        }}
                                        disabled={(rowData?.encounterStatusLkey !== "8890456518264959") && (rowData?.encounterStatusLkey !== "6742295599423814")}
                                    >
                                        <FontAwesomeIcon icon={faCirclePlay} />
                                    </MyButton>
                                </div>
                            </Whisper>
                        )}

                        <Whisper trigger="hover" placement="top" speaker={tooltipPrint}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => {
                                        setLocalEncounter(rowData);
                                    }}
                                >
                                    <FontAwesomeIcon icon={faBarcode} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipSendTo}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="violet"
                                    onClick={() => { setLocalEncounter(rowData); setOpenSendToModal(true); }}
                                    disabled={rowData?.encounterStatusLkey != '6742295599423814'}
                                >
                                    <FontAwesomeIcon icon={faPaperPlane} />
                                </MyButton>
                            </div>
                        </Whisper>
                        {(rowData?.encounterStatusLvalue?.valueCode === 'WAITING_TRIAGE' || rowData?.encounterStatusLvalue?.valueCode === 'NEW' || rowData?.encounterStatusLvalue?.valueCode === 'SENT_TO_ER' || rowData?.encounterStatusLvalue?.valueCode === 'WAITING_LIST') &&
                         <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                            <div>
                                <MyButton
                                    size="small"
                                    onClick={() => {
                                        setLocalEncounter(rowData);
                                        setOpen(true);
                                    }}>
                                    <FontAwesomeIcon icon={faRectangleXmark} />
                                </MyButton>
                            </div>
                        </Whisper>}             
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
                <MyInput
                    width={200}
                    column
                    fieldType='select'
                    fieldLabel="Emergency Level"
                    fieldName="key"
                    selectData={emergencyLevellovqueryresponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={emergencyLevel}
                    setRecord={setEmergencyLevel}
                />
            </Form>
        );
    };
    return (
        <Panel>
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
            <SendToModal
                open={openSendToModal}
                setOpen={setOpenSendToModal}
                encounter={encounter}
                triage={encounter?.emergencyTriage}
                refetch={refetchEncounter}
            />
            <DeletionConfirmationModal
                open={open}
                setOpen={setOpen}
                actionButtonFunction={handleCancelEncounter}
                actionType="Deactivate"
                confirmationQuestion="Do you want to cancel this Encounter ?"
                actionButtonLabel='Cancel'
                cancelButtonLabel='Close' />
        </Panel>
    );
};

export default ERTriage;