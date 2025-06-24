import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery, useGetUomGroupsQuery } from '@/services/setupService';
const UomGroupDef = ({ uomGroup, setUomGroup }) => {
 
    // Initialize List Request Filters
   
    const [filteredResourcesList, setFilteredResourcesList] = useState([]);

    return (
        <>
        <Form fluid layout="inline">
            <MyInput
                column
                fieldLabel="Group Name"
                fieldName="name"
                record={uomGroup}
                setRecord={setUomGroup}
            />
           </Form>
     <Form fluid layout="inline">
            <MyInput
                column
                fieldLabel="Code"
                fieldName="code"
                record={uomGroup}
                setRecord={setUomGroup}
            />
             </Form>
             <Form fluid layout="inline">
             <MyInput
                column
                fieldLabel="Description"
                fieldType="textarea"
                fieldName="description"
                record={uomGroup}
                setRecord={setUomGroup}
            />
        </Form>
        </>
    )
};

export default UomGroupDef;