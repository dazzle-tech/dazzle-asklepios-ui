import React, { useState } from "react";
import { Form, Row, Col } from "rsuite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVialCircleCheck } from "@fortawesome/free-solid-svg-icons";

import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";

import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { useBulkCreateCollectedSampleSameMutation } from
  "@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService";

const BulkCollectSampleModal = ({
  open,
  setOpen,
  orderId,
  selectedTestIds,
  onSuccess
}: BulkCollectSampleModalProps) => {
  const dispatch = useAppDispatch();

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");

  const [record, setRecord] = useState({
    quantity: null,
    unitLkey: null,
    collectedAt: null
  });

  const [bulkCreate, { isLoading }] =
    useBulkCreateCollectedSampleSameMutation();

  const handleSave = async () => {
    if (!record.quantity || !record.unitLkey || !record.collectedAt) {
      dispatch(notify({ msg: "All fields are required", sev: "warning" }));
      return;
    }

    const unitText =
      valueUnitLov?.object?.find(
        u => String(u.key) === String(record.unitLkey)
      )?.lovDisplayVale;

    if (!unitText) {
      dispatch(notify({ msg: "Invalid unit", sev: "error" }));
      return;
    }

    try {
      await bulkCreate({
        orderId,
        orderTestIds: selectedTestIds,
        quantity: record.quantity,
        unit: unitText,
        collectedAt: record.collectedAt
      }).unwrap();

      dispatch(
        notify({
          msg: `Samples collected for ${selectedTestIds.length} tests`,
          sev: "success"
        })
      );

      setOpen(false);
      setRecord({ quantity: null, unitLkey: null, collectedAt: null });
      onSuccess?.();
    } catch {
      dispatch(notify({ msg: "Collect sample failed", sev: "error" }));
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Collect Sample"
      size="50vw"
      actionButtonFunction={handleSave}
      actionButtonLoading={isLoading}
      steps={[
        { title: "Sample", icon: <FontAwesomeIcon icon={faVialCircleCheck} /> }
      ]}
      content={
        <Form fluid layout="inline">
              <MyInput
                fieldLabel="Actual Sample Quantity"
                fieldName="quantity"
                fieldType="number"
                record={record}
                setRecord={setRecord}
                column
                width={"14vw"}
              />
              <MyInput
                fieldLabel="Unit"
                fieldName="unitLkey"
                fieldType="select"
                selectData={valueUnitLov?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={record}
                setRecord={setRecord}
                column
                width={"14vw"}
              />


              <MyInput
                fieldLabel="Sample Collected"
                fieldName="collectedAt"
                fieldType="datetime"
                record={record}
                setRecord={setRecord}
                column
                width={"14vw"}
              />
        </Form>
      }
    />
  );
};

export default BulkCollectSampleModal;
