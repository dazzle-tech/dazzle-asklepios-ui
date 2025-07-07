import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import {  useGetPainAssessmentQuery, useSavePainAssessmentMutation } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApPainAssessment } from '@/types/model-types-constructor';
import { ApPainAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddPainAssessment from './AddPainAssessment';
const PainAssessment = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [painAssessment, setPainAssessment] = useState<ApPainAssessment>({ ...newApPainAssessment });
    const [savePainAssessment] = useSavePainAssessmentMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [painAssessmentStatus, setPainAssessmentStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [painAssessmentListRequest, setPainAssessmentListRequest] = useState<ListRequest>({
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

    // Fetch the list of Pain Assessment based on the provided request, and provide a refetch function
    const { data: painAssessmentResponse, refetch, isLoading } = useGetPainAssessmentQuery(painAssessmentListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && painAssessment && painAssessment.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setPainAssessment({
            ...newApPainAssessment,
            painDegreeLkey: null,
            painLocationLkey: null,
            painPatternLkey: null,
            onsetLkey: null,
            painScoreLkey: null,
            durationUnitLkey: null,
            statusLkey: null,
            aggravatingFactors: "",
            relievingFactors: "",
            impactOnFunction: false,
        });
    };
    // Handle Add New Pain Assessment Puretone Record
    const handleAddNewPainAssessment = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setPainAssessmentListRequest({ ...painAssessmentListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setPainAssessmentListRequest({
            ...painAssessmentListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Pain Assessment Record
    const handleCancle = () => {
        //TODO convert key to code
        savePainAssessment({ ...painAssessment, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
            dispatch(notify({ msg: 'Pain Assessment Canceled Successfully', sev: 'success' }));
            refetch();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setPainAssessmentListRequest((prev) => ({
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
        setPainAssessmentListRequest((prev) => ({
            ...prev,
            filters: [
                ...(painAssessmentStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: painAssessmentStatus,
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
    }, [painAssessmentStatus, allData]);
    useEffect(() => {
        setPainAssessmentListRequest((prev) => {
            const filters =
                painAssessmentStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : painAssessmentStatus === '' && allData
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
    }, [allData, painAssessmentStatus]);

    // Pagination values
    const pageIndex = painAssessmentListRequest.pageNumber - 1;
    const rowsPerPage = painAssessmentListRequest.pageSize;
    const totalCount = painAssessmentResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'assessmentDateTime',
            title: 'Assessment Date Time',
            render: (row: any) =>
                row?.createdAt ? (
                    <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                ) : (
                    ' '
                ),
        },
        {
            key: 'painDegreeLkey',
            title: 'Pain Degree',
            render: (rowData: any) =>
                rowData?.painDegreeLvalue
                    ? rowData.painDegreeLvalue.lovDisplayVale
                    : rowData.painDegreeLkey,
        },
        {
            key: 'painLocationLkey',
            title: 'Pain Location',
            render: (rowData: any) =>
                rowData?.painLocationLvalue
                    ? rowData.painLocationLvalue.lovDisplayVale
                    : rowData.painLocationLkey,
        },
        {
            key: 'painPatternLkey',
            title: 'Pain Pattern',
            render: (rowData: any) =>
                rowData?.painPatternLvalue
                    ? rowData.painPatternLvalue.lovDisplayVale
                    : rowData.painPatternLkey,
        },
        {
            key: 'onsetLkey',
            title: 'Onset',
            render: (rowData: any) =>
                rowData?.onsetLvalue ? rowData.onsetLvalue.lovDisplayVale : rowData.onsetLkey,
        },
        {
            key: 'painScoreLkey',
            title: 'Pain Score',
            render: (rowData: any) =>
                rowData?.painScoreLvalue
                    ? rowData.painScoreLvalue.lovDisplayVale
                    : rowData.painScoreLkey,
        },
        {
            key: 'duration',
            title: 'Duration',
            render: (rowData: any) => (
                <>
                    {rowData?.duration}{' '}
                    {rowData?.durationUnitLvalue
                        ? rowData.durationUnitLvalue.lovDisplayVale
                        : rowData.durationUnitLkey}
                </>
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
                        setPainAssessment(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
        {
            key: 'aggravatingFactors',
            title: 'Aggravating Factors',
            dataKey: 'aggravatingFactors',
            expandable: true,
        },
        {
            key: 'relievingFactors',
            title: 'Relieving Factors',
            dataKey: 'relievingFactors',
            expandable: true,
        },
        {
            key: 'associatedSymptoms',
            title: 'Associated Symptoms',
            dataKey: 'associatedSymptoms',
            expandable: true,
        },
        {
            key: 'impactOnFunction',
            title: 'Impact on Function / Sleep',
            render: (rowData: any) => (rowData?.impactOnFunction ? 'YES' : 'NO'),
            expandable: true,
        },
        {
            key: 'painManagementGiven',
            title: 'Pain Management Given',
            dataKey: 'painManagementGiven',
            expandable: true,
        },
        {
            key: 'painReassessmentRequired',
            title: 'Pain Reassessment Required',
            render: (rowData: any) => (rowData?.painReassessmentRequired ? 'YES' : 'NO'),
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
            <AddPainAssessment
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                painAssessmentObj={painAssessment}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit ? !painAssessment?.key : true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setPainAssessmentStatus('3196709905099521');
                    }
                    else {
                        setPainAssessmentStatus('');
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
                        onClick={handleAddNewPainAssessment}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={painAssessmentResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setPainAssessment({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel Pain Assessment" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={painAssessment} setObject={setPainAssessment} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default PainAssessment;