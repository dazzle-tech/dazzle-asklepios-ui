import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const RegulSafty = ({ product, setProduct, disabled }) => {

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <div dir={dir}>
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
        </div>
    )
};

export default RegulSafty;