import MyModal from "@/components/MyModal/MyModal";
import React, { useEffect, useState } from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import { FaWarehouse } from "react-icons/fa6";
import "./styles.less";
import { useGetAllFacilitiesQuery } from "@/services/security/facilityService";
import { useGetDepartmentByFacilityQuery, useGetDepartmentsQuery } from "@/services/security/departmentService";
import { useAppSelector } from "@/hooks";
import { skipToken } from "@reduxjs/toolkit/query";

const AddEditWarehouse = ({ open, setOpen, warehouse, setWarehouse, handleSave }) => {

  const selectedFacility = useAppSelector(
    (state) => state.auth?.tenant?.selectedFacility
  );

  const { data: facilityResponse } = useGetAllFacilitiesQuery({});

  const facilityOptions = selectedFacility
    ? [
      {
        label: selectedFacility.facilityName ?? selectedFacility.name,
        value: selectedFacility.id,
      },
    ]
    : [];

const { data: departmentResponse } = useGetDepartmentByFacilityQuery(
  selectedFacility?.id
    ? { facilityId: selectedFacility.id, page: 0, size: 1000, sort: "id,asc" }
    : skipToken
);


const departmentOptions =
  departmentResponse?.data?.map((d) => ({
    label: d.name,
    value: d.id,
  })) ?? [];

  const formContent = () => (
    <Form fluid>

      <MyInput
        width="8vw"
        disabled
        fieldName="id"
        fieldLabel="Warehouse Id"
        record={warehouse}
        setRecord={setWarehouse}
      />
<div className="add-edit-warhouse-modal-handle-rows">
      <MyInput
        width="22vw"
        fieldName="departmentId"
        fieldLabel="Department"
        fieldType="select"
        selectData={departmentOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={warehouse}
        setRecord={setWarehouse}
      />


      <MyInput
        width="22vw"
        fieldName="facilityId"
        fieldLabel="Facility"
        fieldType="select"
        disabled
        selectData={facilityOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={warehouse}
        setRecord={setWarehouse}
      />
</div>

<div className="add-edit-warhouse-modal-handle-rows">

        <MyInput
          width="22vw"
          fieldName="name"
          fieldLabel="Warehouse Name"
          record={warehouse}
          setRecord={setWarehouse}
        />

        <MyInput
          fieldName="isDefault"
          fieldLabel="Default"
          fieldType="checkbox"
          record={warehouse}
          setRecord={setWarehouse}
        />

        <MyInput
          fieldName="closeWarehouse"
          fieldLabel="Close"
          fieldType="checkbox"
          record={warehouse}
          setRecord={setWarehouse}
        />

      </div>

      <MyInput
        width="100%"
        fieldName="capacity"
        fieldLabel="Capacity"
        record={warehouse}
        setRecord={setWarehouse}
      />

    </Form>
  );

  useEffect(() => {
    if (selectedFacility?.id && open) {
      setWarehouse((prev) => ({
        ...prev,
        facilityId: selectedFacility.id,
      }));
    }
  }, [selectedFacility, open]);


  console.log("DEPARTMENTS BY FACILITY RESPONSE:", departmentResponse);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={warehouse?.id ? "Edit Warehouse" : "New Warehouse"}
      position="right"
      content={formContent}
      steps={[{ title: "Warehouse Info", icon: <FaWarehouse /> }]}
      actionButtonLabel={warehouse?.id ? "Save" : "Create"}
      actionButtonFunction={handleSave}
    />
  );
};

export default AddEditWarehouse;
