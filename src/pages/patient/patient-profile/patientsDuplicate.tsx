import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import React from "react";
import { useGetDuplicationCandidatesQuery } from "@/services/potintialDuplicateService";

const PatientDuplicate = ({
  open,
  setOpen,
  handleSave,
  list,
  handleSelect
}) => {


  const columns = [
    {
      key: "fullName",
      title: <Translate>Patient Full Name</Translate>,
      render: (rowData: any) =>
        `${rowData?.firstName ?? ""} ${rowData?.lastName ?? ""}`
    },
    {
      key: "medicalRecordNumber",
      title: <Translate>MRN</Translate>,
      render: (rowData: any) => rowData?.medicalRecordNumber
    },
    {
      key: "dateOfBirth",
      title: <Translate>DOB</Translate>,
      render: (rowData: any) =>
        rowData?.dateOfBirth
          ? rowData.dateOfBirth.split("T")[0]
          : ""
    },
    {
      key: "sexAtBirth",
      title: <Translate>Gender</Translate>,
      render: (rowData: any) => rowData?.sexAtBirth
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={"Potential Duplicate"}
      actionButtonLabel="Ignore and Proceed"
      cancelButtonLabel="Cancel Registration"
      actionButtonFunction={handleSave}
      content={
        <MyTable
          loading={false}
          data={list ?? []}
          columns={columns}
          onRowClick={(rowData) => handleSelect(rowData)}
        />
      }
    />
  );
};


export default PatientDuplicate;
