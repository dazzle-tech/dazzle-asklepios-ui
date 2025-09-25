import React from "react";
import { Form } from "rsuite";
import MyInput from "@/components/MyInput";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import "./style.less";

interface InvasiveDeviceICUModalProps {
  record: any;
  setRecord: (val: any) => void;
}

const InvasiveDeviceICUModal: React.FC<InvasiveDeviceICUModalProps> = ({ record, setRecord }) => {
  const { data: deviceTypeLov } = useGetLovValuesByCodeQuery('INV_DEVICE_TYPE');
  const { data: deviceSiteLov } = useGetLovValuesByCodeQuery('INV_DEV_SITE');

  return (
    <Form fluid>
      <div className="grid-input-container-invasive-device-icu">
        <MyInput
          width="100%"
          fieldName="deviceType"
          fieldLabel="Device Type"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={deviceTypeLov?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          searchable={false}
        />
        <MyInput
          width="100%"
          fieldName="deviceSite"
          fieldLabel="Device Site"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={deviceSiteLov?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          searchable={false}
        />
        <MyInput
          width="100%"
          fieldLabel="Device Size"
          fieldName="deviceSize"
          fieldType="numeric"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="100%"
          fieldLabel="Insertion Date/Time"
          fieldName="insertionDateTime"
          fieldType="date"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="100%"
          fieldLabel="Indication"
          fieldName="indication"
          fieldType="text"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="100%"
          fieldLabel="Last Dressing Change"
          fieldName="lastDressingChange"
          fieldType="date"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="100%"
          fieldLabel="Next Check Due"
          fieldName="nextCheckDue"
          fieldType="date"
          record={record}
          setRecord={setRecord}
        />
        <MyInput
          width="100%"
          fieldLabel="Daily Necessity Review"
          fieldName="dailyNecessityReview"
          fieldType="toggle"
          record={record}
          setRecord={setRecord}
        />
      </div>
    </Form>
  );
};

export default InvasiveDeviceICUModal;
