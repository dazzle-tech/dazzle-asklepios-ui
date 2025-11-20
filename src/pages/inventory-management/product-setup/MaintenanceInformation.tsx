import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
import Room from '@/pages/setup/bed-room-setup';
import MyLabel from '@/components/MyLabel';
const MaintenanceInformation = ({ product, setProduct, disabled}) => {

    const { data: timeUnitLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

    return (
        <>
            <Form fluid layout="inline">
                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="Warranty Start Date"
                    fieldName="startDate"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    column
                    width={180}
                    fieldType="date"
                    fieldLabel="End Date"
                    fieldName="endDate"
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <div>
                    <MyInput
                        width='100%'
                        fieldLabel='Maintenance Schedule'
                        fieldName='maintenanceScheduleTime'
                        fieldType='number'
                        record={product}
                        setRecord={setProduct}
                        disabled={disabled}
                    />
                    <MyInput
                        fieldLabel="Type"
                        fieldName="maintenanceScheduleLkey"
                        fieldType="select"
                        selectData={timeUnitLovQueryResponse?.object ?? []}
                        selectDataLabel="lovDisplayVale"
                        selectDataValue="key"
                        record={product}
                        setRecord={setProduct}
                        searchable={false}
                        disabled={disabled}
                    />
                </div>

                <MyInput
                    fieldLabel="Critical Equipment"
                    fieldName="isCritical"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Calibration Required"
                    fieldName="isCalibration"
                    width="100%"
                    fieldType='checkbox'
                    record={product}
                    setRecord={setProduct}
                    disabled={disabled}
                />
                <MyInput
                    fieldLabel="Training Required"
                    fieldName="isTraining"
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

export default MaintenanceInformation;