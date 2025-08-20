import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const RegulSafty = ({ product, setProduct, disabled }) => {

    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const [filteredResourcesList, setFilteredResourcesList] = useState([]);

    return (
        <>
            <Form fluid layout="inline">


                <MyInput
                    fieldLabel="Controlled Substance"
                    fieldName="isControlledSubstance"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

                <MyInput
                    column
                    fieldLabel="Hazardous/Biohazardous Tag"
                    fieldName="hazardousTag"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />

                <MyInput
                    fieldLabel="Allergy Risk"
                    fieldName="isAllergyRisk"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
            </Form>
        </>
    )
};

export default RegulSafty;