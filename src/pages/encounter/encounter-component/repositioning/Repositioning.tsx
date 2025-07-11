import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useGetRepositioningListQuery, useSaveNewPositionMutation } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApRepositioning } from '@/types/model-types-constructor';
import { ApRepositioning } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddRepositioningModal from './AddRepositioningModal';

const Repositioning = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [position, setPosition] = useState<ApRepositioning>({ ...newApRepositioning });
    const [savePosition] = useSaveNewPositionMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [positionStatus, setPositionStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [positionListRequest, setPositionListRequest] = useState<ListRequest>({
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

    // Fetch the list of Position based on the provided request, and provide a refetch function
    const { data: rePositionListResponse, refetch, isLoading } = useGetRepositioningListQuery(positionListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && position && position.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setPosition({
            ...newApRepositioning,
            newPositionLkey: null,
            timeUnitLkey: null,
        });
    };
    // Handle Add New Pain Assessment Puretone Record
    const handleAddNewPosition = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setPositionListRequest({ ...positionListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPositionListRequest({
            ...positionListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Pain Assessment Record
    const handleCancle = () => {
        //TODO convert key to code
        savePosition({ ...position, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
            dispatch(notify({ msg: 'Pain Assessment Canceled Successfully', sev: 'success' }));
            refetch();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setPositionListRequest((prev) => ({
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
        setPositionListRequest((prev) => ({
            ...prev,
            filters: [
                ...(positionStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: positionStatus,
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
    }, [positionStatus, allData]);
    useEffect(() => {
        setPositionListRequest((prev) => {
            const filters =
                positionStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : positionStatus === '' && allData
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
    }, [allData, positionStatus]);

    // Pagination values
    const pageIndex = positionListRequest.pageNumber - 1;
    const rowsPerPage = positionListRequest.pageSize;
    const totalCount = rePositionListResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'createdAt',
            title: 'Date & Time',
            render: (row: any) =>
                row?.createdAt ? (
                    <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                ) : (
                    ' '
                ),
        },
        {
            key: 'newPositionLkey',
            title: 'New Position',
            render: (rowData: any) =>
                rowData?.newPositionLvalue
                    ? rowData.newPositionLvalue.lovDisplayVale
                    : rowData.newPositionLkey,
        },
        {
            key: 'positionChangeSuccessful',
            title: 'Position Change Successful?',
            render: (rowData: any) =>
                rowData?.positionChangeSuccessful
                    ? "YES"
                    : "NO",
        },
        {
            key: 'expectedNextRepositioning',
            title: 'Expected Next Repositioning ',
            render: (rowData: any) =>
                <> {rowData?.expectedNextRepositioning}
                    {"  "}
                    {rowData?.timeUnitLvalue
                        ? rowData.timeUnitLvalue.lovDisplayVale
                        : rowData.timeUnitLkey
                    }</>
        },
        {
            key: 'notes',
            title: 'Notes',
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
                        setPosition(rowData);
                        setOpenAddModal(true);
                    }}
                />
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
            <AddRepositioningModal
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                positionObj={position}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit ? !position?.key : true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setPositionStatus('3196709905099521');
                    }
                    else {
                        setPositionStatus('');
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
                        onClick={handleAddNewPosition}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={rePositionListResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setPosition({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel the Repositioning Procedure" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={position} setObject={setPosition} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default Repositioning;