import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveFunctionalAssessmentMutation, useGetFunctionalAssessmentsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddFunctionalAssessment from './AddFunctionalAssessment';
import { FaEye } from 'react-icons/fa';
import ViewFunctionalAssessment from './ViewFunctionalAssessment';


const FunctionalAssessment = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({ ...newApFunctionalAssessment });
    const [saveFunctionalAssessment] = useSaveFunctionalAssessmentMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [functionalAssessmentStatus, setFunctionalAssessmentStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const [openViewModal, setOpenViewModal] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [functionalAssessmentListRequest, setFunctionalAssessmentListRequest] = useState<ListRequest>({
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

    // Fetch the list of Functional Assessment based on the provided request, and provide a refetch function
    const { data: functionalAssessmentResponse, refetch, isLoading } = useGetFunctionalAssessmentsQuery(functionalAssessmentListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && functionalAssessment && functionalAssessment.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setFunctionalAssessment({ ...newApFunctionalAssessment });
    };

    // Handle Add New Functional Assessment Puretone Record
    const handleAddNewFunctionalAssessment = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setFunctionalAssessmentListRequest({ ...functionalAssessmentListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFunctionalAssessmentListRequest({
            ...functionalAssessmentListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Functional Assessment Record
    const handleCancle = () => {
        //TODO convert key to code
        saveFunctionalAssessment({ ...functionalAssessment, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
            dispatch(notify({ msg: 'Functional Assessment Canceled Successfully', sev: 'success' }));
            refetch();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setFunctionalAssessmentListRequest((prev) => ({
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
        setFunctionalAssessmentListRequest((prev) => ({
            ...prev,
            filters: [
                ...(functionalAssessmentStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: functionalAssessmentStatus,
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
    }, [functionalAssessmentStatus, allData]);
    useEffect(() => {
        setFunctionalAssessmentListRequest((prev) => {
            const filters =
                functionalAssessmentStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : functionalAssessmentStatus === '' && allData
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
    }, [allData, functionalAssessmentStatus]);

    // Pagination values
    const pageIndex = functionalAssessmentListRequest.pageNumber - 1;
    const rowsPerPage = functionalAssessmentListRequest.pageSize;
    const totalCount = functionalAssessmentResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'createdAt',
            title: 'CREATED AT/BY',
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
        },
        {
            key: 'details',
            title: <Translate>VIEW</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <FaEye
                    title="View"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        setOpenViewModal(true);
                        setFunctionalAssessment(rowData);
                    }} />
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
                        setFunctionalAssessment(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
    ];


    return (
        <div>
            <AddFunctionalAssessment
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                functionalAssessmentObj={functionalAssessment}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit ? !functionalAssessment?.key : true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setFunctionalAssessmentStatus('3196709905099521');
                    }
                    else {
                        setFunctionalAssessmentStatus('');
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
                        onClick={handleAddNewFunctionalAssessment}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={functionalAssessmentResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setFunctionalAssessment({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            {/* View Functional Assessment Modal */}
            <ViewFunctionalAssessment
                open={openViewModal}
                setOpen={setOpenViewModal}
                functionalAssessmentObj={functionalAssessment}/>
            {/* Cancellation Modal */}
            <CancellationModal title="Cancel Functional Assessment" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={functionalAssessment} setObject={setFunctionalAssessment} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default FunctionalAssessment;


