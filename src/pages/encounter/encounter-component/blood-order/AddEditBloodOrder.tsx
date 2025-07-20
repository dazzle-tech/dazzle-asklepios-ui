import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDroplet } from '@fortawesome/free-solid-svg-icons';
import './styles.less';
const AddEditBloodOrder = ({
  open,
  setOpen,
  width,
  bloodorder,
  setBloodOrder,
}) => {
 
  
  // Fetch product Types Lov response
  const { data: productTypesLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_PRODUCTS');
  // Fetch urgency Lov response
  const { data: urgencyLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  // Fetch product Lov response 
  const { data: productLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_STATUS');

  // Modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <Row>
                <Col md={12}>
              <MyInput
                fieldName="productType"
                fieldType="select"
                selectData={productTypesLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={bloodorder}
                setRecord={setBloodOrder}
                width="100%"
              />
              </Col>
              <Col md={12}>
              <MyInput
                width="100%"
                fieldName="numberOfUnit"
                fieldType='number'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              </Row>
              <br/>
              <Row>
                <Col md={12}>
              <MyInput
                width="100%"
                fieldName="amount"
                fieldType='number'
                rightAddon="ml"
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              <Col md={12}>
               <MyInput
                width="100%"
                fieldName="reason"
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              </Row>
              <br/>
              <Row>
                <Col md={12}>
              <MyInput
                width="100%"
                fieldName="rate"
                fieldType='number'
                rightAddon="ml\hr"
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              <Col md={12}>
              <MyInput
                fieldName="urgency"
                fieldType="select"
                selectData={urgencyLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={bloodorder}
                setRecord={setBloodOrder}
                width="100%"
              />
              </Col>
              </Row>
              <br/>
              <Row>
                <Col md={8}>
               <MyInput
                width="100%"
                fieldName="latestHb"
                record={bloodorder}
                setRecord={setBloodOrder}
                readonly
              />
              </Col>
               <Col md={8}>
               <MyInput
                width="100%"
                fieldName="latestHct"
                record={bloodorder}
                setRecord={setBloodOrder}
                readonly
              />
              </Col>
               <Col md={8}>
               <MyInput
                width="100%"
                fieldName="latestPlateletCount"
                record={bloodorder}
                setRecord={setBloodOrder}
                readonly
              />
              </Col>
              </Row>
              <br/>
               <MyInput
                width="100%"
                fieldName="scheduledTransfusionDate"
                fieldType='datetime'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              <Row>
                <Col md={12}>
               <MyInput
                width="100%"
                fieldName="crossmatchRequired"
                fieldType='check'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              <Col md={12}>
              <MyInput
                width="100%"
                fieldName="antibodyScreenDone"
                fieldType='checkbox'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              </Row>
              <br/>
              <MyInput
                width="100%"
                fieldName="specialRequirements"
                fieldType='textarea'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              <MyInput
                width="100%"
                fieldName="transfusionHistory"
                fieldType='textarea'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              <MyInput
                width="100%"
                fieldName="previousReaction"
                fieldType='checkbox'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              {bloodorder?.previousReaction && (
                 <MyInput
                width="100%"
                fieldName=""
                fieldType='textarea'
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              )}
              <Row>
                <Col md={12}>
               <MyInput
                width="100%"
                fieldName="additionalNotes"
                record={bloodorder}
                setRecord={setBloodOrder}
              />
              </Col>
              <Col md={12}>
               <MyInput
                fieldName="status"
                fieldType="select"
                selectData={productLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={bloodorder}
                setRecord={setBloodOrder}
                width="100%"
                menuMaxHeight={200}
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
      title={bloodorder?.key ? 'Edit Blood Order' : 'New Blood Order'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={bloodorder?.key ? 'Save' : 'Create'}
      actionButtonFunction=""
      steps={[{ title: 'Blood Order Info', icon:<FontAwesomeIcon icon={faDroplet} />}]}
      size={width > 600 ? '36vw' : '25vw'}
    />
  );
};
export default AddEditBloodOrder;
