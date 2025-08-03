import MyButton from "@/components/MyButton/MyButton";
import MyInput from "@/components/MyInput";
import { useAppDispatch } from "@/hooks";
import { useGetDischargeToWardByOperationQuery, useSaveDischargeToWardMutation } from "@/services/RecoveryService";
import { useGetDepartmentsQuery, useGetUsersQuery } from "@/services/setupService";
import { newApOperationDischargeToWard } from "@/types/model-types-constructor";
import { initialListRequest, ListRequest } from "@/types/types";
import { notify } from "@/utils/uiReducerActions";
import { tr } from "date-fns/locale";
import React, { useState, useEffect } from "react";
import { Col, Divider, Radio, RadioGroup, Row, Text } from "rsuite";
const DischargeToWard = ({ operation }) => {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<string>("");
  const [ward, setWard] = useState({ ...newApOperationDischargeToWard })
  const [save] = useSaveDischargeToWardMutation();
  const { data: wardData } = useGetDischargeToWardByOperationQuery(operation?.key, {
    skip: !operation?.key,
    refetchOnMountOrArgChange: true,
  });

  const [departmentListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  // Fetch  department List response
  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);
  const { data: userList } = useGetUsersQuery({
    ...initialListRequest,
    //to do Nurse code
    filters: [
      {
        fieldName: 'job_role_lkey',
        operator: 'match',
        value: '157153858530600'
      }
    ]
  });
  //Effect to set ward data if available
  useEffect(() => {
    if (wardData?.object) {
      setWard({...wardData.object, transferTime: wardData.object.transferTime ? new Date(wardData.object.transferTime) : null });
    }
  }, [wardData]);
  const handleSave = async () => {
    try {
      const response = await save({
        ...ward,
        operationRequestKey: operation?.key,
        transportMode: status,
        transferTime: ward.transferTime ? new Date(ward.transferTime).getTime() : null
      });
      dispatch(notify({ sev: 'success', msg: 'Discharge to ward saved successfully!' }));
    } catch (error) {
      dispatch(notify({ sev: 'error', msg: 'Error saving discharge to ward.' }));
      console.error("Error saving discharge to ward:", error);
    }
  };
  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Discharge to Ward</Text>
      </div>
      <Divider />
      <Row>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldType="checkbox"
            fieldName="returnToDifferentWard"
            record={ward}
            setRecord={setWard}
          />
        </Col>
        {ward.returnToDifferentWard && (
          <Col md={8}>
            <MyInput
              fieldName="designationLkey"
              fieldType="select"
              fieldLabel="Select Designation"
              selectData={departmentListResponse?.object ?? []}
              selectDataLabel="name"
              selectDataValue="key"
              record={ward}
              setRecord={setWard}
              width="100%"
              menuMaxHeight={150}
            />
          </Col>
        )}
        {ward.returnToDifferentWard && (
          <Col md={8}>
            <MyInput
              width="100%"
              fieldType="time"
              fieldName="transferTime"
              record={ward}
              setRecord={setWard}
            />
          </Col>
        )}
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldType="select"
            fieldLabel="Receiving Nurse"
            selectData={userList?.object ?? []}
            selectDataLabel="username"
            selectDataValue="key"
            fieldName="receivingNurseKey"
            record={ward}
            setRecord={setWard}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="finalNotes"
            record={ward}
            setRecord={setWard}
          />
        </Col>
      </Row>
      <MyInput
        width="100%"
        fieldType="checkbox"
        fieldLabel="Patient ID Band Rechecked"
        fieldName="patientIdBandRechecked"
        record={ward}
        setRecord={setWard}
      />
      <Row className="container-of-radio-recovery">
        <Col md={6}>
          <label>Transport Mode</label>
        </Col>
        <Col md={18}>
          <RadioGroup name="transportMode" inline value={status}  onChange={(value, _event) => setStatus(value as string)}>
            <Radio value="bed">Bed</Radio>
            <Radio value="stretcher">Stretcher</Radio>
            <Radio value="wheelchair">Wheelchair</Radio>
          </RadioGroup>
        </Col>
      </Row>
      <br />
      <Row>
        <div className="container-of-add-new-button">
          <MyButton color="var(--deep-blue)" width="90px" onClick={handleSave}>
            Save
          </MyButton>
        </div>
      </Row>
    </div>
  );
}
export default DischargeToWard;