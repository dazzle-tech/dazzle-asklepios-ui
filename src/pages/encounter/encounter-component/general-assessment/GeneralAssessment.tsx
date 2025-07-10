import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { Checkbox } from 'rsuite';
import { useSaveGeneralAssessmentMutation, useGetGeneralAssessmentsQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApGeneralAssessment } from '@/types/model-types-constructor';
import { ApGeneralAssessment } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import CloseOutlineIcon from '@rsuite/icons/CloseOutline';
import CancellationModal from '@/components/CancellationModal';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import AddGeneralAssessment from './AddGeneralAssessment';
const GeneralAssessment = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [generalAssessment, setGeneralAssessment] = useState<ApGeneralAssessment>({ ...newApGeneralAssessment });
    const [saveGeneralAssessment] = useSaveGeneralAssessmentMutation();
    const [popupCancelOpen, setPopupCancelOpen] = useState(false);
    const [generalAssessmentStatus, setGeneralAssessmentStatus] = useState('');
    const [allData, setAllData] = useState(false);
    const dispatch = useAppDispatch();

    // Initialize list request with default filters
    const [generalAssessmentListRequest, setGeneralAssessmentListRequest] = useState<ListRequest>({
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

    // Fetch the list of General Assessment based on the provided request, and provide a refetch function
    const { data: generalAssessmentResponse, refetch, isLoading } = useGetGeneralAssessmentsQuery(generalAssessmentListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && generalAssessment && generalAssessment.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setGeneralAssessment({
            ...newApGeneralAssessment,
            positionStatusLkey: null,
            bodyMovementsLkey: null,
            levelOfConsciousnessLkey: null,
            facialExpressionLkey: null,
            speechLkey: null,
            moodBehaviorLkey: null,
        });
    };

    // Handle Add New General Assessment Puretone Record
    const handleAddNewGeneralAssessment = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setGeneralAssessmentListRequest({ ...generalAssessmentListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setGeneralAssessmentListRequest({
            ...generalAssessmentListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel General Assessment Record
    const handleCancle = () => {
        //TODO convert key to code
        saveGeneralAssessment({ ...generalAssessment, statusLkey: "3196709905099521", deletedAt: (new Date()).getTime() }).unwrap().then(() => {
            dispatch(notify({ msg: 'General Assessment Canceled Successfully', sev: 'success' }));
            refetch();
        });
        setPopupCancelOpen(false);
    };

    // Effects
    useEffect(() => {
        setGeneralAssessmentListRequest((prev) => ({
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
        setGeneralAssessmentListRequest((prev) => ({
            ...prev,
            filters: [
                ...(generalAssessmentStatus !== ''
                    ? [
                        {
                            fieldName: 'status_lkey',
                            operator: 'match',
                            value: generalAssessmentStatus,
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
    }, [generalAssessmentStatus, allData]);
    useEffect(() => {
        setGeneralAssessmentListRequest((prev) => {
            const filters =
                generalAssessmentStatus != '' && allData
                    ? [

                        {
                            fieldName: 'patient_key',
                            operator: 'match',
                            value: patient?.key
                        },
                    ]
                    : generalAssessmentStatus === '' && allData
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
    }, [allData, generalAssessmentStatus]);

    // Pagination values
    const pageIndex = generalAssessmentListRequest.pageNumber - 1;
    const rowsPerPage = generalAssessmentListRequest.pageSize;
    const totalCount = generalAssessmentResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'positionStatusLkey',
            title: 'Position Status',
            render: (rowData: any) =>
                rowData?.positionStatusLvalue
                    ? rowData.positionStatusLvalue.lovDisplayVale
                    : rowData.positionStatusLkey,

        },
        {
            key: 'bodyMovementsLkey',
            title: 'Body Movements',
            render: (rowData: any) =>
                rowData?.bodyMovementsLvalue
                    ? rowData.bodyMovementsLvalue.lovDisplayVale
                    : rowData.bodyMovementsLkey,
        },

        {
            key: 'levelOfConsciousnessLkey',
            title: 'Level of Consciousness',
            render: (rowData: any) =>
                rowData?.levelOfConsciousnessLvalue
                    ? rowData.levelOfConsciousnessLvalue.lovDisplayVale
                    : rowData.levelOfConsciousnessLkey,
        },
        {
            key: 'facialExpressionLkey',
            title: 'Facial Expression',
            render: (rowData: any) =>
                rowData?.facialExpressionLvalue
                    ? rowData.facialExpressionLvalue.lovDisplayVale
                    : rowData.facialExpressionLkey,
        },
        {
            key: 'speechLkey',
            title: 'Speech',
            render: (rowData: any) =>
                rowData?.speechLvalue
                    ? rowData.speechLvalue.lovDisplayVale
                    : rowData.speechLkey,
        },
        {
            key: 'moodBehaviorLkey',
            title: 'Mood/Behavior',
            render: (rowData: any) =>
                rowData?.moodBehaviorLvalue
                    ? rowData.moodBehaviorLvalue.lovDisplayVale
                    : rowData.moodBehaviorLkey,
        },
        {
            key: 'memoryRecent',
            title: 'Memory – Recent',
            render: (rowData: any) => rowData?.memoryRecent ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'memoryRemote',
            title: 'Memory – Remote',
            render: (rowData: any) => rowData?.memoryRemote ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfAgitation',
            title: 'Signs of Agitation',
            render: (rowData: any) => rowData?.signsOfAgitation ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfDepression',
            title: 'Signs of Depression',
            render: (rowData: any) => rowData?.signsOfDepression ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfSuicidalIdeation',
            title: 'Signs of Suicidal Ideation',
            render: (rowData: any) => rowData?.signsOfSuicidalIdeation ? "YES" : "NO",
            expandable: true,
        },
        {
            key: 'signsOfSubstanceUse',
            title: 'Signs of Substance Use',
            render: (rowData: any) => rowData?.signsOfSubstanceUse ? "YES" : "NO",
            expandable: true,
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
                        setGeneralAssessment(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
       {
            key: 'livingCondition',
            title: 'Living Condition',
            expandable: true,
        },
        {
            key: 'patientNeedHelp',
            title: 'Need Help',
            render: (rowData: any) => rowData?.patientNeedHelp ? "YES" : "NO",
            expandable: true,
        },
         {
            key: 'supportingMembers',
            title: 'Supporting Members',
            expandable: true,
        },
         {
            key: 'familyLocationLkey',
            title: 'Family Location',
            render: (rowData: any) =>
                rowData?.familyLocationLvalue
                    ? rowData.familyLocationLvalue.lovDisplayVale
                    : rowData.familyLocationLkey,
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
            <AddGeneralAssessment
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                generalAssessmentObj={generalAssessment}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <MyButton onClick={() => { setPopupCancelOpen(true) }} prefixIcon={() => <CloseOutlineIcon />} disabled={!edit ? !generalAssessment?.key : true}>
                    <Translate>Cancel</Translate>
                </MyButton>
                <Checkbox onChange={(value, checked) => {
                    if (checked) {
                        //TODO convert key to code
                        setGeneralAssessmentStatus('3196709905099521');
                    }
                    else {
                        setGeneralAssessmentStatus('');
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
                        onClick={handleAddNewGeneralAssessment}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={generalAssessmentResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setGeneralAssessment({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <CancellationModal title="Cancel General Assessment" fieldLabel="Cancellation Reason" open={popupCancelOpen} setOpen={setPopupCancelOpen} object={generalAssessment} setObject={setGeneralAssessment} handleCancle={handleCancle} fieldName="cancellationReason" />
        </div>
    );
};
export default GeneralAssessment;