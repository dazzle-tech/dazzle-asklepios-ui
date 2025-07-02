import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveChiefComplainMutation, useGetChiefComplainQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApInpatientChiefComplain } from '@/types/model-types-constructor';
import { ApInpatientChiefComplain } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddChiefComplain from './AddChiefComplain';
const ChiefComplain = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [chiefComplain, setChiefComplain] = useState<ApInpatientChiefComplain>({ ...newApInpatientChiefComplain });
    const [saveChiefComplain] = useSaveChiefComplainMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [chiefComplainStatus, setChiefComplainStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [chiefComplaintListRequest, setChiefComplainListRequest] = useState<ListRequest>({
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

    // Fetch the list of Chief Complain based on the provided request, and provide a refetch function
    const { data: chiefComplainResponse, refetch, isLoading } = useGetChiefComplainQuery(chiefComplaintListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && chiefComplain && chiefComplain.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setChiefComplain({
            ...newApInpatientChiefComplain,
            qualityLkey: null,
            regionLkey: null,
            severityLkey: null,
        });
    };

    // Handle Add New Chief Complain Puretone Record
    const handleAddNewChiefComplain = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setChiefComplainListRequest({ ...chiefComplaintListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setChiefComplainListRequest({
            ...chiefComplaintListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Chief Complain Record
    const handleCancle = () => {
        //TODO convert key to code
        saveChiefComplain({ ...chiefComplain, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
            dispatch(notify({ msg: 'Chief Complain Canceled Successfully', sev: 'success' }));
            refetch();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setChiefComplainListRequest((prev) => ({
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
        setChiefComplainListRequest((prev) => ({
            ...prev,
            filters: [
                ...(chiefComplainStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: chiefComplainStatus,
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
    }, [chiefComplainStatus, allData]);
    useEffect(() => {
        setChiefComplainListRequest((prev) => {
            const filters =
                chiefComplainStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : chiefComplainStatus === '' && allData
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
    }, [allData, chiefComplainStatus]);

    // Pagination values
    const pageIndex = chiefComplaintListRequest.pageNumber - 1;
    const rowsPerPage = chiefComplaintListRequest.pageSize;
    const totalCount = chiefComplainResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'chiefComplaint',
            title: 'Chief Complain',

        },
        {
            key: 'provocation',
            title: 'Provocation',
        },
        {
            key: 'palliation',
            title: 'Palliation',
        },
        {
            key: 'qualityLkey',
            title: 'Quality',
            render: (rowData: any) =>
                rowData?.qualityLvalue
                    ? rowData.qualityLvalue.lovDisplayVale
                    : rowData.qualityLkey,
        },
        {
            key: 'regionLkey',
            title: 'Region',
            render: (rowData: any) =>
                rowData?.regionLvalue
                    ? rowData.regionLvalue.lovDisplayVale
                    : rowData.regionLkey,
        },
        {
            key: 'severityLkey',
            title: 'Severity',
            render: (rowData: any) =>
                rowData?.severityLvalue
                    ? rowData.severityLvalue.lovDisplayVale
                    : rowData.severityLkey,
        },
        {
            key: 'onsetDateTime',
            title: 'Onset',
            expandable: true,
            render: (row: any) =>
                row?.onsetDateTime ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.onsetDateTime)}</span>
                    </>
                ) : (
                    ' '
                ),
        },
        {
            key: 'details',
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <MdModeEdit
                    title="Edit"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        setChiefComplain(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
        {
            key: 'understanding',
            title: 'Understanding',
            dataKey: 'understanding',
            expandable: true,
        },
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
            expandable: true,
            render: (row: any) =>
                row?.createdAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                    </>
                ) : (
                    ' '
                ),
        },
        {
            key: 'deletedAt',
            title: 'CANCELLED AT/BY',
            expandable: true,
            render: (row: any) =>
                row?.deletedAt ? (
                    <>
                        <br />
                        <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
                    </>
                ) : (
                    ' '
                ),
        },
        {
            key: 'cancellationReason',
            title: 'CANCELLATION REASON',
            dataKey: 'cancellationReason',
            expandable: true,
        },
    ];


    return (
        <div>
            <AddChiefComplain
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                chiefComplainObj={chiefComplain}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit ? !chiefComplain?.key : true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setChiefComplainStatus('3196709905099521');
                    }
                    else {
                        setChiefComplainStatus('');
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
                    <MyButton
                        disabled={edit}
                        onClick={handleAddNewChiefComplain}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={chiefComplainResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setChiefComplain({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel Chief Complain" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={chiefComplain} setObject={setChiefComplain} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default ChiefComplain;