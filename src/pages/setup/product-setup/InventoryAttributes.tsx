import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
import MyLabel from '@/components/MyLabel';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPerson } from '@fortawesome/free-solid-svg-icons';
const InventoryAttributes = ({ product, setProduct }) => {

    const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');
    const [filteredResourcesList, setFilteredResourcesList] = useState([]);

    return (
        <>
            <Form fluid layout="inline">
                <MyInput
                    fieldLabel="Batch Managed"
                    fieldName="isBatchManaged"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                />

                <MyInput
                    fieldLabel="Expiry Date Mandatory"
                    fieldName="isExpiryDateMandatory"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                />
                <MyInput
                    fieldLabel="Serialized Item"
                    fieldName="isSerialized"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                />
                <MyInput
                    fieldLabel="Reusable"
                    fieldName="isReusable"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                />
                <MyInput
                    fieldLabel="Inventory Type"
                    fieldName="inventoryTypeLkey"
                    fieldType="select"
                    selectData={lotSerialLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={product}
                    setRecord={setProduct}
                    menuMaxHeight={200}
                    width={480}
                    searchable={false}
                />
                <Row className="rows-gap">
                    <Col md={12}>
                        <MyInput
                            width='100%'
                            fieldLabel='Shelf Life'
                            fieldName='shelfLife'
                            rightAddon="mth"
                            fieldType='number'
                            record={product}
                            setRecord={setProduct}
                        ></MyInput></Col>
                    <Col md={12}>
                        <MyInput
                            width='100%'
                            fieldLabel='Lead Time (Procurement)'
                            fieldName='leadTime'
                            rightAddon="mis"
                            fieldType='number'
                            record={product}
                            setRecord={setProduct}
                        ></MyInput></Col>
                </Row>
                <MyInput
                    column
                    fieldLabel="ERP Integration ID"
                    fieldName="erpIntegId"
                    record={product}
                    setRecord={setProduct}
                />

            </Form>
        </>
    )
};

export default InventoryAttributes;