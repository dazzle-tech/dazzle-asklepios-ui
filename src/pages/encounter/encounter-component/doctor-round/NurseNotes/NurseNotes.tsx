import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetNurseNotesListQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import { newApNurseNotes } from '@/types/model-types-constructor';
import { ApNurseNotes } from '@/types/model-types';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import MyButton from '@/components/MyButton/MyButton';
import PlusIcon from '@rsuite/icons/Plus';
import AddNurseNotes from './AddNurseNotes';
const NurseNotes = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [nurseNotes, setNurseNotes] = useState<ApNurseNotes>({ ...newApNurseNotes });

    // Initialize list request with default filters
    const [nurseNotestListRequest, setNurseNotesListRequest] = useState<ListRequest>({
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

    // Fetch the list of Nurse Notes based on the provided request, and provide a refetch function
    const { data: nurseNotesResponse, refetch, isLoading } = useGetNurseNotesListQuery(nurseNotestListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && newApNurseNotes && nurseNotes.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setNurseNotes({
            ...newApNurseNotes,
            shiftLkey: null,
            noteTypeLkey: null,
        });
    };
    // Handle Add New Nurse Notes Puretone Record
    const handleAddNewNurseNotes = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setNurseNotesListRequest({ ...nurseNotestListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setNurseNotesListRequest({
            ...nurseNotestListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };



    // Effects
    useEffect(() => {
        setNurseNotesListRequest((prev) => ({
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


    // Pagination values
    const pageIndex = nurseNotestListRequest.pageNumber - 1;
    const rowsPerPage = nurseNotestListRequest.pageSize;
    const totalCount = nurseNotesResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'createdAt',
            title: 'Note Date & Time',
            render: (row: any) =>
                row?.createdAt ? (
                    <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
                ) : (
                    ' '
                ),
        },
        {
            key: 'assessmentDateTime',
            title: 'Nurse Name',
            render: (row: any) => row?.apUser?.username ? row?.apUser?.username :""
                
              
        },
        {
            key: 'shiftLkey',
            title: 'Shift',
            render: (rowData: any) =>
                rowData?.shiftLvalue
                    ? rowData.shiftLvalue.lovDisplayVale
                    : rowData.shiftLkey,
        },
        {
            key: 'noteTypeLkey',
            title: 'Note Type',
            render: (rowData: any) =>
                rowData?.noteTypeLvalue
                    ? rowData.noteTypeLvalue.lovDisplayVale
                    : rowData.noteTypeLkey,
        },
        {
            key: 'nurseNote',
            title: 'Nurse Note',
            render: (rowData: any) =>
                rowData?.nurseNote ? rowData?.nurseNote : "",
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
                        setNurseNotes(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
    ];


    return (
        <div>
            <AddNurseNotes
                encounter={encounter}
                patient={patient}
                open={openAddModal}
                setOpen={setOpenAddModal}
                nurseNotesObj={nurseNotes}
                refetch={refetch}
                edit={edit} />
            <div className='bt-div'>
                <div className='bt-right'>
                    <MyButton
                        disabled={edit}
                        onClick={handleAddNewNurseNotes}
                        prefixIcon={() => <PlusIcon />} >Add </MyButton>
                </div>
            </div>
            <MyTable
                data={nurseNotesResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setNurseNotes({ ...rowData });
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
        </div>
    );
};
export default NurseNotes;