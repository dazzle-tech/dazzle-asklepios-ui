import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSyringe } from '@fortawesome/free-solid-svg-icons';
const AddEditFluidOrder = ({ open, setOpen, width, fluidOrder, setFluidOrder }) => {
  // Fetch route Lov response
  const { data: routeLovQueryResponse } = useGetLovValuesByCodeQuery('FLUID_ROUTE');
  // Fetch frequency Lov response
  const { data: frequencyLovQueryResponse } = useGetLovValuesByCodeQuery('IV_FREQUENCY');
  // Fetch infusion Device Lov response
  const { data: infusionDeviceLovQueryResponse } = useGetLovValuesByCodeQuery('INFUSION_DEVICE');
  // Fetch priority Lov response
  const { data: priorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={[]}
                  selectDataLabel=""
                  selectDataValue=""
                  fieldType="select"
                  fieldName="fluidType"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="number"
                  rightAddon="ml"
                  fieldName="volume"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>
            <br />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={routeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="route"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="number"
                  rightAddon="mL/hr"
                  fieldName="infusionRate"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              selectData={frequencyLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldType="select"
              fieldName="frequency"
              record={fluidOrder}
              setRecord={setFluidOrder}
              menuMaxHeight={200}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="checkbox"
                  fieldName="untilCompleted"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  disabled={fluidOrder?.untilCompleted}
                  width="100%"
                  fieldName="duration"
                  fieldType="number"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              fieldName="concentration"
              record={fluidOrder}
              setRecord={setFluidOrder}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="startTime"
                  fieldType="date"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="estimatedEndTime"
                  fieldType="date"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  disabled
                />
              </Col>
            </Row>
            <br />
            <MyInput
              width="100%"
              selectData={infusionDeviceLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldType="select"
              fieldName="infusionDevice"
              record={fluidOrder}
              setRecord={setFluidOrder}
              menuMaxHeight={200}
            />
            <MyInput
              width="100%"
              fieldName="notesToNurse"
              fieldType="textarea"
              record={fluidOrder}
              setRecord={setFluidOrder}
            />
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={priorityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="priority"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="allergiesChecked"
                  fieldType="checkbox"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={fluidOrder?.key ? 'Edit Fluid Order' : 'New Fluid Order'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={fluidOrder?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Fluid Order Info', icon: <FontAwesomeIcon icon={faSyringe} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditFluidOrder;
