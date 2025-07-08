import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetOperationRequestsListQuery, useSaveOperationRequestsMutation } from "@/services/operationService";
import { newApOperationRequests } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { useEffect, useState } from "react";
import { Badge, Form, HStack, Tooltip, Whisper } from "rsuite";
import StartedDetails from "./StartedDetails/StartedDetails";
const OngoingOperations = ({ patient, setPatient, encounter, setEncounter }) => {
    const dispatch = useAppDispatch();
    const [open,setOpen]=useState(false)
    const [request, setRequest] = useState<any>({ ...newApOperationRequests });
    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: null
    });
    const [save, saveMutation] = useSaveOperationRequestsMutation();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,

        filters: [

            {
                fieldName: "operation_status_lkey",
                operator: "match",
                value: "3621681578985655"
            }


        ],
    });

    const isSelected = rowData => {
        if (rowData && request && rowData.key === request.key) {
            return 'selected-row';
        } else return '';
    };

    //operation Api's
    const { data: operationrequestList, refetch, isLoading } = useGetOperationRequestsListQuery(listRequest);

    useEffect(() => {

        setPatient(request?.patient);
        setEncounter(request?.encounter)

    }, [request]);

    useEffect(() => {
        let updatedFilters = [...listRequest.filters];

        if (dateFilter.fromDate && dateFilter.toDate) {
            dateFilter.fromDate.setHours(0, 0, 0, 0);
            dateFilter.toDate.setHours(23, 59, 59, 999);

            updatedFilters = addOrUpdateFilter(updatedFilters, {
                fieldName: 'started_at',
                operator: 'between',
                value: dateFilter.fromDate.getTime() + '-' + dateFilter.toDate.getTime()
            });
        } else if (dateFilter.fromDate) {
            dateFilter.fromDate.setHours(0, 0, 0, 0);

            updatedFilters = addOrUpdateFilter(updatedFilters, {
                fieldName: 'started_at',
                operator: 'gte',
                value: dateFilter.fromDate.getTime()
            });
        } else if (dateFilter.toDate) {
            dateFilter.toDate.setHours(23, 59, 59, 999);

            updatedFilters = addOrUpdateFilter(updatedFilters, {
                fieldName: 'started_at',
                operator: 'lte',
                value: dateFilter.toDate.getTime()
            });
        }

        setListRequest(prev => ({
            ...prev,
            filters: updatedFilters
        }));
    }, [dateFilter]);
    //table 
    const columns = [
        {
            key: "patientname",
            title: <Translate>Patient Name</Translate>,
            render: (rowData: any) => {
                const tooltipSpeaker = (
                    <Tooltip>
                        <div>MRN : {rowData?.patient?.patientMrn}</div>

                        <div>
                            Gender :{' '}
                            {rowData?.patient?.genderLvalue
                                ? rowData?.patient?.genderLvalue?.lovDisplayVale
                                : rowData?.patient?.genderLkey}
                        </div>
                        <div>Visit ID : {rowData?.encounter?.visitId}</div>
                    </Tooltip>
                );

                return <Whisper trigger="hover" placement="top" speaker={tooltipSpeaker}>
                    <div style={{ display: 'inline-block' }}>
                        {rowData?.patient?.privatePatient ? (
                            <Badge color='blue' content="Private">
                                <p style={{ marginTop: '5px', cursor: 'pointer' }}>
                                    {rowData?.patient?.fullName}
                                </p>
                            </Badge>
                        ) : (
                            <>
                                <p style={{ cursor: 'pointer' }}>{rowData?.patient?.fullName}</p>
                            </>
                        )}
                    </div>
                </Whisper>;
            }
        },
        {
            key: "diagnosisKey",
            title: <Translate>Pre-op Diagnosis</Translate>,
            render: (rowData: any) => {
                return rowData?.diagnosis?.icdCode;
            }
        },
        {
            key: "oparetionKey",
            title: <Translate>oparation name</Translate>,
            render: (rowData: any) => {
                return null;
            }
        },
        {
            key: "operationTypeLkey",
            title: <Translate>operation type</Translate>,
            render: (rowData: any) => {
                return rowData.operationTypeLvalue ? rowData.operationTypeLvalue.lovDisplayVale : rowData.operationTypeLkey;
            }
        },
        {
            key: "operationLevelLkey",
            title: <Translate>Operation Level</Translate>,
            render: (rowData: any) => {
                return rowData.operationLevelLvalue ? rowData.operationLevelLvalue.lovDisplayVale : rowData.operationLevelLkey;
            }
        },
        {
            key: "operationDateTime",
            title: <Translate>Operation Date/Time</Translate>,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData?.operationDateTime);
            }
        },
        {
            key: "priorityLkey",
            title: <Translate>Priority</Translate>,
            render: (rowData: any) => {
                return rowData.priorityLvalue ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey;;
            }
        },


        {
            key: "actions",
            title: <Translate >Stage</Translate>,
            render: (rowData: any) => {

                return "";
            }
        },
        {
            key: "actions",
            title: <Translate >Actions</Translate>,
            render: (rowData: any) => {
               

                // const isDisabled =request?.key!==rowData.key;
                return <HStack spacing={10}>
                    <Whisper
                        placement="top"
                        trigger="hover"
                        speaker={<Tooltip>Start</Tooltip>}
                    >
                        <FontAwesomeIcon icon={faPlay}
                        onClick={()=>setOpen(true)}
                        // style={isDisabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}}
                        //  onClick={isDisabled?undefined:async () => {
                        //     try {
                        //         setRequest(rowData);
                        //         await save({ ...request, operationStatusLkey: '3621681578985655',startedAt:Date.now() });
                        //         dispatch(notify({ msg: 'Started Successfully', sev: "success" }));
                        //         refetch();
                        //     }
                        //     catch (error) {
                        //         dispatch(notify({ msg: 'Faild', sev: "error" }));
                        //     }
                        // }} 
                        />
                    </Whisper>

                    
                    

                </HStack>;
            }
        },
        {
            key: "operationStatusLkey",
            title: <Translate>Status</Translate>,
            render: (rowData: any) => {
                return rowData.operationStatusLvalue ? rowData.operationStatusLvalue?.lovDisplayVale : rowData.operationStatusLkey;
            }
        },
        {
            key: "",
            title: <Translate>Created At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.createdBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.createdAt)}</span>
                </>)
            }

        },
        {
            key: "",
            title: <Translate>Submited At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.submitedBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.submitedAt)}</span>
                </>)
            }

        },

        {
            key: "",
            title: <Translate>Cancelled At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.deletedBy}</span>
                    <br />
                    <span className='date-table-style'>{formatDateWithoutSeconds(rowData.deletedAt)}</span>
                </>)
            }
        },
    ];
    const addOrUpdateFilter = (filters, newFilter) => {
        const index = filters.findIndex(f => f.fieldName === newFilter.fieldName);
        if (index > -1) {
            // Replace the existing filter
            return filters.map((f, i) => i === index ? newFilter : f);
        } else {
            // Add new filter
            return [...filters, newFilter];
        }
    };
    const filters = () => (
        <Form layout="inline" fluid className="container-of-filter-fields-department">
            <MyInput

                fieldType="date"
                fieldLabel="From Date"
                fieldName="fromDate"
                record={dateFilter}
                setRecord={setDateFilter}
                showLabel={false}
            />
            <MyInput

                fieldType="date"
                fieldLabel="To Date"
                fieldName="toDate"
                record={dateFilter}
                setRecord={setDateFilter}
                showLabel={false}
            />

        </Form>
    );
    return (<>
        <MyTable
            filters={filters()}
            columns={columns}
            data={operationrequestList?.object || []}
            rowClassName={isSelected}
            loading={isLoading}
            onRowClick={rowData => {
                setRequest(rowData)

            }}
            
        />
        <StartedDetails open={open} setOpen={setOpen} patient={patient} encounter={encounter} operation={request} setOperation={setRequest}/>
    </>);
}
export default OngoingOperations;