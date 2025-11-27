import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const RegulSafty = ({ product, setProduct, disabled }) => {

    return (
        <>
            <Form fluid>

<div className="flex-row-product-set-up-page">
                    <MyInput
                    fieldLabel="Controlled Substance"
                    fieldName="controlledSubstance"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                    />
                    <MyInput
                    fieldLabel="Hazardous/Biohazardous Tag"
                    fieldName="hazardousBiohazardousTag"
                    fieldType="text"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                    />
                    <MyInput
                    fieldLabel="Allergy Risk"
                    fieldName="allergyRisk"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                    />
                </div>
            </Form>
        </>
    )
};

export default RegulSafty;