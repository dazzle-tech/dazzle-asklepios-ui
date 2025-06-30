import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Dropdown, Form, Input, InputGroup, Row } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import { useGetActiveIngredientQuery, useGetGenericMedicationQuery } from '@/services/medicationsSetupService';
const BasicInf = ({ product, setProduct }) => {

    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined
            }
        ],
    });
    const { data: brandMedicationListResponseLoading } = useGetGenericMedicationQuery(listRequest);
    const { data: activeIngredientListResponseData } = useGetActiveIngredientQuery(listRequest);


    useEffect(() => {
        const medCode = brandMedicationListResponseLoading?.object?.find(item => item.key === product?.medicationKey)?.code || "";
        const medName = brandMedicationListResponseLoading?.object?.find(item => item.key === product?.medicationKey)?.genericName || "";
        // const medActive = brandMedicationListResponseLoading?.object?.find(item => item.key === product?.medicationKey)?.activeIngredientKey || "";
        // const medATC = activeIngredientListResponseData?.object?.find(item => item.key === medActive)?.atcCode || "";

        setProduct(prev => ({
            ...prev,
            code: medCode,
            name: medName
        }));
    }, [
        product,
        product.medicationKey 

    ]);


    useEffect(() => {
        setListRequest(
            {
                ...initialListRequest,
                filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined
                    }
                ],
            }
        );
    }, [product]);
    return (
        <>
            <Form fluid layout="inline">
                <MyInput
                    fieldLabel="Type"
                    fieldName="typeLkey"
                    fieldType="select"
                    selectData={productTypeLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    record={product}
                    setRecord={setProduct}
                    menuMaxHeight={200}
                    width={480}
                    searchable={false}
                />
            </Form>
            {product.typeLkey === '5274597115605262' &&
                <>

                    <MyInput
                        fieldLabel="Brand Medication"
                        fieldName="medicationKey"
                        fieldType="select"
                        selectData={brandMedicationListResponseLoading?.object ?? []}
                        selectDataLabel="genericName"
                        selectDataValue="key"
                        record={product}
                        setRecord={setProduct}
                        menuMaxHeight={200}
                        width={480}
                        searchable={true}
                    />

                    <MyInput
                        column
                        fieldLabel="Name"
                        fieldName="name"
                        record={product}
                        setRecord={setProduct}
                        disabled={true}
                    />
                    <MyInput
                        fieldLabel="Medication Code"
                        fieldName="code"
                        record={product}
                        setRecord={setProduct}
                        disabled={true}
                    />
                    <MyInput
                        fieldLabel="ATC code"
                        fieldName='medATC'
                        record={product}
                        setRecord={setProduct}
                        disabled={true}
                    />
                </>
            }
            {product.typeLkey != '5274597115605262' &&
                <Form fluid layout="inline">
                    <MyInput
                        column
                        fieldLabel="Name"
                        fieldName="name"
                        record={product}
                        setRecord={setProduct}
                    />

                    <MyInput
                        column
                        fieldLabel="Code"
                        fieldName="code"
                        record={product}
                        setRecord={setProduct}
                    />
                </Form>

            }


            <Form fluid layout="inline">
                <MyInput
                    column
                    fieldLabel="Barcode / QR code"
                    fieldName="barecode"
                    record={product}
                    setRecord={setProduct}
                />
            </Form>
        </>
    )
};

export default BasicInf;