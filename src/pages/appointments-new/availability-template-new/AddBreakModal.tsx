import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddResourceModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import SectionContainer from '@/components/SectionsoContainer';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetActiveFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import {
    useLazyGetAppointableServicesByLoggedInFacilityQuery,
    useLazyGetServicesByDepartmentQuery,
    useLazyGetServiceByIdQuery,
    useLazyGetServiceItemByIdQuery
} from '@/services/setup/serviceService';
import {
    useLazyGetAppointablePractitionerByLoggedInFacilityQuery,
    useLazyGetPractitionerByDepartmentQuery,
    useLazyGetPractitionerByIdQuery
} from '@/services/setup/practitioner/PractitionerService';
import { newAvailabilityTemplateCreateDTO, newAvailabilityTemplateIntervalBreakCreateDTO } from '@/types/model-types-constructor-new';
import { useCreateAvailabilityTemplateMutation, useUpdateAvailabilityTemplateMutation } from '@/services/appointment/availabilityTemplateService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import {
    useLazyGetAllActiveAppointableDiagnosticTestsQuery,
    useLazyGetDiagnosticTestByIdQuery
} from '@/services/setup/diagnosticTest/diagnosticTestService';
import {
    useLazyGetAppointableCatalogsByLoggedInFacilityQuery,
    useLazyGetCatalogByIdQuery
} from '@/services/setup/catalog/catalogService';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { useLazyGetActiveAppointableRoomsByDepartmentIdQuery, useLazyGetRoomByIdQuery } from '@/services/setup/room/roomService';
import { AvailabilityTemplateIntervalBreakCreateDTO, AvailabilityTemplateIntervalResponseVM } from '@/types/model-types-new';
import { useCreateAvailabilityTemplateIntervalBreakMutation } from '@/services/appointment/availabilityTemplate/availabilityTemplateIntervalBreak';



const AddBreakModal = ({
    interval,
    open,
    setOpen,
    ...props
}: {
    open: boolean;
    setOpen: any;
    interval: AvailabilityTemplateIntervalResponseVM;
    readOnly?: boolean;
}) => {
    const dispatch = useAppDispatch();
    const [record, setRecord] = useState<AvailabilityTemplateIntervalBreakCreateDTO>({ ...newAvailabilityTemplateIntervalBreakCreateDTO })
    const [createAvailabilityTemplateIntervalBreak] = useCreateAvailabilityTemplateIntervalBreakMutation();

    const isValidTimeFormat = (time?: string) => {
        // يقبل HH:mm أو HH:mm:ss
        return /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time || '');
    };

    const timeToSeconds = (time: string) => {
        const parts = time.split(':').map(Number);

        const hours = parts[0] || 0;
        const minutes = parts[1] || 0;
        const seconds = parts[2] || 0;

        return hours * 3600 + minutes * 60 + seconds;
    };

    // extract the error message from the bad request that coming from the backend
    const extractErrorMessage = (response: any): string => {
        try {
            const msg = response?.data?.message;
            if (typeof msg === 'string') {
                return msg.replace(/^error\./i, '');
            }
            return '';
        } catch {
            return '';
        }
    };

    const handleSave = async () => {

        const errors = [];
        if (!interval?.id) {
            errors.push('There is no selected interval');
        }

        if (!record?.startTime) {
            errors.push('Start Time Break is required');
        }

        if (!record?.endTime) {
            errors.push('End Time Break is required');
        }
        if (record?.startTime && !isValidTimeFormat(record.startTime)) {
            errors.push('Start Time Break format is invalid (HH:mm or HH:mm:ss)');
        }

        if (record?.endTime && !isValidTimeFormat(record.endTime)) {
            errors.push('End Time Break format is invalid (HH:mm or HH:mm:ss)');
        }

        if (
            record?.startTime &&
            record?.endTime &&
            isValidTimeFormat(record.startTime) &&
            isValidTimeFormat(record.endTime)
        ) {
            const start = timeToSeconds(record.startTime);
            const end = timeToSeconds(record.endTime);

            if (start >= end) {
                errors.push('End Time must be after Start Time');
            }
        }

        if (errors.length > 0) {
            dispatch(
                notify({
                    msg: errors.join(' ,'),
                    sev: 'warning'
                })
            );
            return;
        }

        await createAvailabilityTemplateIntervalBreak({ ...record, intervalId: interval?.id })
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
                setOpen(false);
            })
            .catch((e) => {
                const errorMsg = extractErrorMessage(e) || 'Save Failed';
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
            });
        setOpen(false);
    };


    const conjureFormContent = () => (
        <Form fluid>
            <MyInput
                fieldName="startTime"
                fieldType='time'
                record={record}
                setRecord={setRecord}
                placeholder="Start Time Break"
                width="100%"
                required
                disabled={props?.readOnly}
            />

            <MyInput
                fieldName="endTime"
                fieldType="time"
                record={record}
                setRecord={setRecord}
                placeholder="End Time Break"
                width="100%"
                required
                disabled={props?.readOnly}
            />

        </Form>
    );

    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={"Add Break"}
            size="md"
            content={conjureFormContent}
            actionButtonFunction={handleSave}
            actionButtonLabel={"Save"}
            hideActionBtn={props?.readOnly}
        />
    );
};

export default AddBreakModal;