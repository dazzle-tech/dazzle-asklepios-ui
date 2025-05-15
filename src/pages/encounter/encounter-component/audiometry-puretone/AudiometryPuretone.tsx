import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox, Text } from 'rsuite';
import { useSaveAudiometryPuretoneMutation, useGetAudiometryPuretonesQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import Translate from '@/components/Translate';
import { MdModeEdit } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import CancellationModal from '@/components/CancellationModal';
import { newApAudiometryPuretone } from '@/types/model-types-constructor';
import { ApAudiometryPuretone } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import AddAudiometryPuretone from './AddAudiometryPuretone';
import MyTable from '@/components/MyTable';

const AudiometryPuretone = ({ patient, encounter,edit }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [open, setOpen] = useState(false);
    const [audiometryPuretone, setAudiometryPuretone] = useState<ApAudiometryPuretone>({
        ...newApAudiometryPuretone
        , earExamFindingsLkey: null,
        airConductionFrequenciesLeft: null,
        airConductionFrequenciesRight: null,
        hearingThresholdsLeft: null,
        hearingThresholdsRight: null,
        boneConductionFrequenciesLeft: null,
        boneConductionFrequenciesRight: null,
        boneConductionThresholdsLeft: null,
        boneConductionThresholdsRight: null,
        maskedUsed: false,
        hearingLossTypeLkey: null,
        hearingLossDegreeLkey: null,
    });
    const [saveAudiometryPureton] = useSaveAudiometryPuretoneMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [audiometryPuretonStatus, setAudiometryPuretonStatus] = useState('');
    const [allData, setAllData] = useState(false);
   
    // Initialize list request with default filters
    const [audiometryPuretoneListRequest, setAudiometryPuretoneListRequest] = useState<ListRequest>({
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

    // Fetch the list of Audiometry Pureton based on the provided request, and provide a refetch function
    const { data: audiometryPuretonResponse, refetch: refetchAudiometryPureton, isLoading } = useGetAudiometryPuretonesQuery(audiometryPuretoneListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && audiometryPuretone && audiometryPuretone.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setAudiometryPuretoneListRequest({ ...audiometryPuretoneListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setAudiometryPuretoneListRequest({
            ...audiometryPuretoneListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Add NewAudiometry Puretone Record
    const handleAddNewAudiometryPuretone = () => {
        handleClearField();
        setOpen(true);
    }
    // Handle Clear Fields
    const handleClearField = () => {
        setAudiometryPuretone({
            ...newApAudiometryPuretone,
            earExamFindingsLkey: null,
            maskedUsed: false,
            hearingLossTypeLkey: null,
            hearingLossDegreeLkey: null,
        });
    }
    // Handle Audiometry Puretone Record
    const handleCancle = () => {
        //TODO convert key to code
        saveAudiometryPureton({ ...audiometryPuretone, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Audiometry Pureton Canceled Successfully'));
            refetchAudiometryPureton();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => ({
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
        setAudiometryPuretoneListRequest((prev) => ({
            ...prev,
            filters: [
                ...(audiometryPuretonStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: audiometryPuretonStatus,
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
    }, [audiometryPuretonStatus, allData]);
    useEffect(() => {
        setAudiometryPuretoneListRequest((prev) => {
            const filters =
                audiometryPuretonStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : audiometryPuretonStatus === '' && allData
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
    }, [allData, audiometryPuretonStatus]);
    // Pagination values
    const pageIndex = audiometryPuretoneListRequest.pageNumber - 1;
    const rowsPerPage = audiometryPuretoneListRequest.pageSize;
    const totalCount = audiometryPuretonResponse?.extraNumeric ?? 0;

    // Table Columns
    const columns = [
        {
            key: 'expand',
            title: '',
            expandable: true,
        },
        {
            key: 'testEnvironment',
            title: 'TEST ENVIRONMENT',
            render: rowData => rowData?.testEnvironment
        },
        {
            key: 'testReason',
            title: 'TEST REASON',
            render: rowData => rowData?.testReason
        },
        {
            key: 'earExamFindings',
            title: 'EAR EXAM FINDINGS',
            render: rowData =>
                rowData?.earExamFindingsLvalue
                    ? rowData.earExamFindingsLvalue.lovDisplayVale
                    : rowData.earExamFindingsLkey
        },
        {
            key: 'maskedUsed',
            title: 'MASKED USED',
            render: rowData => rowData?.maskedUsed ? "YES" : "NO"
        },
        {
            key: 'hearingLossType',
            title: 'HEARING LOSS TYPE',
            render: rowData =>
                rowData?.hearingLossTypeLvalue
                    ? rowData.hearingLossTypeLvalue.lovDisplayVale
                    : rowData.hearingLossTypeLkey
        },
        {
            key: 'hearingLossDegree',
            title: 'HEARING LOSS DEGREE',
            render: rowData =>
                rowData?.hearingLossDegreeLvalue
                    ? rowData.hearingLossDegreeLvalue.lovDisplayVale
                    : rowData.hearingLossDegreeLkey,
                    expandable: true,
        },
        {
            key: 'recommendations',
            title: 'RECOMMENDATIONS',
            render: rowData => rowData?.recommendations,
            expandable: true,
        },
        {
            key: 'additionalNotes',
            title: 'ADDITIONAL NOTES',
            render: rowData => rowData?.additionalNotes,
            expandable: true,
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
                            setAudiometryPuretone(rowData);
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
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit?!audiometryPuretone?.key:true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setAudiometryPuretonStatus('3196709905099521');
                    }
                    else {
                        setAudiometryPuretonStatus('');
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
                    <MyButton disabled={edit} prefixIcon={() => <PlusIcon />} onClick={handleAddNewAudiometryPuretone}>Add </MyButton>
                </div>
            </div>
            <MyTable
                data={audiometryPuretonResponse?.object ?? []}
                columns={columns}
                loading={isLoading}
                height={600}
                onRowClick={rowData => {
                    setAudiometryPuretone({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel Audiometry Puretone" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={audiometryPuretone} setObject={setAudiometryPuretone} handleCancle={handleCancle} fieldName="cancellationReason" />
            <AddAudiometryPuretone open={open} setOpen={setOpen} patient={patient} encounter={encounter} audiometryPuretoneObject={audiometryPuretone} refetch={refetchAudiometryPureton} edit={edit}/>
        </div>
    );
};
export default AudiometryPuretone;