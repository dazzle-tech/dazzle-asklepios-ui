import React, { useMemo, useState } from "react";
import { Form, Panel } from "rsuite";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faVialCircleCheck } from "@fortawesome/free-solid-svg-icons";

import MyInput from "@/components/MyInput";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";

import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { formatDateWithoutSeconds } from "@/utils";

import {
  useCreateCollectedSampleMutation,
  useGetCollectedSamplesByOrderTestIdQuery,
} from "@/services/setup/diagnosticTest/diagnosticOrderTestCollectedSampleService";

import { useGetLaboratoryByTestIdQuery } from "@/services/setup/diagnosticTest/laboratoryService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTestsSamples } from "@/types/model-types-constructor";

import "./styles.less";

type SampleModalProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  orderTest?: any;
  onSuccess?: () => Promise<void> | void;
};


const SampleModal = ({ open, setOpen, orderTest, onSuccess}: SampleModalProps) => {
  const dispatch = useAppDispatch();

  const testId =
    orderTest?.test?.id ??
    orderTest?.testId ??
    orderTest?.diagnosticTest?.id;

  const { data: lab } = useGetLaboratoryByTestIdQuery(testId, {
    skip: !testId,
  });

  const { data: valueUnitLov } = useGetLovValuesByCodeQuery("VALUE_UNIT");
  const { data: sampleContainerLov } = useGetLovValuesByCodeQuery("LAB_SAMPLE_CONTAINER");
  const { data: tubeColorLov } = useGetLovValuesByCodeQuery("LAB_TUBE_COLORS");
  const { data: tubeTypeLov } = useGetLovValuesByCodeQuery("LAB_TUBE_TYPES");
  const { data: systemLov } = useGetLovValuesByCodeQuery("LAB_SYSTEMS");

  const labView = useMemo(() => {
    if (!lab) return {};

    const lov = (list?: any[], v?: any) =>
      list?.find(i => String(i.key) === String(v))?.lovDisplayVale ?? v;

    return {
      system: lov(systemLov?.object, lab.system),
      tubeColor: lov(tubeColorLov?.object, lab.tubeColor),
      tubeType: lov(tubeTypeLov?.object, lab.tubeType),
      sampleContainer: lov(sampleContainerLov?.object, lab.sampleContainer),
      sampleVolume: lab.sampleVolume,
      sampleVolumeUnit: lov(valueUnitLov?.object, lab.sampleVolumeUnit),
    };
  }, [lab, systemLov, tubeColorLov, tubeTypeLov, sampleContainerLov, valueUnitLov]);

  const [sample, setSample] = useState({ ...newApDiagnosticOrderTestsSamples });
  const [selectedSampleDate, setSelectedSampleDate] = useState<{ dateTime: Date | null }>({
    dateTime: null,
  });

  const [createCollectedSample] = useCreateCollectedSampleMutation();

  const { data: samplesPage, refetch: refetchSamples } =
    useGetCollectedSamplesByOrderTestIdQuery(
      { orderTestId: orderTest?.id, page: 0, size: 20 },
      { skip: !orderTest?.id }
    );
  
const handleSaveSample = async () => {
  try {
    const unitText =
      valueUnitLov?.object?.find(
        u => String(u.key) === String(sample.unitLkey)
      )?.lovDisplayVale;

    if (!unitText) {
      dispatch(notify({ msg: "Unit is required", sev: "warning" }));
      return;
    }
    await createCollectedSample({
      orderId: orderTest.orderId,
      orderTestId: orderTest.id,
      quantity: sample.quantity,
      unit: unitText,
      collectedAt: selectedSampleDate.dateTime?.toISOString() ?? null
    }).unwrap();

    dispatch(notify({ msg: "Saved successfully", sev: "success" }));

  } catch (e) {
    dispatch(notify({ msg: "Save failed", sev: "error" }));
    return;
  }
  try {
    await refetchSamples();
  } catch (e) {
    console.warn("Post-save refresh failed", e);
  }

  onSuccess?.();
  setSample({ ...newApDiagnosticOrderTestsSamples });
  setSelectedSampleDate({ dateTime: null });
  setOpen(false);
};

const tableColumns = [
    {
      key: "collectedAt",
      dataKey: "collectedAt",
      title: <Translate>COLLECTED AT</Translate>,
      flexGrow: 2,
      render: (rowData: any) => formatDateWithoutSeconds(rowData.collectedAt),
    },
    {
      key: "quantity",
      dataKey: "quantity",
      title: <Translate>ACTUAL SAMPLE QUANTITY</Translate>,
      flexGrow: 2,
    },
    {
      key: "unit",
      dataKey: "unit",
      title: <Translate>UNIT</Translate>,
      flexGrow: 1,
    },
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      size="50vw"
      position="right"
      title="Collect Sample"
      actionButtonFunction={handleSaveSample}
      steps={[{ title: "Sample", icon: <FontAwesomeIcon icon={faVialCircleCheck} /> }]}
      content={
        <>
          <Form fluid>
            <div className="collect-sample-modal-inputs-main-container">
               <MyInput disabled fieldName="system" record={labView} width={"14vw"} /> 
               <MyInput disabled fieldName="tubeColor" record={labView} width={"14vw"} /> 
               <MyInput disabled fieldName="tubeType" record={labView} width={"14vw"} /> 
             

             
               <MyInput disabled fieldName="sampleContainer" record={labView} width={"14vw"} /> 
               <MyInput disabled fieldName="sampleVolume" fieldType="number" record={labView} width={"14vw"} /> 
               <MyInput disabled fieldName="sampleVolumeUnit" record={labView} width={"14vw"} /> 
             

             
               
                <MyInput fieldLabel="Actual Sample Quantity" fieldName="quantity" fieldType="number" record={sample} setRecord={setSample} width={"14vw"}/>
               
               
                <MyInput fieldName="unitLkey" fieldType="select" selectData={valueUnitLov?.object ?? []}
                  selectDataLabel="lovDisplayVale" selectDataValue="key" record={sample} setRecord={setSample} width={"14vw"}/>
               
               
                <MyInput fieldName="dateTime" fieldType="datetime" fieldLabel="Sample Collected"
                  record={selectedSampleDate} setRecord={setSelectedSampleDate} width={"14vw"}/>
               </div>
             
          </Form>

          <Panel>
            <MyTable columns={tableColumns} data={samplesPage?.data ?? []} />
          </Panel>
        </>
      }
    />
  );
};

export default SampleModal;
