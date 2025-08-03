import React, { useState, useEffect } from "react";

import {
  useGetAnesthesiaRecoveryByOperationQuery,
  useGetRecoveryAntiemeticGivenListQuery,
  useSaveAnesthesiaRecoveryMutation,
  useSaveRecoveryAntiemeticGivenMutation
} from "@/services/RecoveryService";
import { initialListRequest } from "@/types/types";

import { notify } from "@/utils/uiReducerActions";
import { Col, Divider, Radio, RadioGroup, Row, Text } from "rsuite";
import MyInput from "@/components/MyInput";
import { newApOperationAnesthesiaRecovery } from "@/types/model-types-constructor";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import GenericAdministeredMedications from "../encounter/encounter-component/procedure/Post-ProcedureCare/AdministeredMedications ";
import MyButton from "@/components/MyButton/MyButton";

import { useAppDispatch } from "@/hooks";



const AnesthesiaRecovery = ({ operation }) => {
  const dispatch = useAppDispatch();
  const [anesthesia, setAnethesia] = useState({ ...newApOperationAnesthesiaRecovery });
  const [status, setStatus] = useState<string>('');
  const { data: anesthesiaData } = useGetAnesthesiaRecoveryByOperationQuery(operation?.key, {
    skip: !operation?.key,
    refetchOnMountOrArgChange: true,
  });
  console.log("anesthesiaData", anesthesiaData);
  const [save] = useSaveAnesthesiaRecoveryMutation();
  // Fetch  consciousness Level Lov response
  const { data: consciousnessLevelLovQueryResponse } = useGetLovValuesByCodeQuery('LEVEL_OF_CONSC');
  // Fetch  pain Level Lov response
  const { data: painLevelLovQueryResponse } = useGetLovValuesByCodeQuery('NUMBERS');
 
   useEffect(() => {
          setAnethesia({ ...anesthesia, extubationStatus: status })
      }, [status])


  useEffect(() => {
    if (anesthesiaData?.object) {
      
      setAnethesia(normalizeDates(anesthesiaData?.object));
      setStatus(anesthesiaData?.object.extubationStatus || '');
    }
  }, [anesthesiaData]);


  const normalizeDates = (obj) => ({
    ...obj,
    extubationTime: obj.extubationTime ? new Date(obj.extubationTime) : null,

  });
  const handleSave = async () => {
    try {
      const response = await save({
        ...anesthesia,
        operationRequestKey: operation?.key,
        extubationTime: anesthesia.extubationTime
          ? new Date(anesthesia.extubationTime).getTime()
          : null,
      }).unwrap();
      dispatch(
        notify({
          sev: "success",
          msg: "Saved successfully",
        }))
    } catch (error) {
      dispatch(notify({
        sev: "error",
        msg: "Failed to Save",
      }))
    }
  };
  return (
    <div className="container-form">
      <div className="title-div">
        <Text>Anesthesia Recovery</Text>
      </div>
      <Divider />
      <Row className="rows-gap">
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="anesthesiaType"
            record={operation}
            setRecord=""
            disabled
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="airwayTypeOnArrival"
            record={anesthesia}
            setRecord={setAnethesia}
          />
        </Col>
      </Row>
      <Row className="rows-gap">
        <Col md={8}>
          <MyInput
            width="100%"
            fieldType="checkbox"
            fieldName="nauseaVomiting"
            record={anesthesia}
            setRecord={setAnethesia}
          />

        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldType="checkbox"
            fieldName="oxygenGiven"
            record={anesthesia}
            setRecord={setAnethesia}
          />
        </Col>
        {anesthesia.oxygenGiven == true && (
          <Col md={8}>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName="oxygenFlowLpm"
              fieldLabel="L/min"
              record={anesthesia}
              setRecord={setAnethesia}
            />
          </Col>
        )}
      </Row>


      <Row className="rows-gap">
        <RadioGroup
          name="extubationStatus"
          inline
          value={status}
          onChange={(value, _event) => setStatus(value as string)}
        >
          <Col md={8}>
            <Radio value="extubated">Extubated</Radio></Col>
          <Col md={8}>
            <Radio value="Not extubated">Not extubated</Radio></Col>
          <Col md={8}>
            <Radio value="na">NA</Radio></Col>

        </RadioGroup>
      </Row>


      <Row className="rows-gap">
        <Col md={8}>
          <MyInput
            width="100%"
            fieldType="time"
            fieldName="extubationTime"
            record={anesthesia}
            setRecord={setAnethesia}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldLabel="Consciousness Level"
            fieldType="select"
            fieldName="consciousnessLevelLkey"
            selectData={consciousnessLevelLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={anesthesia}
            setRecord={setAnethesia}
            maxHeightMenu={200}
          />
        </Col>
        <Col md={8}>
          <MyInput
            width="100%"
            fieldLabel="Pain Level"
            fieldType="select"
            fieldName="painLevelLkey"
            selectData={painLevelLovQueryResponse?.object ?? []}
            selectDataLabel="lovDisplayVale"
            selectDataValue="key"
            record={anesthesia}
            setRecord={setAnethesia}
            maxHeightMenu={200}
          />
        </Col>
      </Row>

      <GenericAdministeredMedications
        parentKey={"operation?.key"}
        filterFieldName="operationRequestKey"
        medicationService={{
          useGetQuery: useGetRecoveryAntiemeticGivenListQuery,
          useSaveMutation: useSaveRecoveryAntiemeticGivenMutation
        }}
        newMedicationTemplate={newApOperationAnesthesiaRecovery}
        title="Antiemetics Given"
        noBorder
      />
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
export default AnesthesiaRecovery;