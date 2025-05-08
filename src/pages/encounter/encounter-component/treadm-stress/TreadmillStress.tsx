import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveTreadmillStresseMutation, useGetTreadmillStressesQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import MyButton from '@/components/MyButton/MyButton';
import { newApTreadmillStress } from '@/types/model-types-constructor';
import { ApTreadmillStress } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import MyTable from '@/components/MyTable';
import AddTreadmillStress from './AddTreadmillStress';
import { MdModeEdit } from 'react-icons/md';
const TreadmillStress = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [open, setOpen] = useState(false);
    const [treadmillStress, setTreadmillStress] = useState<ApTreadmillStress>({
        ...newApTreadmillStress,
        preTestSystolicBp: null,
        preTestDiastolicBp: null,
        exerciseDuration: null,
        maximumHeartRateAchieved: null,
        targetHeartRate: null,
        postTestSystolicBp: null,
        postTestDiastolicBp: null,
        recoveryTime: null,
    });
    const [saveTreadmillStress] = useSaveTreadmillStresseMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [treadmillStressStatus, setTreadmillStressStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [treadmillStressListRequest, setTreadmillStressListRequest] = useState<ListRequest>({
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

    // Fetch the list of  Treadmill Stress based on the provided request, and provide a refetch function
    const { data: treadmillStressResponse, refetch: refetchTreadmillStress, isLoading } = useGetTreadmillStressesQuery(treadmillStressListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && treadmillStress && treadmillStress.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields Function
    const handleClearField = () => {
        setTreadmillStress({
            ...newApTreadmillStress,
            baselineEcgFindingsLkey: null,
            bruceProtocolStageLkey: null,
            segmentChangeLkey: null,
            typeLkey: null,
            statusLkey: null,
            testOutcomeLkey: null,
            arrhythmiaNoted: false
        });
    };
    // Handle Add New Treadmill Stress Record
    const handleAddNewTreadmillStress = () => {
        handleClearField();
        setOpen(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setTreadmillStressListRequest({ ...treadmillStressListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setTreadmillStressListRequest({
            ...treadmillStressListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancle Function
    const handleCancle = () => {
        //TODO convert key to code
        saveTreadmillStress({ ...treadmillStress, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Stress Canceled Successfully'));
            refetchTreadmillStress();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setTreadmillStressListRequest((prev) => ({
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
        setTreadmillStressListRequest((prev) => ({
            ...prev,
            filters: [
                ...(treadmillStressStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: treadmillStressStatus,
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
    }, [treadmillStressStatus, allData]);
    useEffect(() => {
        setTreadmillStressListRequest((prev) => {
            const filters =
                treadmillStressStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : treadmillStressStatus === '' && allData
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
    }, [allData, treadmillStressStatus]);

    // Pagination values
    const pageIndex = treadmillStressListRequest.pageNumber - 1;
    const rowsPerPage = treadmillStressListRequest.pageSize;
    const totalCount = treadmillStressResponse?.extraNumeric ?? 0;

    // Table Columns
    const columns = [
        {
            key: 'indication',
            title: 'TEST INDICATION',
            dataKey: 'indication',
        },
        {
            key: 'baselineEcgFindings',
            title: 'BASELINE ECG FINDINGS',
            render: (row: any) =>
                row?.baselineEcgFindingsLvalue
                    ? row.baselineEcgFindingsLvalue.lovDisplayVale
                    : row.baselineEcgFindingsLkey,
        },
        {
            key: 'bruceProtocolStage',
            title: 'BRUCE PROTOCOL STAGE',
            render: (row: any) =>
                row?.bruceProtocolStageLvalue
                    ? row.bruceProtocolStageLvalue.lovDisplayVale
                    : row.bruceProtocolStageLkey,
        },
        {
            key: 'exerciseDuration',
            title: 'EXERCISE DURATION',
            render: (row: any) => row?.exerciseDuration ? `${row?.exerciseDuration ?? ''} Minutes` : " ",
        },
        {
            key: 'maximumHeartRateAchieved',
            title: 'MAXIMUM HEART RATE ACHIEVED',
            render: (row: any) => row?.maximumHeartRateAchieved ? `${row?.maximumHeartRateAchieved ?? ''} BPM` : " ",
        },
        {
            key: 'recoveryTime',
            title: 'RECOVERY TIME',
            render: (row: any) => row?.recoveryTime ? `${row?.recoveryTime ?? ''} Minutes` : " ",
            expandable: true,
        },
        {
            key: 'preTestBp',
            title: 'PRE-TEST BP',
            expandable: true,
            render: (row: any) =>
                (row?.preTestDiastolicBp != null && row?.preTestDiastolicBp != 0) && (row?.preTestSystolicBp != null && row?.preTestSystolicBp != 0) ? `${row?.preTestDiastolicBp} / ${row?.preTestSystolicBp}` :" "
        },
        {
            key: 'postTestBp',
            title: 'POST-TEST BP',
            expandable: true,
            render: (row: any) =>
                (row?.postTestDiastolicBp != null && row?.postTestDiastolicBp != 0) && (row?.postTestSystolicBp != null && row?.postTestSystolicBp != 0) ? `${row?.postTestDiastolicBp} / ${row?.postTestSystolicBp}` :" "
                  
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
                            setTreadmillStress(rowData);
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
    ];

    return (
        <div>
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!treadmillStress?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setTreadmillStressStatus('3196709905099521');
                    }
                    else {
                        setTreadmillStressStatus('');
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
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewTreadmillStress}>Add </MyButton>
                </div>
            </div>
            <MyTable
                data={treadmillStressResponse?.object ?? []}
                columns={columns}
                loading={isLoading}
                height={600}
                onRowClick={(row) => setTreadmillStress({ ...row })}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <AddTreadmillStress open={open} setOpen={setOpen} patient={patient} encounter={encounter} treadmillStressObject={treadmillStress} refetch={refetchTreadmillStress} />
            <CancellationModal title="Cancel Chief Complaint Symptoms" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={treadmillStress} setObject={setTreadmillStress} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default TreadmillStress;