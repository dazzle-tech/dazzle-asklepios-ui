import React, { useEffect, useMemo, useState } from "react";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds } from "@/utils";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import { useLocation } from "react-router-dom";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useGetProceduresQuery } from "@/services/procedureService";

const ProceduresTable = ({ patient }) => {



  const [listRequest, setListRequest] = useState<ListRequest | null>({
    ...initialListRequest,
    filters: [
      { fieldName: 'patient_key', operator: 'match', value: patient?.key },
    ]
  });

  const {
    data: procedures,
    refetch: proRefetch,
    isLoading: procedureLoding
  } = useGetProceduresQuery(listRequest);



  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');


  const tableColumns = useMemo(
    () => [
      {
        key: 'procedureId',
        dataKey: 'procedureId',
        title: <Translate>PROCEDURE ID</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData?.procedureId ?? ''
      },
      {
        key: 'procedureName',
        dataKey: 'procedureName',
        title: <Translate>Procedure Name</Translate>,
        flexGrow: 1
      },
      {
        key: 'scheduledDateTime',
        dataKey: 'scheduledDateTime',
        title: <Translate>SCHEDULED DATE TIME</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      },
      {
        key: 'categoryKey',
        dataKey: 'categoryKey',
        title: <Translate>CATEGORY</Translate>,
        flexGrow: 1,
        render: (rowData: any) => {
          const category = CategoryLovQueryResponse?.object?.find(
            (item: any) => item.key === rowData?.categoryKey
          );
          return category?.lovDisplayVale || ' ';
        }
      },
      {
        key: 'priorityLkey',
        dataKey: 'priorityLkey',
        title: <Translate>PRIORITY</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.priorityLvalue?.lovDisplayVale ?? rowData?.priorityLkey ?? ''
      },
      {
        key: 'procedureLevelLkey',
        dataKey: 'procedureLevelLkey',
        title: <Translate>LEVEL</Translate>,
        flexGrow: 1,
        render: (rowData: any) =>
          rowData?.procedureLevelLvalue?.lovDisplayVale ?? rowData?.procedureLevelLkey ?? ''
      },
      {
        key: 'indications',
        dataKey: 'indications',
        title: <Translate>INDICATIONS</Translate>,
        flexGrow: 1
      },
      {
        key: 'statusLkey',
        dataKey: 'statusLkey',
        title: <Translate>STATUS</Translate>,
        flexGrow: 1,
        render: (rowData: any) => rowData?.statusLvalue?.lovDisplayVale ?? rowData?.statusLkey ?? ''
      },
    ],
    [CategoryLovQueryResponse]
  );

  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest((prev) => ({ ...prev!, pageNumber: newPage + 1 }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest((prev) => ({
      ...prev!,
      pageSize: Number(e.target.value),
      pageNumber: 1,
    }));
  };

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
      columns={tableColumns}
      data={procedures?.object ?? []}
      loading={procedureLoding}
      sortColumn={listRequest.sortBy}
      sortType={listRequest.sortType}
      onSortChange={(sortBy, sortType) =>
        setListRequest((prev) => ({ ...prev!, sortBy, sortType }))
      }
      page={(listRequest.pageNumber ?? 1) - 1}
      rowsPerPage={listRequest.pageSize}
      totalCount={procedures?.extraNumeric ?? 0}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
    />
  );
};

export default ProceduresTable;
