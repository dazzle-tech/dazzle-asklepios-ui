import React, { useMemo, useState, useEffect } from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";
import { useGetEncounterVaccineQuery } from "@/services/observationService";

const VaccinationTable = ({ patient}) => {

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      { fieldName: "patient_key", operator: "match", value: patient?.key },
    ]
  });

  const {
    data: vaccineList,
    isLoading,
    refetch
  } = useGetEncounterVaccineQuery(listRequest);

  useEffect(() => {
    refetch();
  }, [patient?.key]);

  const columns = [
    {
      key: 'vaccineName',
      title: 'VACCINE NAME',
      render: (rowData: any) => rowData.vaccine?.vaccineName
    },
    {
      key: 'brandName',
      title: 'BRAND NAME',
      render: (rowData: any) => rowData.vaccineBrands?.brandName
    },
    {
      key: 'doseNumber',
      title: 'DOSE NUMBER',
      render: (rowData: any) =>
        rowData.vaccineDose?.doseNameLvalue?.lovDisplayVale || rowData.vaccineDose?.doseNameLkey
    },
    {
      key: 'dateAdministered',
      title: 'DATE OF ADMINISTRATION',
      render: (rowData: any) => {
        return !rowData.dateAdministered ? '' : formatDateWithoutSeconds(rowData.dateAdministered);
      }
    },
    {
      key: 'actualSide',
      title: 'ACTUAL SIDE',
      dataKey: 'actualSide',
      expandable: true
    },
    {
      key: 'roa',
      title: 'ROA',
      render: (rowData: any) =>
        rowData.vaccine?.roaLvalue?.lovDisplayVale || rowData.vaccine?.roaLkey,
      expandable: true
    },
    {
      key: 'externalFacilityName',
      title: 'VACCINATION LOCATION',
      dataKey: 'externalFacilityName',
      expandable: true
    },
    {
      key: 'isReviewed',
      title: 'Is Reviewed',
      render: (rowData: any) => (rowData.reviewedAt === 0 ? 'No' : 'Yes')
    },
    {
      key: 'totalDoses',
      title: 'TOTAL VACCINE DOSES',
      render: (rowData: any) =>
        rowData.vaccine?.numberOfDosesLvalue?.lovDisplayVale || rowData.vaccine?.numberOfDosesLkey
    },
    {
      key: 'status',
      title: 'STATUS',
      render: (rowData: any) => rowData.statusLvalue?.lovDisplayVale || rowData.statusLkey
    },
  ];


    useEffect(() => {
      setListRequest(prev => ({
        ...prev!,
        filters: [
          { fieldName: "patient_key", operator: "match", value: patient?.key }
        ],
        pageNumber: 1,
      }));
    }, [patient?.key]);

  return (
    <MyTable
      columns={columns}
      data={vaccineList?.object ?? []}
      loading={isLoading}
      sortColumn={listRequest.sortBy}
      sortType={listRequest.sortType}
      onSortChange={(sortBy, sortType) =>
        setListRequest((prev) => ({ ...prev, sortBy, sortType }))
      }
      page={(listRequest.pageNumber ?? 1) - 1}
      rowsPerPage={listRequest.pageSize}
      totalCount={vaccineList?.extraNumeric ?? 0}
      onPageChange={(_, newPage) =>
        setListRequest((prev) => ({ ...prev, pageNumber: newPage + 1 }))
      }
      onRowsPerPageChange={(e) =>
        setListRequest((prev) => ({
          ...prev,
          pageSize: Number(e.target.value),
          pageNumber: 1
        }))
      }
    />
  );
};

export default VaccinationTable;
