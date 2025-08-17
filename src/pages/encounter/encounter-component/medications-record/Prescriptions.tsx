import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetPrescriptionsQuery } from "@/services/encounterService";
import { ApPrescription } from "@/types/model-types";
import { newApPrescription } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import React, { useState } from "react";
import { formatDateWithoutSeconds } from "@/utils";
import PrescriptionDetails from "./PrescriptionDetails";
const Prescriptions = ({ patient, genericMedicationListResponse, customeInstructions }) => {
    const [prescription, setPrescription] = useState<ApPrescription>({ ...newApPrescription });
    //List of current patient prescriptions that have been submitted
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: "patient_key",
                operator: "match",
                value: patient?.key,
            },

            {
                fieldName: "status_lkey",
                operator: "match",
                value: "1804482322306061"
            }

        ],
    });
    const { data: prescriptions, isLoading: isLoadingPrescriptions, refetch: preRefetch } = useGetPrescriptionsQuery(listRequest);



    const isSelected = rowData => {
        if (rowData && prescription && rowData.key === prescription.key) {
            return 'selected-row';
        } else return '';
    };
    const tableColumns = [
        {
            key: "prescriptionId",
            title: <Translate>Prescription ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.prescriptionId ?? "";
            }
        },
        {
            key: "visitId",
            title: <Translate>Visit ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.encounter?.visitId ?? "";
            }
        },
        {
            key: "",
            title: <Translate>Visit Date</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.encounter?.createdAt);
            }
        },
        {
            key: "createdAt",
            title: <Translate>Created At</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.createdAt);
            }
        },
        {
            key: "createdBy",
            title: <Translate>Created By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.createdBy ?? "";
            }
        },
        {
            key: "submittedBy",
            title: <Translate>Submitted By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return rowData?.submittedBy ?? "";
            }
        },
        {
            key: "submittedAt ",
            title: <Translate>Submitted at</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                return formatDateWithoutSeconds(rowData.submittedAt);
            }
        },

    ];
    const pageIndex = listRequest.pageNumber - 1;

    // how many rows per page:
    const rowsPerPage = listRequest.pageSize;

    // total number of items in the backend:
    const totalCount = prescriptions?.extraNumeric ?? 0;

    // handler when the user clicks a new page number:
    const handlePageChange = (_: unknown, newPage: number) => {
        // MUI gives you a zero-based page, so add 1 for your API

        setListRequest({ ...listRequest, pageNumber: newPage + 1 });
    };

    // handler when the user chooses a different rows-per-page:
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {

        setListRequest({
            ...listRequest,
            pageSize: parseInt(event.target.value, 10),
            pageNumber: 1 // reset to first page
        });
    };


    return (<>
        <MyTable
            columns={tableColumns}
            data={prescriptions?.object ?? []}
            onRowClick={rowData => {
                setPrescription(rowData);
            }}
            rowClassName={isSelected}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
        ></MyTable>
        <br />
        {/* when click row show table for medication details */}
        {prescription.key &&
            <PrescriptionDetails customeInstructions={customeInstructions} genericMedicationListResponse={genericMedicationListResponse} prescription={prescription} />}
    </>)
}
export default Prescriptions;