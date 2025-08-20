import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const FinancCostInfo = ({ product, setProduct, disabled}) => {


    return (
        <>
            <Form fluid layout="inline">

                <MyInput
                    fieldLabel="Item Average Cost"
                    fieldName="avgCost"
                    fieldType="number"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

                <MyInput
                    fieldLabel="Price per Base UOM"
                    fieldName="priceBaseUom"
                    fieldType="number"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

            </Form>
        </>
    )
};

export default FinancCostInfo;