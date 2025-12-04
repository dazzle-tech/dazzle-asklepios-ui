import React, { useMemo, useState, useEffect } from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetConsultationOrdersQuery } from "@/services/encounterService";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";


const ConsultationsTable = ({ patient }) => {
 

  
  const [listRequest, setListRequest] = useState<ListRequest | null>({
        ...initialListRequest,
        filters: [
          { fieldName: 'patient_key', operator: 'match', value: patient?.key },
        ]
});
  

  const { data: consultationOrderListResponse, isLoading ,refetch:refConsult } =
    useGetConsultationOrdersQuery(listRequest!, {
      skip: !listRequest,
    });
    useEffect(()=>{
      refConsult()
    },[patient])

  const tableColumns = useMemo(
    () => [
      {
        key: "createdAt",
        title: <Translate>CONSULTATION DATE</Translate>,
        flexGrow: 1,
        render: (row) =>
          row.createdAt ? formatDateWithoutSeconds(row.createdAt) : "",
      },
      {
        key: "consultantSpecialtyLkey",
        title: <Translate>CONSULTANT SPECIALTY</Translate>,
        flexGrow: 1,
        render: (row) => row.consultantSpecialtyLvalue?.lovDisplayVale,
      },
      {
        key: "statusLkey",
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (row) => row.statusLvalue?.lovDisplayVale,
      },
      {
        key: "resposeStatusLkey",
        title: <Translate>RESPONSE STATUS</Translate>,
        flexGrow: 1,
        render: (row) => row.resposeStatusLvalue?.lovDisplayVale,
      },
    ],
    []
  );

  return (
    <MyTable
      columns={tableColumns}
      data={consultationOrderListResponse?.object ?? []}
      loading={isLoading}
      sortColumn={listRequest?.sortBy}
      sortType={listRequest?.sortType}
      onSortChange={(sortBy, sortType) =>
        setListRequest({ ...listRequest, sortBy, sortType })
      }
      page={(listRequest?.pageNumber ?? 1) - 1}
      rowsPerPage={listRequest?.pageSize}
      totalCount={consultationOrderListResponse?.extraNumeric ?? 0}
      onPageChange={(_, newPage) =>
        setListRequest({ ...listRequest, pageNumber: newPage + 1 })
      }
    />
  );
};

export default ConsultationsTable;
