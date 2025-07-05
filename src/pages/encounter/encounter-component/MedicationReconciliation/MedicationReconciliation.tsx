import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useAppDispatch } from '@/hooks';
import { FaPaperPlane } from 'react-icons/fa';
import { useSaveMedicationReconciliationMutation, useGetMedicationReconciliationQuery } from '@/services/encounterService';
import PlusIcon from '@rsuite/icons/Plus';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { newApMedicationReconciliation } from '@/types/model-types-constructor';
import { ApMedicationReconciliation } from '@/types/model-types';
import { notify } from '@/utils/uiReducerActions';
import { MdModeEdit } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import PatientChronic from '../medications-record/PatientChronic';
import { useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import AddMedicationReconciliation from './AddMedicationReconciliation';
const MedicationReconciliation = ({ patient, encounter, edit }) => {
    const [openAddModal, setOpenAddModal] = useState(false);
    const [medicationReconciliation, setMedicationReconciliation] = useState<ApMedicationReconciliation>({ ...newApMedicationReconciliation });
    const [saveMedicationReconciliation] = useSaveMedicationReconciliationMutation();

    const dispatch = useAppDispatch();

    // Initialize medication reconciliation list request with default filters
    const [medicationReconciliationListRequest, setMedicationReconciliationListRequest] = useState<ListRequest>({
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


    const { data: genericMedicationListResponse } = useGetGenericMedicationQuery({ ...initialListRequest });
    const { data: customeInstructions } = useGetCustomeInstructionsQuery({
        ...initialListRequest,

    });
    // Fetch the list of Medication Reconciliation based on the provided request, and provide a refetch function
    const { data: medicationReconciliationResponse, refetch, isLoading } = useGetMedicationReconciliationQuery(medicationReconciliationListRequest);

    // Check if the current row is selected by comparing keys, and return the 'selected-row' class if matched
    const isSelected = rowData => {
        if (rowData && medicationReconciliation && medicationReconciliation.key === rowData.key) {
            return 'selected-row';
        } else return '';
    };
    // Handle Clear Fields
    const handleClearField = () => {
        setMedicationReconciliation({
            ...newApMedicationReconciliation,
            dosageLkey: null,
            routeLkey: null,
            frequencyLkey: null,
        });
    };

    // Handle Add New Medication Reconciliation  Record
    const handleAddNewMedicationReconciliation = () => {
        handleClearField();
        setOpenAddModal(true);
    }
    // Change page event handler
    const handlePageChange = (_: unknown, newPage: number) => {
        setMedicationReconciliationListRequest({ ...medicationReconciliationListRequest, pageNumber: newPage + 1 });
    };
    // Change number of rows per page
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setMedicationReconciliationListRequest({
            ...medicationReconciliationListRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // Reset to first page
        });
    };
    // Handle Cancel Medication Reconciliationt Record
    const handleSubmit = () => {
        //TODO convert key to code
        saveMedicationReconciliation({ ...medicationReconciliation, statusLkey: "1804482322306061" }).unwrap().then(() => {
            dispatch(notify({ msg: 'Medication Reconciliation Submitted Successfully', sev: 'success' }));
            refetch();
        });
    };

    // Effects
    useEffect(() => {
        setMedicationReconciliationListRequest((prev) => ({
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
    const pageIndex = medicationReconciliationListRequest.pageNumber - 1;
    const rowsPerPage = medicationReconciliationListRequest.pageSize;
    const totalCount = medicationReconciliationResponse?.extraNumeric ?? 0;

    // Table Column 
    const columns = [
        {
            key: 'activeIngredientKey',
            title: 'Medication Name',
            render: (rowData: any) =>
                rowData?.apActiveIngredient
                    ? rowData?.apActiveIngredient?.name
                    : ""

        },
        {
            key: 'dosage',
            title: 'Dose ',
            render: (rowData: any) =>
                <>
                    {rowData?.dosage}
                    {" "}
                    {rowData?.dosageLvalue
                        ? rowData.dosageLvalue.lovDisplayVale
                        : rowData.dosageLkey}
                </>
        },

        {
            key: 'routeLkey',
            title: 'Rout',
            render: (rowData: any) =>
                rowData?.routeLvalue
                    ? rowData.routeLvalue.lovDisplayVale
                    : rowData.routeLkey,
        },
        {
            key: 'startDate',
            title: 'Start Date ',
            render: (rowData: any) =>
                <span className="date-table-style">{new Date(rowData.startDate).toLocaleDateString('en-US')}</span>
        },
        {
            key: 'lastDoseTaken',
            title: 'Last Dose Taken ',
            render: (rowData: any) =>
                <span className="date-table-style">{formatDateWithoutSeconds(rowData.lastDoseTaken)}</span>
        },
        {
            key: 'indication',
            title: 'Indication',
            render: (rowData: any) =>
                rowData?.indication,
        },
        {
            key: 'continueInHospital',
            title: 'Continue in Hospital?',
            render: (rowData: any) => rowData?.continueInHospital ? "YES" : "NO",
        },
        {
            key: 'statusLkey',
            title: 'Status',
            render: (rowData: any) =>
                rowData?.statusLvalue
                    ? rowData.statusLvalue.lovDisplayVale
                    : rowData.statusLkey,
        },
          {
            key: 'createdAt',
            title: 'Reconcile By\At',
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
            key: 'details',
            title: <Translate>EDIT</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (
                <MdModeEdit
                    title="Edit"
                    size={24}
                    fill="var(--primary-gray)"
                    onClick={() => {
                        setMedicationReconciliation(rowData);
                        setOpenAddModal(true);
                    }}
                />
            ),
        },
        {
            key: 'Actions',
            title: <Translate>Submit</Translate>,
            flexGrow: 2,
            render: (rowData: any) => (

                <FaPaperPlane
                    title="Submit"
                    size={24}
                    fill={rowData.statusLkey === "1804482322306061" ? "#ccc" : "var(--primary-blue)"}
                    onClick={rowData.statusLkey === "1804482322306061" ? null : handleSubmit}
                    style={{ cursor: rowData.statusLkey === "1804482322306061" ? "not-allowed" : "pointer" }}
                />

            ),
        },
    ];


    return (
        <div>
            <PatientChronic genericMedicationListResponse={genericMedicationListResponse?.object} patient={patient} customeInstructions={customeInstructions?.object} />
            <AddMedicationReconciliation
                open={openAddModal}
                setOpen={setOpenAddModal}
                patient={patient}
                encounter={encounter}
                medicationReconciliationObj={medicationReconciliation}
                refetch={refetch}
                edit={edit} />
            <br />
            <div className='bt-div'>
                <div className='bt-right'>
                    <MyButton
                        disabled={edit}
                        onClick={handleAddNewMedicationReconciliation}
                        prefixIcon={() => <PlusIcon />} > Add </MyButton>
                </div>
            </div>
            <MyTable
                data={medicationReconciliationResponse?.object ?? []}
                columns={columns}
                height={600}
                loading={isLoading}
                onRowClick={rowData => {
                    setMedicationReconciliation({ ...rowData });
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
export default MedicationReconciliation;


