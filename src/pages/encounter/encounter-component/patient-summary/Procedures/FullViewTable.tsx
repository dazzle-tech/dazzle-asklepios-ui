import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import React, { useMemo } from "react";
const FullViewTable = ({open,setOpen,procedures, proceduresByIds, procedureIds, proceduresMap, icdMap, icdDiagnoses, indicationIds, TableLoader}) => {
   const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
    const tableColumns =  [
          
          {
            key: 'procedureName',
            title: <Translate>Procedure Name</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
              if (!proceduresByIds && procedureIds.length > 0) {
                return <TableLoader />;
              }
    
              const proc = proceduresMap.get(Number(rowData.procedureId));
              return proc?.name ?? '';
            }
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
            key: 'categoryType',
            dataKey: 'categoryType',
            title: <Translate>CATEGORY</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
              if (!proceduresByIds && procedureIds.length > 0) {
                return <TableLoader />;
              }
    
              const proc = proceduresMap.get(Number(rowData.procedureId));
    
              const category = CategoryLovQueryResponse?.object?.find(
                (item: any) => item.key === proc?.categoryType
              );
    
              return category?.lovDisplayVale || '';
            }
          },
          {
            key: 'priority',
            dataKey: 'priority',
            title: <Translate>PRIORITY</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
              return formatEnumString(rowData?.priority);
            }
          },
          {
            key: 'procedureLevel',
            dataKey: 'procedureLevel',
            title: <Translate>LEVEL</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
              return formatEnumString(rowData?.procedureLevel);
            }
          },
          {
            key: 'indicationId',
            title: <Translate>INDICATIONS</Translate>,
            flexGrow: 1,
            render: (rowData: any) => {
              if (!rowData?.indicationId) return '';
    
              if (!icdDiagnoses && indicationIds.length > 0) {
                return <TableLoader />;
              }
    
              const ids = Array.isArray(rowData.indicationId)
                ? rowData.indicationId
                : [rowData.indicationId];
    
              const names = ids
                .map((id: any) => {
                  const diag = icdMap.get(Number(id));
                  return diag?.icdShortDescription || diag?.icdCode;
                })
                .filter(Boolean);
    
              return names.join(', ');
            }
          },
        ]
    return (
        <MyModal
        open={open}
        hideActionBtn
        setOpen={setOpen}
        title="Patient Procedures"
        content={<MyTable
        data={procedures||[]}
        columns={tableColumns}
        />}
        >

        </MyModal>
    );
}
export default FullViewTable;