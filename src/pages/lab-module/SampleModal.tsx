import MyInput from "@/components/MyInput";
import MyLabel from "@/components/MyLabel";
import MyModal from "@/components/MyModal/MyModal";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useSaveDiagnosticOrderTestSamplesMutation } from "@/services/labService";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsSamples } from "@/types/model-types-constructor";
import { notify } from '@/utils/uiReducerActions';
import { faVialCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, {
  useState
} from "react";
import { FaCalendar } from "react-icons/fa6";
import {
  Col,
  DatePicker,
  Form,
  Panel,
  Row,
  Stack,
  Table
} from "rsuite";
import './styles.less';
import {formatDateWithoutSeconds } from "@/utils";

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
      render: (rowData) =>formatDateWithoutSeconds(rowData.sampleCollectedAt),
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
        size="50vw"
        actionButtonFunction={handleSaveSample}
        title="Collect Sample"
        steps={[{ title: "Sample", icon:<FontAwesomeIcon icon={ faVialCircleCheck }/>}]}
        position="right"
        content={<>
        <Form fluid>
          <Row>
            <Col xs={8}>
             
                <MyInput
                  width="100%"
                  disabled={true}
                  fieldName={"systemLkey"}
                  record={labDetails}
                  setRecord={""}

                />
            </Col>
            <Col xs={8}>
            
                <MyInput
                  width="100%"
                  disabled={true}
                  fieldName={"tubeColorLkey"}
                  fieldType='select'
                  selectData={TubeColorLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={labDetails}
                  setRecord={""}

                />
            </Col>
            <Col xs={8}>
           
                <MyInput
                  width="100%"
                  disabled={true}
                  fieldName={"tubeTypeLkey"}
                  fieldType='select'
                  selectData={LabTubeTypeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={labDetails}
                  setRecord={""}

                />
            </Col>
          </Row>
          <Row>
            <Col xs={8}>
             
                <MyInput
                  width="100%"
                  fieldName={"sampleContainerLkey"}
                  fieldType='select'
                  selectData={SampleContainerLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  disabled={true}
                  record={labDetails}
                  setRecord={""}
                />
            </Col>
            <Col xs={8}>
              
                <MyInput
                  width="100%"
                  fieldName={"sampleVolume"}
                  fieldType='number'
                  disabled={true}
                  record={labDetails ?? ""}
                  setRecord={""}
                />
            

            </Col>
            <Col xs={8}>
             
                <MyInput
                  width="100%"
                  fieldName={"sampleVolumeUnitLkey"}
                  fieldType='select'
                  selectData={ValueUnitLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  disabled={true}
                  record={labDetails}
                  setRecord={""}
                />
             
            </Col>
          </Row>
          <Row>
            <Col xs={8}>
              
                <MyInput
                  fieldLabel={"Actual Sample Quantity"}
                  fieldName={"quantity"}
                  fieldType='number'
                  width="100%"
                  record={sample}
                  setRecord={setSample}
                />
             
            </Col>
            <Col xs={8}>
            
                <MyInput
                  width="100%"
                  fieldName={"unitLkey"}
                  fieldType='select'
                  selectData={ValueUnitLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={sample}
                  setRecord={setSample}
                />
             </Col>
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
          </Form>
          <Row>
            <Col xs={24}>
              <Panel

                style={{ border: '1px solid #e5e5ea' }}
              >
                <MyTable
                  columns={tableColumns}
                  data={samplesList?.object ?? []}
                  
                ></MyTable>


              </Panel>
            </Col>
          </Row></>}


      ></MyModal>

    </div>
  );
};

export default SampleModal;

