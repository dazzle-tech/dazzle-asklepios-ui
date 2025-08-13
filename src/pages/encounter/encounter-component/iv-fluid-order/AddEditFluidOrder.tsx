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
          <Form fluid className="compact-form">
            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={[]}
                  selectDataLabel=""
                  selectDataValue=""
                  fieldType="select"
                  fieldName="fluidType"
                  fieldLabel="Fluid Type"
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
                  fieldLabel="Volume"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={routeLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="route"
                  fieldLabel="Route"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                  searchable={false}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="number"
                  rightAddon="mL/hr"
                  rightAddonwidth={70}
                  fieldName="infusionRate"
                  fieldLabel="InfusionRate"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={frequencyLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="frequency"
                  fieldLabel="Frequency"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  searchable={false}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldType="checkbox"
                  fieldName="untilCompleted"
                  fieldLabel="Until Completed"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  disabled={fluidOrder?.untilCompleted}
                  width="100%"
                  fieldName="duration"
                  fieldLabel="Duration"
                  fieldType="number"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="concentration"
                  fieldLabel="Concentration"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="startTime"
                  fieldLabel="Start Time"
                  fieldType="date"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="estimatedEndTime"
                  fieldLabel="Estimated EndTime"
                  fieldType="date"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  disabled
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={infusionDeviceLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="infusionDevice"
                  fieldLabel="Infusion Device"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                  searchable={false}
                />
              </Col>

              <Col md={12}>
                <MyInput
                  width="100%"
                  selectData={priorityLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldType="select"
                  fieldName="priority"
                  fieldLabel="Priority"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                  menuMaxHeight={200}
                  searchable={false}
                />
              </Col>
            </Row>

            <Row>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="notesToNurse"
                  fieldLabel="Notes To Nurse"
                  fieldType="textarea"
                  record={fluidOrder}
                  setRecord={setFluidOrder}
                />
              </Col>
              <Col md={12}>
                <MyInput
                  width="100%"
                  fieldName="allergiesChecked"
                  fieldLabel="Allergies Checked"
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
