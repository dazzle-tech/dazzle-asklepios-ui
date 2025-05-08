import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import MyTable from '@/components/MyTable';
import { useSaveElectrocardiogramECGMutation, useGetElectrocardiogramECGsQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import { MdModeEdit } from 'react-icons/md';
import PlusIcon from '@rsuite/icons/Plus';
import { newApElectrocardiogramEcg } from '@/types/model-types-constructor';
import { ApElectrocardiogramEcg } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import MyButton from '@/components/MyButton/MyButton';
import AddElectrocardiogram from './AddElectrocardiogram';
const ElectrocardiogramECG = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [open, setOpen] = useState(false);
    const [electrocardiogramEcg, setElectrocardiogramEcg] = useState<ApElectrocardiogramEcg>({
        ...newApElectrocardiogramEcg,
        stSegmentChangesLkey: null,
        waveAbnormalitiesLkey: null,
        heartRate: null,
        prInterval: null,
        qrsDuration: null,
        qtInterval: null
    });
    const [saveElectrocardiogramECG] = useSaveElectrocardiogramECGMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [electrocardiogramEcgStatus, setElectrocardiogramEcgStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [electrocardiogramEcgListRequest, setElectrocardiogramEcgListRequest] = useState<ListRequest>({
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

    // Fetch the list of Electrocardiogram ECG based on the provided request, and provide a refetch function
    const { data: electrocardiogramEcgResponse, refetch: refetchelectrocardiogramEcg, isLoading } = useGetElectrocardiogramECGsQuery(electrocardiogramEcgListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && electrocardiogramEcg && electrocardiogramEcg.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields Function
    const handleClearField = () => {
        setElectrocardiogramEcg({
            ...newApElectrocardiogramEcg,
            stSegmentChangesLkey: null,
            waveAbnormalitiesLkey: null
        });
    };

    // Handle Add New Electrocardiogram ECG Record
    const handleAddNewElectrocardiogram = () => {
        handleClearField();
        setOpen(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setElectrocardiogramEcgListRequest({ ...electrocardiogramEcgListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setElectrocardiogramEcgListRequest({
            ...electrocardiogramEcgListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };

    // Handle Cancel ElectrocardiogramECG Record Function
    const handleCancle = () => {
        //TODO convert key to code
        saveElectrocardiogramECG({ ...electrocardiogramEcg, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('ECG Canceled Successfully'));
            refetchelectrocardiogramEcg();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setElectrocardiogramEcgListRequest((prev) => ({
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
        setElectrocardiogramEcgListRequest((prev) => ({
            ...prev,
            filters: [
                ...(electrocardiogramEcgStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: electrocardiogramEcgStatus,
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
    }, [electrocardiogramEcgStatus, allData]);
    useEffect(() => {
        setElectrocardiogramEcgListRequest((prev) => {
            const filters =
                electrocardiogramEcgStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : electrocardiogramEcgStatus === '' && allData
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
    }, [allData, electrocardiogramEcgStatus]);
    // Pagination values
    const pageIndex = electrocardiogramEcgListRequest.pageNumber - 1;
    const rowsPerPage = electrocardiogramEcgListRequest.pageSize;
    const totalCount = electrocardiogramEcgResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'indication',
            title: <Translate>INDICATION</Translate>,
            render: (rowData) => rowData?.indication,
        },
        {
            key: 'ecgLeadType',
            title: <Translate>ECG LEAD TYPE</Translate>,
            render: (rowData) => rowData?.ecgLeadType,
        },
        {
            key: 'heartRate',
            title: <Translate>HEART RATE</Translate>,
            render: (rowData) => rowData?.heartRate ? `${rowData?.heartRate ?? ''} BPM`:" ",
        },
        {
            key: 'prInterval',
            title: <Translate>PR INTERVAL</Translate>,
            render: (rowData) => rowData?.prInterval ? `${rowData?.prInterval ?? ''} ms`:" ",
        },
        {
            key: 'qrsDuration',
            title: <Translate>QRS DURATION</Translate>,
            render: (rowData) => rowData?.qrsDuration  ? `${rowData?.qrsDuration ?? ''} ms`:" ",
        },
        {
            key: 'qtInterval',
            title: <Translate>QT INTERVAL</Translate>,
            render: (rowData) => rowData?.qtInterval ? `${rowData?.qtInterval ?? ''} ms`:" ",
        },
        {
            key: 'stSegmentChanges',
            title: <Translate>ST SEGMENT CHANGES</Translate>,
            render: (rowData) =>
                rowData?.stSegmentChangesLvalue?.lovDisplayVale ?? rowData?.stSegmentChangesLkey,
        },
        {
            key: 'waveAbnormalities',
            title: <Translate>T WAVE ABNORMALITIES</Translate>,
            render: (rowData) =>
                rowData?.waveAbnormalitiesLvalue?.lovDisplayVale ?? rowData?.waveAbnormalitiesLkey,
        },
        {
            key: "details",
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setElectrocardiogramEcg(rowData);
                            setOpen(true);
                        }}

                    />
                );
            }
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) => row?.createdAt ? <>{row?.createByUser?.fullName}<br /><span className='date-table-style'>{new Date(row.createdAt).toLocaleString('en-GB')}</span> </> : ' '
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT/BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? <>{row?.updateByUser?.fullName}<br /><span className='date-table-style'>{new Date(row.updatedAt).toLocaleString('en-GB')}</span> </> : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? <>{row?.deleteByUser?.fullName}  <br /><span className='date-table-style'>{new Date(row.deletedAt).toLocaleString('en-GB')}</span></> : ' '
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        }
    ]
    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!electrocardiogramEcg?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setElectrocardiogramEcgStatus('3196709905099521');
                    }
                    else {
                        setElectrocardiogramEcgStatus('');
                    }
                }}>
                    Show Cancelled
                </Checkbox>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        setAllData(true);
                    }
                    else {
                        setAllData(false);
                    }
                }}>
                    Show All
                </Checkbox>
                <div className='bt-right'>
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewElectrocardiogram}>Add </MyButton>
                </div>
            </div>
            <MyTable
                data={electrocardiogramEcgResponse?.object ?? []}
                loading={isLoading}
                height={600}
                onRowClick={(rowData) => setElectrocardiogramEcg({ ...rowData })}
                rowClassName={isSelected}
                page={pageIndex}
                columns={columns}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <AddElectrocardiogram open={open} setOpen={setOpen} patient={patient} encounter={encounter} electrocardiogramEcgObject={electrocardiogramEcg} refetch={refetchelectrocardiogramEcg} />
            <CancellationModal title="Cancel ECG" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={electrocardiogramEcg} setObject={setElectrocardiogramEcg} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default ElectrocardiogramECG;