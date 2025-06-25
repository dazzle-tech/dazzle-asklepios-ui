import Translate from '@/components/Translate';
import { ApPatient } from '@/types/model-types';
import { newApAdmitOutpatientInpatient, newApEncounter, newApPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import 'react-tabs/style/react-tabs.css';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetWaitingListEncounterQuery } from '@/services/encounterService';
import { useLocation } from 'react-router-dom';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useDispatch } from 'react-redux';
import ReactDOMServer from 'react-dom/server';
import './styles.less';
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from "@/utils";
import { faFileWaveform } from '@fortawesome/free-solid-svg-icons';
import { faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import { faBedPulse } from '@fortawesome/free-solid-svg-icons';
import PatientAdmission from './PatientAdmission';

const WaitingList = () => {
    const location = useLocation();
    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5>Inpatient Waiting List</h5>
        </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('Waiting_Patient_Encounters'));
    dispatch(setDivContent(divContentHTML));
    const[patientAdmissionModal,setPatientAdmissionModal] = useState(false);
    const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter });
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [admitInPatient,setAdmitInPatient]=useState<any>({...newApAdmitOutpatientInpatient});
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
    } = useGetWaitingListEncounterQuery(listRequest);

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
            key: 'patientFullName',
            title: <Translate>PATIENT NAME</Translate>,
            fullText: true,
            render: rowData => rowData?.patientObject?.fullName
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
            key: 'registeredDepartment',
            title: <Translate>Registered Department</Translate>,
            render: rowData => rowData?.resourceObject?.name
        },
        {
            key: 'admitSource',
            title: <Translate>Admit Source</Translate>,
            render: rowData => rowData?.admitRecord?.admitSourceLvalue ?
                rowData?.admitRecord?.admitSourceLvalue?.lovDisplayVale : rowData?.admitRecord?.admitSourceLkey
        },
        {
            key: 'admissionNotes',
            title: <Translate>Admission Notes</Translate>,
            render: rowData => rowData?.admitRecord?.admissionNotes
        },
        {
            key: "",
            title: <Translate>Admission Request By\At</Translate>,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.createdBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
                </>)
            }
        },
        {
            key: 'actions',
            title: <Translate> </Translate>,
            render: rowData => {
                const tooltipCancel = <Tooltip>Cancel Visit</Tooltip>;
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
                                    onClick={()=>{setPatientAdmissionModal(true);setAdmitInPatient({...rowData?.admitRecord })}}
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
            <PatientAdmission
             open={patientAdmissionModal}
             setOpen={setPatientAdmissionModal}
             admitToInpatientObject={admitInPatient}/>
        </Panel>
    );
};

export default WaitingList;