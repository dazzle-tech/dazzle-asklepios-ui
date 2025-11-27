import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import {Form} from 'rsuite';
import { useEnumOptions } from '@/services/enumsApi';
const MaintenanceInformation = ({ product, setProduct, disabled}) => {

    const timeUnit  = useEnumOptions('TimeUnit');

    return (
        <>
            <Form fluid>
            <div className="flex-row-product-set-up-page">
                <MyInput
                    width={180}
                    fieldType="date"
                    fieldLabel="Warranty Start Date"
                    fieldName="warrantyStartDate"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    width={180}
                    fieldType="date"
                    fieldLabel="End Date"
                    fieldName="warrantyEndDate"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
            </div>
            
            <div className="flex-row-product-set-up-page">
                    <MyInput
                        width='100%'
                        fieldLabel='Maintenance Schedule'
                        fieldName='maintenanceSchedule'
                        fieldType='number'
                        record={product}
                        setRecord={setProduct}
                        disabled={disabled}
                    />
                    <MyInput
                        fieldLabel="Type"
                        fieldName="maintenanceScheduleType"
                        fieldType="select"
                        selectData={timeUnit ?? []}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={product}
                        setRecord={setProduct}
                        searchable={false}
                        disabled={disabled}
                    />
            </div>

            <div className="flex-row-product-set-up-page">
                <MyInput
                    fieldLabel="Critical Equipment"
                    fieldName="criticalEquipment"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Calibration Required"
                    fieldName="calibrationRequired"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Training Required"
                    fieldName="trainingRequired"
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

export default MaintenanceInformation;