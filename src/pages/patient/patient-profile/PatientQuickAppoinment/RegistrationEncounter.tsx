import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetResourcesAvailabilityTimeQuery, useGetResourcesQuery } from '@/services/appointmentService';
import { useGetDepartmentsQuery, useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetResourceTypeQuery } from '@/services/appointmentService';
const RegistrationEncounter = ({ localEncounter, setLocalEncounter, isReadOnly }) => {
    const [validationResult, setValidationResult] = useState({});
    const [uniqueDepartmentKeys, setUniqueDepartmentKeys] = useState([]);

    // Fetch LOV data for various fields
    const { data: resourceTypeQueryResponse } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
    const { data: encounterPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_PRIORITY');
    const { data: encounterReasonLovQueryResponse } = useGetLovValuesByCodeQuery('ENC_REASON');
    const { data: visitTypeLovQueryResponse } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
    const { data: patOriginLovQueryResponse } = useGetLovValuesByCodeQuery('PAT_ORIGIN');
    console.log("resourceTypeQueryResponse===>", resourceTypeQueryResponse);
    // Initialize List Request Filters
    const { data: departmentListResponse } = useGetDepartmentsQuery({ ...initialListRequest });
    const [filteredResourcesList, setFilteredResourcesList] = useState([]);
    const [resourcesListRequest, setResourcesListRequest] = useState<ListRequest>({ ...initialListRequest, pageSize: 100 });
    const [resourcesAvailabilityTimeListRequest, setResourcesAvailabilityTimeListRequest] = useState<ListRequest>({ ...initialListRequest });
    const dayCaseDepartmentListResponse = useGetResourceTypeQuery("5433343011954425");
    // Fetches the list of resource availability times.
    const { data: resourceAvailabilityTimeListResponse, refetch: availabilityRefetch } = useGetResourcesAvailabilityTimeQuery({ ...resourcesAvailabilityTimeListRequest, pageSize: 10000 });
    // Fetches the list of resources based on the provided request parameters
    const { data: resourcesListResponse } = useGetResourcesQuery(resourcesListRequest);
    // Effects
    useEffect(() => {
        if (localEncounter?.resourceTypeLkey) {
            const filtered = resourcesListResponse?.object?.filter(resource => resource?.resourceTypeLkey === localEncounter?.resourceTypeLkey);
            setFilteredResourcesList(filtered);
        }
    }, [resourcesListResponse, localEncounter?.resourceTypeLkey]);
    useEffect(() => {
        if (!localEncounter?.resourceKey || !resourceAvailabilityTimeListResponse) return;
        const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const filteredList = resourceAvailabilityTimeListResponse.object.filter(item =>
            item.resourceKey === localEncounter.resourceKey &&
            item.departmentKey
            && item.dayLvalue?.lovDisplayVale === today //Day match
        );
        const departmentKeys = filteredList.map(item => item.departmentKey?.toString().trim());
        const uniqueDepartmentKeys = Array.from(new Set(departmentKeys));
        setUniqueDepartmentKeys(uniqueDepartmentKeys);
    }, [localEncounter, resourceAvailabilityTimeListResponse]);


    return (
        <Form fluid layout="inline" className='fields-container'>
            <MyInput
                vr={validationResult}
                column
                disabled={true}
                fieldLabel="Visit ID"
                fieldName="visitId"
                record={localEncounter}
                setRecord={setLocalEncounter}
            />
            <MyInput
                vr={validationResult}
                column
                disabled={true}
                fieldLabel="Date"
                fieldType="date"
                fieldName="plannedStartDate"
                record={localEncounter}
                setRecord={setLocalEncounter}
            />
            <MyInput
                required
                vr={validationResult}
                column
                fieldLabel="Resource Type"
                fieldType="select"
                fieldName="resourceTypeLkey"
                selectData={resourceTypeQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <MyInput
                column
                fieldLabel="Resources"
                selectData={
                    localEncounter?.resourceTypeLkey
                        ? (filteredResourcesList?.length > 0 ? filteredResourcesList : [])
                        : []
                }
                fieldType="select"
                selectDataLabel="resourceName"
                selectDataValue="key"
                fieldName="resourceKey"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={!localEncounter?.resourceTypeLkey || isReadOnly}
            />
            {/* // TODO update status to be a LOV value */}
            {localEncounter?.resourceTypeLkey == '2039534205961578' ?
                <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="departmentKey"
                    selectData={
                        departmentListResponse?.object?.filter(dept =>
                            uniqueDepartmentKeys.includes(dept.key)
                        ) ?? []
                    }
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                    disabled={isReadOnly}
                />
                : null
            }
            {localEncounter?.resourceTypeLkey == '2039548173192779' ?
                <MyInput
                    vr={validationResult}
                    column
                    fieldType="select"
                    fieldName="departmentKey"
                    selectData={dayCaseDepartmentListResponse?.data?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    record={localEncounter}
                    setRecord={setLocalEncounter}
                    disabled={isReadOnly}
                />
                : null
            }
            <MyInput
                vr={validationResult}
                column
                fieldType="select"
                fieldLabel="Visit Type"
                fieldName="visitTypeLkey"
                selectData={visitTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={() => { }} // No updates allowed
                disabled={isReadOnly}
            />
            <MyInput
                vr={validationResult}
                column
                fieldType="select"
                fieldLabel="Priority"
                fieldName="encounterPriorityLkey"
                selectData={encounterPriorityLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <MyInput
                vr={validationResult}
                column
                fieldType="select"
                fieldName="reasonLkey"
                selectData={encounterReasonLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <MyInput
                vr={validationResult}
                column
                fieldType="select"
                fieldName="originLkey"
                selectData={patOriginLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <MyInput
                vr={validationResult}
                column
                fieldLabel="Source Name"
                fieldName="sourceName"
                record={localEncounter}
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
            />
            <MyInput
                column
                fieldType='textarea'
                fieldLabel="Note"
                fieldName='encounterNotes'
                setRecord={setLocalEncounter}
                disabled={isReadOnly}
                record={localEncounter}
            />
        </Form>
    )
};

export default RegistrationEncounter;