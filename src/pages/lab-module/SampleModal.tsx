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
  Text
} from "rsuite";
const { Column, HeaderCell, Cell } = Table;
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useGetLovValuesByCodeQuery } from "@/services/setupService";
import { newApDiagnosticOrderTests, newApDiagnosticOrderTestsSamples } from "@/types/model-types-constructor";
import { FaCalendar } from "react-icons/fa6";
import Translate from "@/components/Translate";
import { useAppDispatch } from "@/hooks";
import { useSaveDiagnosticOrderTestSamplesMutation } from "@/services/labService";

const SampleModal = ({ labDetails, open, setOpen, samplesList, test, setTest, order ,saveTest}) => {
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
        orderKey: order.key,
        testKey: test.key,
        sampleCollectedAt: selectedSampleDate ? selectedSampleDate.getTime() : null
      }).unwrap();
      setTest({ ...newApDiagnosticOrderTests })
      dispatch(notify({ msg: 'Saved successfully', sev: 'success' }));
      setTest({ ...Response });
      // await fetchTest();
      // await fecthSample();
      setOpen(false);
      setSample({ ...newApDiagnosticOrderTestsSamples });
      setSelectedSampleDate(null);
    }
    catch (error) {
      dispatch(notify({ msg: 'Saved Faild', sev: 'error' }));
    }
  }

  return (
    <div className="sample-modal">
      <Modal open={open} onClose={() => setOpen(false)} size="md">
        <Modal.Header>
          <Modal.Title>Collect Sample</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col xs={8}>
              <Form >
                <MyInput
                  disabled={true}
                  fieldName={"systemLkey"}
                  record={labDetails}
                  setRecord={""}

                /></Form>
            </Col>
            <Col xs={8}>
              <Form >
                <MyInput
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

                  record={sample}
                  setRecord={setSample}
                />
              </Form>
            </Col>
            <Col xs={8}>
              <Form>
                <MyInput
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
              <Text style={{ fontWeight: 'bold' }}>Sample Collected </Text>
              <DatePicker
                style={{ width: '270' }}
                format="dd MMM yyyy hh:mm:ss aa"
                showMeridiem
                caretAs={FaCalendar}
                value={selectedSampleDate}
                onChange={handleDateChange}
              /></Col>

          </Row>
          <Row>
            <Col xs={24}>
              <Panel
                header="Collected Samples"
                collapsible
                style={{ border: '1px solid #e5e5ea' }}
              >
                <Panel style={{ border: '1px solid #e5e5ea' }}>
                  <Table
                    height={200}

                    data={samplesList?.object ?? []}

                  >

                    <Column flexGrow={3} fullText>
                      <HeaderCell>

                        <Translate>COLLECTED AT</Translate>
                      </HeaderCell>
                      <Cell >
                        {rowData => rowData.sampleCollectedAt ? new Date(rowData.sampleCollectedAt).toLocaleString() : ""}
                      </Cell>
                    </Column>

                    <Column flexGrow={2} fullText>
                      <HeaderCell>

                        <Translate>ACTUAL SAMPLE QUANTITY</Translate>
                      </HeaderCell>
                      <Cell>
                        {rowData => rowData?.quantity ?? ""}
                      </Cell>
                    </Column>
                    <Column flexGrow={1} fullText>
                      <HeaderCell>

                        <Translate>UNIT </Translate>
                      </HeaderCell>
                      <Cell  >
                        {rowData => rowData.unitLvalue ? rowData.unitLvalue.lovDisplayVale : rowData.unitLkey}
                      </Cell>
                    </Column>

                  </Table>
                  <Divider />
                  <Pagination
                    prev
                    next
                    first
                    last
                    ellipsis
                    boundaryLinks
                    maxButtons={5}
                    size="xs"
                    layout={['total', '-', 'limit', '|', 'pager', 'skip']}
                    limitOptions={[5, 15, 30]}
                    //  limit={listRequest.pageSize}
                    //  activePage={listRequest.pageNumber}

                    //  onChangePage={pageNumber => {
                    //    setListRequest({ ...listRequest, pageNumber });
                    //  }}
                    //  onChangeLimit={pageSize => {
                    //    setListRequest({ ...listRequest, pageSize });
                    //  }}
                    total={samplesList?.object?.length || 0}
                  />
                </Panel>
              </Panel>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer style={{ display: "flex", justifyContent: 'flex-end' }}>
          <Button
            appearance="primary"
            color="cyan"
            onClick={handleSaveSample}
          >
            Save
          </Button>
          <Button
            appearance="ghost"
            color="cyan"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default SampleModal;

