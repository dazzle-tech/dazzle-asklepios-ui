import MyInput from "@/components/MyInput";
import React,
{
  useState,
  useEffect, useRef
} from "react";
import { notify } from '@/utils/uiReducerActions';
import {
  Form, Modal,
  Row, Col, Button, DatePicker, Table, Divider, Pagination, Panel,
  Text,
  Stack
} from "rsuite";
import './styles.less';
const { Column, HeaderCell, Cell } = Table;
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsSamples } from "@/types/model-types-constructor";
import { FaCalendar } from "react-icons/fa6";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useSaveDiagnosticOrderTestSamplesMutation } from "@/services/labService";
import MyModal from "@/components/MyModal/MyModal";
import { title } from "process";
import { FaYoutube } from "react-icons/fa";
import { TableColumn } from "@rsuite/icons";
import MyTable from "@/components/MyTable";
import MyLabel from "@/components/MyLabel";
import { faVialCircleCheck } from "@fortawesome/free-solid-svg-icons";

const SampleModal = ({ labDetails, open, setOpen, samplesList, test, setTest, saveTest ,fetchTest ,fecthSample}) => {
  const dispatch = useAppDispatch();
  const [sample, setSample] = useState({ ...newApDiagnosticOrderTestsSamples });
  const [selectedSampleDate, setSelectedSampleDate] = useState(null);
  const { data: ValueUnitLovQueryResponse } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: SampleContainerLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_SAMPLE_CONTAINER');
  const { data: LabTubeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_TYPES');
  const { data: TubeColorLovQueryResponse } = useGetLovValuesByCodeQuery('LAB_TUBE_COLORS');
  const [saveSample] = useSaveDiagnosticOrderTestSamplesMutation();
  const handleDateChange = (date) => {
    if (date) {

      setSelectedSampleDate(date);
    }
  };
  const handleSaveSample = async () => {
    try {
      const Response = await saveTest({ ...test, processingStatusLkey: "6055207372976955" }).unwrap();
      saveSample({
        ...sample,
        orderKey: test.orderKey,
        testKey: test.key,
        sampleCollectedAt: selectedSampleDate ? selectedSampleDate.getTime() : null
      }).unwrap();
      setTest({ ...newApDiagnosticOrderTests })
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...Response });
      await fetchTest();
     await fecthSample();
      setOpen(false);
      setSample({ ...newApDiagnosticOrderTestsSamples });
      setSelectedSampleDate(null);
    }
    catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  };

  const tableColumns = [
    {
      key: "sampleCollectedAt",
      dataKey: "sampleCollectedAt",
      title: <Translate>COLLECTED AT</Translate>,
      fullText: true,
      flexGrow: 2,
      render: (rowData) => rowData.sampleCollectedAt ? new Date(rowData.sampleCollectedAt).toLocaleString() : "",
    },
    {
      key: "quantity",
      dataKey: "quantity",
      title: <Translate>ACTUAL SAMPLE QUANTITY</Translate>,
      fullText: true,
      flexGrow: 2,
      render: (rowData) => rowData?.quantity ?? "",
    },
    {
      key: "unitLkey",
      dataKey: "unitLkey",
      title: <Translate>UNIT </Translate>,
      fullText: true,
      flexGrow: 1,
      render: (rowData) => rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey,
    }]
  return (
    <div className="sample-modal">
      <MyModal
        open={open}
        setOpen={setOpen}
        size="md"
        bodyheight={550}
        actionButtonFunction={handleSaveSample}
        title="Collect Sample"
        steps={[{ title: "Sample", icon:<FontAwesomeIcon icon={ faVialCircleCheck }/>}]}
        position="right"
        content={<>
          <Row>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  disabled={true}
                  fieldName={"systemLkey"}
                  record={labDetails}
                  setRecord={""}

                /></Form>
            </Col>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  disabled={true}
                  fieldName={"tubeColorLkey"}
                  fieldType='select'
                  selectData={TubeColorLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={labDetails}
                  setRecord={""}

                /></Form>
            </Col>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  disabled={true}
                  fieldName={"tubeTypeLkey"}
                  fieldType='select'
                  selectData={LabTubeTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={labDetails}
                  setRecord={""}

                /></Form>
            </Col>
          </Row>
          <Row>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  fieldName={"sampleContainerLkey"}
                  fieldType='select'
                  selectData={SampleContainerLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  disabled={true}
                  record={labDetails}
                  setRecord={""}
                /></Form>
            </Col>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  fieldName={"sampleVolume"}
                  fieldType='number'
                  disabled={true}
                  record={labDetails ?? ""}
                  setRecord={""}
                />
              </Form>

            </Col>
            <Col xs={8}>
              <Form >
                <MyInput
                  width={200}
                  fieldName={"sampleVolumeUnitLkey"}
                  fieldType='select'
                  selectData={ValueUnitLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  disabled={true}
                  record={labDetails}
                  setRecord={""}
                />
              </Form>
            </Col>
          </Row>
          <Row>
            <Col xs={8}>
              <Form>
                <MyInput
                  fieldLabel={"Actual Sample Quantity"}
                  fieldName={"quantity"}
                  fieldType='number'
                  width={200}
                  record={sample}
                  setRecord={setSample}
                />
              </Form>
            </Col>
            <Col xs={8}>
              <Form>
                <MyInput
                  width={200}
                  fieldName={"unitLkey"}
                  fieldType='select'
                  selectData={ValueUnitLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={sample}
                  setRecord={setSample}
                />
              </Form></Col>
            <Col xs={8}>
              <div className='vaccine-input-wrapper'>
                <div>  
                  <MyLabel label="Sample Collected" /></div>
                <Stack spacing={10} direction="column" alignItems="flex-start" className='date-time-picker'>
                  <DatePicker
                    style={{ width: '200px'}}
                    format="dd MMM yyyy hh:mm:ss aa"
                    showMeridiem
                    caretAs={FaCalendar}
                    value={selectedSampleDate}
                    onChange={handleDateChange}
                  />
                </Stack>
              </div>
           </Col>

          </Row>
          <Row>
            <Col xs={24}>
              <Panel

                style={{ border: '1px solid #e5e5ea' }}
              >
                <MyTable
                  columns={tableColumns}
                  data={samplesList?.object ?? []}
                  height={200}
                  rowHeight={40}
                ></MyTable>


              </Panel>
            </Col>
          </Row></>}


      ></MyModal>

    </div>
  );
};

export default SampleModal;

