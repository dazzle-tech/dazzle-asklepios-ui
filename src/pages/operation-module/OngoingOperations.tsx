import MyInput from "@/components/MyInput";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useGetOperationRequestsListQuery, useSaveOperationRequestsMutation } from "@/services/operationService";
import { newApOperationRequests } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";
import { faNotesMedical, faPlay } from "@fortawesome/free-solid-svg-icons";
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { Badge, Form, HStack, Tooltip, Whisper } from "rsuite";
import StartedDetails from "./StartedDetails/StartedDetails";
import SearchPatientCriteria from '@/components/SearchPatientCriteria';
import './style.less';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyButton from "@/components/MyButton/MyButton";


export type OngoingRef = {
    refetch: () => void;
};
type OngoingProps = {
    patient?: any;
    setPatient?: (val: any) => void;
    encounter?: any;
    setEncounter?: (val: any) => void;
    open?: boolean;
    setOpen?: (val: boolean) => void;
    request?: any;
    setRequest?: (val: any) => void;

};

const OngoingOperations = forwardRef<OngoingRef, OngoingProps>(({
    patient,
    setPatient,
    encounter,
    setEncounter,
    open,
    setOpen,
    request,
    setRequest,

}, ref) => {
    useImperativeHandle(ref, () => ({
        refetch
    }));



    const dispatch = useAppDispatch();

    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: null
    });

    const [record, setRecord] = useState({});

    const [save, saveMutation] = useSaveOperationRequestsMutation();
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,

        filters: [

            {
                fieldName: "operation_status_lkey",
                operator: "in",
                value: "(3621681578985655) (3622377660614958)"
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
        refetch();
    }, []);

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
            title: <Translate>Actions</Translate>,
            render: (rowData: any) => {
                const isInProgress = rowData?.operationStatusLvalue?.valueCode === "PROC_INPROGRESS";
                const tooltip = (
                    <Tooltip>{isInProgress ? "In Progress" : "Start"}</Tooltip>
                );

                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper trigger="hover" placement="top" speaker={tooltip}>
                            <div>
                                <MyButton
                                    size="small"
                                    backgroundColor={isInProgress ? "orange" : ""}
                                    onClick={() => setOpen(true)}
                                >
                                    <FontAwesomeIcon
                                        icon={isInProgress ? faNotesMedical : faPlay}
                                    />
                                </MyButton>
                            </div>
                        </Whisper>
                    </Form>
                );
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
            key: "createdAt",
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
            key: "submitedAt",
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
            key: "deletedAt",
            title: <Translate>Cancelled At/By</Translate>,
            expandable: true,
            render: (rowData: any) => {
                return (<>
                    <span>{rowData.deletedBy} </span>
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



    const { data: operationLov } = useGetLovValuesByCodeQuery('OPERATION_NAMES');
    const { data: operationorderLov } = useGetLovValuesByCodeQuery('OPERATION_ORDER_TYPE');
    const { data: proclevelLov } = useGetLovValuesByCodeQuery('PROCEDURE_LEVEL');
    const { data: priorityLov } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
    const { data: statusLov } = useGetLovValuesByCodeQuery('PROC_STATUS');




    const filters = () => {
        return (
            <>
                <Form layout="inline" fluid className="container-of-filter-fields-department">

                    <div className='container-of-filter-fields-department-date-filters'>
                        <MyInput
                            fieldType="date"
                            fieldLabel="From Date"
                            fieldName="fromDate"
                            record={dateFilter}
                            setRecord={setDateFilter}
                            showLabel={false}
                            column
                        />
                        <MyInput
                            fieldType="date"
                            fieldLabel="To Date"
                            fieldName="toDate"
                            record={dateFilter}
                            setRecord={setDateFilter}
                            showLabel={false}
                            column
                        />
                    </div>
                    <SearchPatientCriteria
                        record={record}
                        setRecord={setRecord}
                    />

                    <MyInput
                        column
                        width={150}
                        fieldType="select"
                        fieldLabel="Operation Name"
                        fieldName="key"
                        selectData={operationLov?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={record}
                        setRecord={setRecord}
                    />

                    <MyInput
                        column
                        width={150}
                        fieldType="select"
                        fieldLabel="Status"
                        fieldName="key"
                        selectData={statusLov?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={record}
                        setRecord={setRecord}
                    />

                </Form>

                <AdvancedSearchFilters
                    searchFilter={true}
                    content={
                        <div className="advanced-filters">

                            <Form fluid className="dissss">
                                <MyInput
                                    fieldName="accessTypeLkey"
                                    fieldType="select"
                                    selectData={operationorderLov?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    fieldLabel="Operation Type"
                                    selectDataValue="key"
                                    record={record}
                                    setRecord={setRecord}
                                    searchable={false}
                                    width={150}
                                />
                                <MyInput
                                    width={150}
                                    fieldName="priority"
                                    fieldType="select"
                                    record={record}
                                    setRecord={setRecord}
                                    selectData={proclevelLov?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldLabel="Operation Level"
                                    searchable={false}
                                />
                                <MyInput
                                    width={150}
                                    fieldType="date"
                                    fieldLabel="Operation Date"
                                    fieldName="operationDate"
                                    record={dateFilter}
                                    setRecord={setDateFilter}
                                />

                                <MyInput
                                    width={150}
                                    fieldName="priority"
                                    fieldType="select"
                                    record={record}
                                    setRecord={setRecord}
                                    selectData={priorityLov?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldLabel="Priority"
                                    searchable={false}
                                />

                            </Form>

                        </div>
                    }
                />
            </>
        );
    };



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
        <StartedDetails open={open} setOpen={setOpen}
            patient={patient} encounter={encounter}
            operation={request} setOperation={setRequest}
            refetch={refetch} editable={true} />
    </>);
});
export default OngoingOperations;