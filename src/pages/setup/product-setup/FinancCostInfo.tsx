import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const FinancCostInfo = ({ product, setProduct }) => {

    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');

    return (
        <>
            <Form fluid layout="inline">

                <MyInput
                    fieldLabel="Item Average Cost"
                    fieldName="avgCost"
                    record={product}
                    setRecord={setProduct}
                />

                <MyInput
                    column
                    fieldLabel="Price per Base UOM"
                    fieldName="priceBaseUom"
                    record={product}
                    setRecord={setProduct}
                />

            </Form>
        </>
    )
};

export default FinancCostInfo;