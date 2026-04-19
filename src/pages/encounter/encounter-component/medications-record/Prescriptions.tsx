import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetPatientPrescriptionQuery } from "@/services/patients/Prescription/patientPrescriptionService";
import type { PatientPrescription } from "@/types/model-types-new";
import React, { useState } from "react";
import { formatDateWithoutSeconds } from "@/utils";
import PrescriptionDetails from "./PrescriptionDetails";

const Prescriptions = ({ patient }) => {
    const [prescription, setPrescription] = useState<PatientPrescription | null>(null);

    const patientId = patient?.id ;

    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const {
        data: prescriptionsResponse ,
        isLoading: isLoadingPrescriptions,
    } = useGetPatientPrescriptionQuery(
        {
            patientId,
            page: pageIndex,
            size: rowsPerPage,
            sort: "prescriptionNum,desc",
        },
        { skip: !patientId }
    );
  
    const isSelected = (rowData: PatientPrescription) => {
        if (rowData && prescription && rowData.id === prescription.id) {
            return "selected-row";
        }
        return "";
    };

    const tableColumns = [
        {
            key: "prescriptionId",
            title: <Translate>Prescription ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => rowData?.prescriptionNum ?? rowData?.id ?? "",
        },
        {
            key: "visitId",
            title: <Translate>Visit ID</Translate>,
            flexGrow: 1,
            render: (rowData: any) => rowData?.encounter?.visitId ?? rowData?.encounterId ?? "",
        },
        {
            key: "prescriptionDate",
            title: <Translate>Visit Date</Translate>,
            flexGrow: 1,
            render: (rowData: any) => formatDateWithoutSeconds(rowData?.prescriptionDate ?? rowData?.createdDate),
        },
        {
            key: "createdDate",
            title: <Translate>Created At</Translate>,
            flexGrow: 1,
            render: (rowData: any) => formatDateWithoutSeconds(rowData?.createdDate),
        },
        {
            key: "createdBy",
            title: <Translate>Created By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => rowData?.createdBy ?? "",
        },
        {
            key: "submittedBy",
            title: <Translate>Submitted By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => rowData?.submittedBy ?? rowData?.lastModifiedBy ?? "",
        },
        {
            key: "submittedAt",
            title: <Translate>Submitted at</Translate>,
            flexGrow: 1,
            render: (rowData: any) => formatDateWithoutSeconds(rowData?.submittedAt ?? rowData?.lastModifiedDate),
        },
    ];

       const totalCount = prescriptionsResponse?.totalCount ?? 0;

    const handlePageChange = (_: unknown, newPage: number) => {
        setPageIndex(newPage);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPageIndex(0);
    };

    return (
        <>
            <MyTable
                columns={tableColumns}
                data={prescriptionsResponse?.data ?? []}
                loading={isLoadingPrescriptions}
                onRowClick={(rowData) => {
                    setPrescription(rowData);
                }}
                rowClassName={isSelected}
                page={pageIndex}
                rowsPerPage={rowsPerPage}
                totalCount={totalCount}
                onPageChange={handlePageChange}
                onRowsPerPageChange={handleRowsPerPageChange}
            />
            <br />
            {prescription?.id && (
                <PrescriptionDetails prescription={prescription} />
            )}
        </>
    );
};

export default Prescriptions;
