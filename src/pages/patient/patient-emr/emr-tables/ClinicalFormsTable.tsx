import React, { useState } from "react";
import MyTable from "@/components/MyTable";
import { ColumnConfig } from "@/components/MyTable/MyTable";
import Translate from "@/components/Translate";
import { formatDateWithoutSeconds } from "@/utils";
import { MdVisibility, MdModeEdit } from "react-icons/md";

const sampleFormsData = [];

const columns: ColumnConfig[] = [
  {
    key: "formName",
    title: <Translate>FORM NAME</Translate>,
    dataKey: "formName",
  },
  {
    key: "description",
    title: <Translate>DESCRIPTION</Translate>,
    dataKey: "description",
  },
  {
    key: "title",
    title: <Translate>TITLE</Translate>,
    dataKey: "title",
  },
  {
    key: "created",
    title: <Translate>CREATED BY / AT</Translate>,
    render: (row: any) => (
      <>
        {row?.createdBy ?? ""}
        <br />
        <span className="date-table-style">
          {row?.createdDate ? formatDateWithoutSeconds(row.createdDate) : ""}
        </span>
      </>
    )
  },
  {
    key: "actions",
    title: <Translate>ACTIONS</Translate>,
    width: 120,
    render: (row: any) => (
      <div style={{ display: "flex", gap: 10 }}>
        <MdVisibility
          size={20}
          style={{ cursor: "pointer", color: "var(--primary-gray)" }}
          onClick={() => {
            console.log("VIEW FORM", row);
          }}
        />

        <MdModeEdit
          size={20}
          style={{ cursor: "pointer", color: "var(--primary-gray)" }}
          onClick={() => {
            console.log("EDIT FORM", row);
          }}
        />
      </div>
    )
  }
];

const ClinicalFormsTable = () => {

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const tableData = sampleFormsData;

  return (
    <MyTable
      data={tableData}
      columns={columns}
      loading={false}
      page={page}
      rowsPerPage={rowsPerPage}
      totalCount={tableData.length}
      onPageChange={(_, newPage) => setPage(newPage)}
      onRowsPerPageChange={(e) => {
        setRowsPerPage(parseInt(e.target.value, 10));
        setPage(0);
      }}
    />
  );
};

export default ClinicalFormsTable;