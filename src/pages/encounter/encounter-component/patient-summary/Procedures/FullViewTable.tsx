import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds } from "@/utils";
import React from "react";
const FullViewTable = ({open,setOpen,procedures}) => {
     const columns=[
              {
      key: "procedureId",
      dataKey: "procedureId",
      title: <Translate>PROCEDURE ID</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureId;
      }
    },
    {
      key: "procedureName",
      dataKey: "procedureName",
      title: <Translate>Procedure Name</Translate>,
      flexGrow: 1,

    },
    {
      key: "scheduledDateTime",
      dataKey: "scheduledDateTime",
      title: <Translate>SCHEDULED DATE TIME</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.scheduledDateTime ? formatDateWithoutSeconds(rowData.scheduledDateTime) : ' '
      }
    },
    {
      key: "categoryKey",
      dataKey: "categoryKey",
      title: <Translate>CATEGORY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const category = CategoryLovQueryResponse?.object?.find(item => {
          return item.key === rowData.categoryKey;
        });

        return category?.lovDisplayVale || ' ';
      }
    },
    {
      key: "priorityLkey",
      dataKey: "priorityLkey",
      title: <Translate>PRIORITY</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.priorityLkey ? rowData.priorityLvalue?.lovDisplayVale : rowData.priorityLkey
      }
    },
    {
      key: "procedureLevelLkey",
      dataKey: "procedureLevelLkey",
      title: <Translate>LEVEL</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.procedureLevelLkey
          ? rowData.procedureLevelLvalue?.lovDisplayVale
          : rowData.procedureLevelLkey
      }
    },
    {
      key: "indications",
      dataKey: "indications",
      title: <Translate>INDICATIONS</Translate>,
      flexGrow: 1,

    },
     {
          key: "statusLkey",
          dataKey: "statusLkey",
          title: <Translate>STATUS</Translate>,
          flexGrow: 1,
          render: (rowData: any) => {
            return rowData.statusLvalue?.lovDisplayVale ?? null
          }
        },
        ]
    return (
        <MyModal
        open={open}
        setOpen={setOpen}
        title="Patient Procedures"
        content={<MyTable
        data={procedures||[]}
        columns={columns}
        />}
        >

        </MyModal>
    );
}
export default FullViewTable;