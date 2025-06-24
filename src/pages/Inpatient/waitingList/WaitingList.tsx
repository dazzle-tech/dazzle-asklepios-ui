import Translate from '@/components/Translate';
import { ApPatient } from '@/types/model-types';
import { newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Badge, Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetEncountersQuery } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';

const WaitingList = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Waiting Visit List</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Waiting_Patient_Encounters'));
    dispatch(setDivContent(divContentHTML));
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'encounter_status_lkey',
                operator: 'match',
                value: '5256965920133084'
            }, {
                fieldName: 'discharge',
                operator: 'match',
                value: "false"
            }
        ]
    });
    const {
        data: encounterListResponse,
        isFetching,
        refetch: refetchEncounter,
        isLoading
    } = useGetEncountersQuery(listRequest);

    //Functions
    const isSelected = rowData => {
        if (rowData && encounter && rowData.key === encounter.key) {
            return 'selected-row';
        } else return '';
    };
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


    // table columns 
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
            key: 'patientMRN',
            title: <Translate>MRN</Translate>,
            render: rowData => rowData?.patientObject?.patientMrn
        },
        {
            key: 'Age',
            title: <Translate>Age</Translate>,
            render: rowData => rowData?.patientAge,
        },
        {
            key: 'genderLkey',
            title: <Translate>Gender</Translate>,
            render: rowData => rowData?.patientObject?.genderLvalue
                ? rowData?.patientObject?.genderLvalue?.lovDisplayVale
                : rowData?.patientObject?.genderLkey
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
                const tooltipCancel = <Tooltip>Vancel Visit</Tooltip>;
                const tooltipAdmit = <Tooltip>Admit</Tooltip>;
                const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                            <div>
                                <MyButton size="small">
                                    <FontAwesomeIcon icon={faRectangleXmark} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipAdmit}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor="black"
                                >
                                    <FontAwesomeIcon icon={faBedPulse} />
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
            <MyTable
                height={600}
                data={encounterListResponse?.object ?? []}
                columns={tableColumns}
                rowClassName={isSelected}
                loading={isLoading || (manualSearchTriggered && isFetching)}
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
        </Panel>
    );
};

export default WaitingList;