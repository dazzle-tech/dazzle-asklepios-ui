import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';

const InventoryAttributes = ({ product, setProduct , disabled }) => {

    const lotSerial = useEnumOptions("InventoryType");

    return (
        <>
            <Form fluid>
                <div className="flex-row-product-set-up-page">
                <MyInput
                    fieldLabel="Batch Managed"
                    fieldName="batchManaged"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

                <MyInput
                    fieldLabel="Expiry Date Mandatory"
                    fieldName="expiryDateMandatory"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                {/* <MyInput
                    fieldLabel="Serialized Item"
                    fieldName="isSerialized"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                /> */}
                <MyInput
                    fieldLabel="Reusable"
                    fieldName="reusable"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
            </div>
                <MyInput
                    fieldLabel="Inventory Type"
                    fieldName="inventoryType"
                    fieldType="select"
                    selectData={lotSerial ?? []}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={product}
                    setRecord={setProduct}
                    menuMaxHeight={200}
                    width={400}
                    searchable={false}
                    disabled={disabled}
                />
                <Row className="rows-gap">
                <div className="flex-row-product-set-up-page">
                    <Col md={12}>
                        <MyInput
                            width='100%'
                            fieldLabel='Shelf Life'
                            fieldName='shelfLife'
                            rightAddon="mth"
                            fieldType='number'
                            record={product}
                            setRecord={setProduct}
                            disabled={disabled}
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
                            disabled={disabled}
                        ></MyInput></Col>
                </div>
                </Row>
                <MyInput
                    fieldLabel="ERP Integration ID"
                    fieldName="erpIntegrationId"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

            </Form>
        </>
    )
};

export default InventoryAttributes;