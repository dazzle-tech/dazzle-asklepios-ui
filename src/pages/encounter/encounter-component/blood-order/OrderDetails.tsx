import React from 'react';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
const OrderDetails = ({ bloodorder, setBloodOrder }) => {
  // Fetch product Types Lov response
  const { data: productTypesLovQueryResponse } = useGetLovValuesByCodeQuery('BLOOD_PRODUCTS');
  // Fetch urgency Lov response
  const { data: urgencyLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
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
            fieldType="number"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="amount"
            fieldType="number"
            rightAddon="ml"
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
        <Col md={12}>
          <MyInput
            width="100%"
            fieldName="rate"
            fieldType="number"
            rightAddon="ml\hr"
            rightAddonwidth={50}
            record={bloodorder}
            setRecord={setBloodOrder}
          />
        </Col>
      </Row>
      <Row>
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
        <Col md={12}>
          <MyInput width="100%" fieldName="reason" record={bloodorder} setRecord={setBloodOrder} />
        </Col>
      </Row>
    </Form>
  );
};
export default OrderDetails;
