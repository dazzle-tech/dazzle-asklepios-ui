import React from "react";
import MyInput from "@/components/MyInput";
import { Form } from "rsuite";
import MyModal from "@/components/MyModal/MyModal";
import { FaClock } from "react-icons/fa6";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { useUpdateWarehouseMutation } from "@/services/inventory/inventory-warehouse/warehouseService";

const WorkingHours = ({ open, setOpen, warehouse, setWarehouse, refetch }) => {
  const dispatch = useAppDispatch();
  const [updateWarehouse] = useUpdateWarehouseMutation();

  const safeSetWarehouse = (updated) => {
    setWarehouse((prev) => ({
      ...prev,
      ...updated,
    }));
  };

const toTimeString = (value) => {
  if (!value) return "";

  if (typeof value === "string") return value;

  const date = new Date(value);

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${hours}:${minutes}`;
};



  const mergeTimeToMillis = (timeStr) => {
    if (!timeStr) return null;
    return new Date(`1970-01-01T${timeStr}:00`).getTime();
  };

  const handleSave = async () => {
    try {
      const payload = {
        ...warehouse,
        workingHoursFromTime: mergeTimeToMillis(toTimeString(warehouse.workingHoursFromTime)),
        workingHoursToTime: mergeTimeToMillis(toTimeString(warehouse.workingHoursToTime)),
      };

      const response = await updateWarehouse(payload).unwrap();
      setWarehouse(response);
      refetch();

      dispatch(notify({ msg: "Working hours updated successfully", sev: "success" }));
      setOpen(false);
    } catch (e) {
      console.error(e);
      dispatch(notify({ msg: "Failed to update working hours", sev: "error" }));
    }
  };

  const formContent = (
    <Form fluid>
      <MyInput
        fieldLabel="From Time"
        fieldName="workingHoursFromTime"
        fieldType="time"
        record={{
          ...warehouse,
          workingHoursFromTime: toTimeString(warehouse.workingHoursFromTime),
        }}
        setRecord={safeSetWarehouse}
        width={300}
      />

      <MyInput
        fieldLabel="To Time"
        fieldName="workingHoursToTime"
        fieldType="time"
        record={{
          ...warehouse,
          workingHoursToTime: toTimeString(warehouse.workingHoursToTime),
        }}
        setRecord={safeSetWarehouse}
        width={300}
      />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Warehouse Working Hours"
      position="right"
      content={formContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      steps={[{ title: "Working Hours", icon: <FaClock /> }]}
      size="36vw"
    />
  );
};

export default WorkingHours;

