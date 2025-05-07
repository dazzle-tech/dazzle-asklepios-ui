import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppSelector, useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveComplaintSymptomsMutation, useGetComplaintSymptomsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApComplaintSymptoms } from '@/types/model-types-constructor';
import { ApComplaintSymptoms } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import AddChiefComplaintSymptoms from './AddChiefComplaintSymptoms';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
const ChiefComplaintSymptoms = ({ patient, encounter }) => {
    const authSlice = useAppSelector(state => state.auth);
    const [expandedRowKeys, setExpandedRowKeys] = React.useState([]);
    const [complaintSymptoms, setComplaintSymptoms] = useState<ApComplaintSymptoms>({ ...newApComplaintSymptoms, duration: null });
    const [open, setOpen] = useState(false);
    const [saveComplaintSymptoms] = useSaveComplaintSymptomsMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [complaintSymptomsStatus, setComplaintSymptomsStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [complaintSymptomsListRequest, setComplaintSymptomsListRequest] = useState<ListRequest>({
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

    // Fetch the list of Complaint Symptoms based on the provided request, and provide a refetch function
    const { data: complaintSymptomsResponse, refetch: refetchComplaintSymptoms, isLoading } = useGetComplaintSymptomsQuery(complaintSymptomsListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && complaintSymptoms && complaintSymptoms.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setComplaintSymptoms({
            ...newApComplaintSymptoms,
            unitLkey: null,
            painLocationLkey: null
        });
    };
    // Handle Add NewAudiometry Puretone Record
    const handleAddNewComplaintSymptoms = () => {
        handleClearField();
        setOpen(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setComplaintSymptomsListRequest({ ...complaintSymptomsListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setComplaintSymptomsListRequest({
            ...complaintSymptomsListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Complaint Symptoms Record
    const handleCancle = () => {
        //TODO convert key to code
        saveComplaintSymptoms({ ...complaintSymptoms, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime(), deletedBy: authSlice.user.key }).unwrap().then(() => {
            dispatch(notify('Treadmill Complaint Symptoms Successfully'));
            refetchComplaintSymptoms();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => ({
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
        setComplaintSymptomsListRequest((prev) => ({
            ...prev,
            filters: [
                ...(complaintSymptomsStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: complaintSymptomsStatus,
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
    }, [complaintSymptomsStatus, allData]);
    useEffect(() => {
        setComplaintSymptomsListRequest((prev) => {
            const filters =
                complaintSymptomsStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : complaintSymptomsStatus === '' && allData
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
    }, [allData, complaintSymptomsStatus]);

    // Pagination values
    const pageIndex = complaintSymptomsListRequest.pageNumber - 1;
    const rowsPerPage = complaintSymptomsListRequest.pageSize;
    const totalCount = complaintSymptomsResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'expand',
            title: '#',
            width: 70,
            expandable: true,
        },
        {
            key: 'onsetDate',
            title: 'ONSET DATE',
            render: (rowData: any) =>
                rowData?.onsetDate
                    ? new Date(rowData.onsetDate).toLocaleDateString("en-GB")
                    : ''
        },
        {
            key: 'duration',
            title: 'DURATION',
            render: (rowData: any) => (
                <>
                    {rowData?.duration}{" "}
                    {rowData?.unitLvalue
                        ? rowData?.unitLvalue.lovDisplayVale
                        : rowData?.unitLkey}
                </>
            )
        },
        {
            key: 'painCharacteristics',
            title: 'PAIN CHARACTERISTICS',
        },
        {
            key: 'painLocation',
            title: 'PAIN LOCATION',
            render: (rowData: any) =>
                rowData?.painLocationLvalue
                    ? rowData.painLocationLvalue.lovDisplayVale
                    : rowData.painLocationLkey
        },
        {
            key: 'radiation',
            title: 'RADIATION',
        },
        {
            key: 'aggravatingFactors',
            title: 'AGGRAVATING FACTORS',
        },
        {
            key: 'relievingFactors',
            title: 'RELIEVING FACTORS',
        },
        {
            key: "details",
            title: <Translate>ADD DETAILS</Translate>,
            flexGrow: 2,
            fullText: true,
            render: rowData => {
                return (
                    <MdModeEdit
                        title="Edit"
                        size={24}
                        fill="var(--primary-gray)"
                        onClick={() => {
                            setComplaintSymptoms(rowData);
                            setOpen(true);
                        }}

                    />
                );
            }
        },
        {
            key: 'createdAt',
            title: 'CREATED AT / CREATED BY',
            expandable: true,
            render: (row: any) => `${new Date(row.createdAt).toLocaleString('en-GB')} / ${row?.createByUser?.fullName}`
        },
        {
            key: 'updatedAt',
            title: 'UPDATED AT / UPDATED BY',
            expandable: true,
            render: (row: any) => row?.updatedAt ? `${new Date(row.updatedAt).toLocaleString('en-GB')} / ${row?.updateByUser?.fullName}` : ' '
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT / CANCELLED BY',
            expandable: true,
            render: (row: any) => row?.deletedAt ? `${new Date(row.deletedAt).toLocaleString('en-GB')} / ${row?.deleteByUser?.fullName}` : ' '
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
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!complaintSymptoms?.key}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setComplaintSymptomsStatus('3196709905099521');
                    }
                    else {
                        setComplaintSymptomsStatus('');
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
                    <MyButton prefixIcon={() => <PlusIcon />} onClick={handleAddNewComplaintSymptoms}>Add </MyButton>
                </div>
            </div>
            <AddChiefComplaintSymptoms open={open} setOpen={setOpen} patient={patient} encounter={encounter} complaintSymptom={complaintSymptoms} refetch={refetchComplaintSymptoms} />
            <MyTable
                data={complaintSymptomsResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setComplaintSymptoms({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel Chief Complaint Symptoms" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={complaintSymptoms} setObject={setComplaintSymptoms} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default ChiefComplaintSymptoms;