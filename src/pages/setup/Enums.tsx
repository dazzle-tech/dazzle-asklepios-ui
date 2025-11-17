import React, { useState } from "react";
import MyNestedTable from "@/components/MyNestedTable";
import MyInput from "@/components/MyInput";
import { useGetAllEnumsQuery } from "@/services/enumsApi";
import { formatEnumString } from "@/utils";
import { Form } from "rsuite";

const Enums = () => {
  const { data: enums, isLoading } = useGetAllEnumsQuery();

  const [searchText, setSearchText] = useState("");

  const enumEntries = Object.entries(enums || {}).map(([name, values]) => ({
    name,
    values,
  }));

  // ---------------------
  // 🔎 FILTER LOGIC
  // ---------------------
  const filteredEnums = enumEntries.filter((item) => {
    const lower = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(lower) ||
      item.values.some((v: string) => v.toLowerCase().includes(lower))
    );
  });

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
        {
          key: "value",
          title: "Value",
          render: (rowData) => formatEnumString(rowData.value),
        },
      ],
      data: (row.values || []).map((val: string) => ({ value: val })),
    };
  };

  return (
    <div style={{ padding: 20 }}>
      <h6>System Enums</h6>

      {/* SEARCH INPUT */}
      <Form >
      <div style={{ width: 300, marginBottom: 15 }}>
        <MyInput
          fieldName="search"
          showLabel={false}
          placeholder="Search Enums..."
          record={{ search: searchText }}
          setRecord={(r) => setSearchText(r.search)}
        />
      </div></Form>

      <MyNestedTable
        data={filteredEnums}
        columns={columns}
        getNestedTable={getNestedTable}
        loading={isLoading}
        height="70vh"
      />
    </div>
  );
};

export default Enums;
