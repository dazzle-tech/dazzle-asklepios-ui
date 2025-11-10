import React from "react";
import MyNestedTable from "@/components/MyNestedTable";
import { useGetAllEnumsQuery } from "@/services/enumsApi";
import { time } from "console";
import { formatEnumString } from "@/utils";

const Enums = () => {
  const { data: enums, isLoading } = useGetAllEnumsQuery();


  const enumEntries = Object.entries(enums || {}).map(([name, values]) => ({
    name,
    values,
  }));

  
  const columns = [
    {
      key: "name",
      title: "Enum Name",
      render: (row: any) => <strong>{row.name}</strong>,
    },
  ];


  const getNestedTable = (row: any) => {
    return {
      columns: [
        { key: "index", title: "#", render: (_: any, index: number) => index + 1 },
        { key: "value", title: "Code" },
        {key:"value",title:"Value",
            render:(rowData)=>formatEnumString(rowData.value)
        }

        
      ],
      data: (row.values || []).map((val: string) => ({ value: val })),
    };
  };

  return (
    <div style={{ padding: 20 }}>
      <h6>System Enums</h6>
      <MyNestedTable
        data={enumEntries}
        columns={columns}
        getNestedTable={getNestedTable}
        loading={isLoading}
        height="70vh"
      />
    </div>
  );
};

export default Enums;
