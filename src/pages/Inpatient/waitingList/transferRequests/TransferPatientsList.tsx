import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { newApEncounter, newApTransferPatient } from '@/types/model-types-constructor';
import React, { useEffect, useState } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBedPulse, faFileWaveform, faRectangleXmark } from '@fortawesome/free-solid-svg-icons';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { Form, Panel, Tooltip, Whisper, Checkbox } from 'rsuite';
import { notify } from '@/utils/uiReducerActions';
import CancellationModal from '@/components/CancellationModal';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetTransferPatientsListQuery, useSaveTransferPatientMutation } from '@/services/encounterService';
import { useDispatch } from 'react-redux';
import { formatDateWithoutSeconds } from "@/utils";
import { hideSystemLoader, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import { ApTransferPatient } from '@/types/model-types';
import '../styles.less';
import ConfirmTransferPatientModal from './ConfirmTransferPatientModal';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';

const TransferPatientsList = () => {
    const dispatch = useDispatch();
    const [transferPatient, setTransferPatient] = useState<ApTransferPatient>({ ...newApTransferPatient });
    const [encounter, setLocalEncounter] = useState<any>({ ...newApEncounter, discharge: false });
    const [manualSearchTriggered, setManualSearchTriggered] = useState(false);
    const [saveTransferPatient] = useSaveTransferPatientMutation();
    const authSlice = useAppSelector(state => state.auth);
    const [openPopupCancel, setPopupCancelOpen] = useState(false);
    const [openTransferModal, setOpenTransferModal] = useState(false);
    const [transferRequestStatus, setTransferRequest] = useState('');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: []
    });
    //fetch transfer patients list
    const {
        data: transferPatientsListResponse,
        isFetching,
        refetch,
        isLoading
    } = useGetTransferPatientsListQuery(listRequest);

    const [dateFilter, setDateFilter] = useState({
        fromDate: new Date(),
        toDate: new Date()
    });

    // Filters
    const filters = () => (<>
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
            <div className='checkboxes-container-transfer-patient-list'>
                <Checkbox
                    onChange={(value, checked) => {
                        setTransferRequest(checked ? '91098528988200' : '');
                    }}
                >
                    Show Cancelled
                </Checkbox>
            </div>
        </Form>

        <AdvancedSearchFilters searchFilter={true}/>
    </>);
    // Table Columns
    const tableColumns = [
        {
            key: 'queueNumber',
            title: <Translate>#</Translate>,
            dataKey: 'queueNumber',
            render: rowData => rowData?.patient?.patientMrn
        },
        {
            key: 'fullName',
            title: <Translate>PATIENT NAME</Translate>,
            fullText: true,
            render: rowData => rowData?.patient?.fullName
        },
        {
            key: 'patientMrn',
            title: <Translate>MRN</Translate>,
            render: rowData => rowData?.patient?.patientMrn
        },
        {
            key: 'genderLkey',
            title: <Translate>Gender</Translate>,
            render: rowData => rowData?.patient?.genderLvalue?.lovDisplayVale || rowData?.patient?.genderLkey
        },
        {
            key: 'fromDepartment',
            title: <Translate>From Ward</Translate>,
            render: rowData => rowData?.fromDepartment?.name
        },
        {
            key: 'toDepartment',
            title: <Translate>To Ward</Translate>,
            render: rowData => rowData?.toDepartment?.name
        },
        {
            key: 'reasonForTransfer',
            title: <Translate>Transfer Reason</Translate>,
            render: rowData => rowData?.reasonForTransfer
        },
        {
            key: 'plannedTransfer',
            title: <Translate>Is Planned</Translate>,
            render: rowData => rowData?.plannedTransfer ? "YES" : "NO"
        },
        {
            key: 'urgentTransfer',
            title: <Translate>Is Urgent</Translate>,
            render: rowData => rowData?.urgentTransfer ? "YES" : "NO"
        },
        {
            key: 'createdAt',
            title: 'Requested By/At',
            render: row =>
                row?.createdAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                    </>
                ) : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            render: row =>
                row?.deletedAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
                    </>
                ) : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
        },
        {
            key: 'actions',
            title: <Translate> </Translate>,
            render: rowData => {
                const tooltipCancel = <Tooltip>Cancel Transfer</Tooltip>;
                const tooltipConfirm = <Tooltip>Confirm</Tooltip>;
                const tooltipEMR = <Tooltip>Go to EMR</Tooltip>;
                return (
                    <Form layout="inline" fluid className="nurse-doctor-form">
                        <Whisper trigger="hover" placement="top" speaker={tooltipCancel}>
                            <div>
                                <MyButton size="small" onClick={() => {
                                    setPopupCancelOpen(true);
                                    setTransferPatient(rowData);
                                }}>
                                    <FontAwesomeIcon icon={faRectangleXmark} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipConfirm}>
                            <div>
                                <MyButton size="small" backgroundColor="black" onClick={() => {
                                    setTransferPatient(rowData);
                                    setOpenTransferModal(true);
                                }}>
                                    <FontAwesomeIcon icon={faBedPulse} />
                                </MyButton>
                            </div>
                        </Whisper>
                        <Whisper trigger="hover" placement="top" speaker={tooltipEMR}>
                            <div>
                                <MyButton size="small" backgroundColor="violet">
                                    <FontAwesomeIcon icon={faFileWaveform} />
                                </MyButton>
                            </div>
                        </Whisper>
                    </Form>
                );
            }
        }
    ];
    // Build Filters for the List Request
    const buildFilters = () => {
        const fromDate = dateFilter.fromDate ? new Date(dateFilter.fromDate) : null;
        const toDate = dateFilter.toDate ? new Date(dateFilter.toDate) : null;

        if (fromDate) fromDate.setHours(0, 0, 0, 0);
        if (toDate) toDate.setHours(23, 59, 59, 999);

        let filters: ListRequest['filters'] = [
            {
                fieldName: 'status_lkey',
                operator: 'notMatch',
                value: "6572194150955704"
            }
        ];

        if (transferRequestStatus !== '') {
            filters.push({
                fieldName: 'status_lkey',
                operator: 'match',
                value: transferRequestStatus
            });
        } else {
            filters.push({
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            });
        }

        if (fromDate && toDate) {
            filters.push({
                fieldName: 'created_at',
                operator: 'between',
                value: `${fromDate.getTime()}_${toDate.getTime()}`
            });
        } else if (fromDate) {
            filters.push({
                fieldName: 'created_at',
                operator: 'gte',
                value: fromDate.getTime().toString()
            });
        } else if (toDate) {
            filters.push({
                fieldName: 'created_at',
                operator: 'lte',
                value: toDate.getTime().toString()
            });
        }

        return filters;
    };
    // Check if the row is selected
    const isSelected = rowData => {
        return rowData?.key === encounter?.key ? 'selected-row' : '';
    };
    // Handle Cancel Transfer Request
    const handleCancel = () => {
        saveTransferPatient({
            ...transferPatient,
            statusLkey: "91098528988200",
            deletedAt: (new Date()).getTime(),
            deletedBy: authSlice.user.key
        }).unwrap().then(() => {
            dispatch(notify('Transfer Request Canceled Successfully'));
            refetch();
        });
        setPopupCancelOpen(false);
    };
    // Handle Page Change
    const handlePageChange = (_: unknown, newPage: number) => {
        setManualSearchTriggered(true);
        setListRequest(prev => ({ ...prev, pageNumber: newPage + 1 }));
    };
    // Handle Rows Per Page Change
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setManualSearchTriggered(true);
        setListRequest(prev => ({
            ...prev,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1
        }));
    };
    // Effects
    useEffect(() => {
        setListRequest(prev => ({
            ...prev,
            filters: buildFilters()
        }));
        setManualSearchTriggered(true);
    }, [dateFilter, transferRequestStatus]);

    useEffect(() => {
        if (isLoading || (manualSearchTriggered && isFetching)) {
            dispatch(showSystemLoader());
        } else {
            dispatch(hideSystemLoader());
        }

        return () => {
            dispatch(hideSystemLoader());
        };
    }, [isLoading, isFetching, dispatch]);


    useEffect(() => {
        if (!isFetching && manualSearchTriggered) {
            setManualSearchTriggered(false);
        }
    }, [isFetching, manualSearchTriggered]);

    return (
        <Panel>
            <MyTable
                filters={filters()}
                height={600}
                data={transferPatientsListResponse?.object ?? []}
                columns={tableColumns}
                rowClassName={isSelected}
                loading={isLoading || (manualSearchTriggered && isFetching) || isFetching}
                onRowClick={rowData => setLocalEncounter(rowData)}
                sortColumn={listRequest.sortBy}
                sortType={listRequest.sortType}
                onSortChange={(sortBy, sortType) => {
                    setListRequest({ ...listRequest, sortBy, sortType });
                }}
                page={listRequest.pageNumber - 1}
                rowsPerPage={listRequest.pageSize}
                totalCount={transferPatientsListResponse?.extraNumeric ?? 0}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />

            <CancellationModal
                title="Cancel Transfer Request"
                fieldLabel="Cancellation Reason"
                open={openPopupCancel}
                setOpen={setPopupCancelOpen}
                object={transferPatient}
                setObject={setTransferPatient}
                handleCancle={handleCancel}
                fieldName="cancellationReason"
            />

            <ConfirmTransferPatientModal
                open={openTransferModal}
                setOpen={setOpenTransferModal}
                localTransfer={transferPatient}
                refetchInpatientList={refetch}
            />
        </Panel>
    );
};

export default TransferPatientsList;
