import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetPatientPrescriptionQuery } from "@/services/patients/Prescription/patientPrescriptionService";
import { useLazyGetEncountersByIdsQuery } from "@/services/encounters/patientEncounterService";
import type { PatientPrescription } from "@/types/model-types-new";
import React, { useEffect, useMemo, useState } from "react";
import { formatDateWithoutSeconds } from "@/utils";
import PrescriptionDetails from "./PrescriptionDetails";
import UserDateCell from "@/components/UserDateCell";

const Prescriptions = ({ patient }) => {
    const [prescription, setPrescription] = useState<PatientPrescription | null>(null);

    const patientId = patient?.id;

    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const {
        data: prescriptionsResponse,
        isLoading: isLoadingPrescriptions,
    } = useGetPatientPrescriptionQuery(
        {
            patientId,
            status: "SUBMITTED",
            page: pageIndex,
            size: rowsPerPage,
            sort: "prescriptionNum,desc",
        },
        { skip: !patientId }
    );

    // ✅ lazy query
    const [getEncountersByIds, { data: encountersData }] =
        useLazyGetEncountersByIdsQuery();
    const encounterIds = useMemo(() => {
        const encounters = prescriptionsResponse?.data ?? [];

        const ids = encounters.map((item) => {

            return item.encounterId;
        });
        const filtered = ids.filter((id): id is number => id != null);


        return filtered;
    }, [prescriptionsResponse]);




    useEffect(() => {
        if (!encounterIds.length) return;
        getEncountersByIds({ ids: encounterIds });
    }, [encounterIds, getEncountersByIds]);

    const encounterMap = useMemo(() => {
        if (!encountersData) return new Map();

        return new Map(
            encountersData.map((item) => [item.id, item])
        );
    }, [encountersData]);


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
            title: <Translate>Visit Number</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                const encounter = encounterMap.get(rowData.encounterId);
                return encounter?.encounterNumber;
            },
        },
        {
            key: "visitDate",
            title: <Translate>Visit Date</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
                const encounter = encounterMap.get(rowData.encounterId);
                return formatDateWithoutSeconds(encounter?.createdDate);
            },
        },
        {
            key: "createdDate",
            title: <Translate>Created At</Translate>,
            flexGrow: 1,
            render: (rowData: any) =>
                formatDateWithoutSeconds(rowData?.createdDate),
        },
        {
        key: "createdBy",
        title: <Translate>Created By</Translate>,
        flexGrow: 1,
            render: (rowData: any) => (
                <UserDateCell
                login={rowData?.createdBy}
                />
            ),
        },
        {
            key: "submittedBy",
            title: <Translate>Submitted By</Translate>,
            flexGrow: 1,
            render: (rowData: any) => (
                <UserDateCell
                login={rowData?.submitedBy}
                />
            ),        },
        {
            key: "submittedAt",
            title: <Translate>Submitted at</Translate>,
            flexGrow: 1,
            render: (rowData: any) =>
                formatDateWithoutSeconds(rowData?.submitedDate) ?? "",
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