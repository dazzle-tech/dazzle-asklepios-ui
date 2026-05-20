import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Divider, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import './AddIntervalModal.less';
import MyModal from '@/components/MyModal/MyModal';
import {
    AvailabilityTemplateIntervalCreateDTO,
    AvailabilityTemplateIntervalResponseVM,
    AvailabilityTemplateIntervalUpdateDTO,
    AvailabilityTemplateResponseVM
} from '@/types/model-types-new';
import {
    newAvailabilityTemplateIntervalCreateDTO,
    newAvailabilityTemplateIntervalUpdateDTO
} from '@/types/model-types-constructor-new';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
    useCreateAvailabilityTemplateIntervalMutation,
    useUpdateAvailabilityTemplateIntervalMutation
} from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';

/* ===================== COMPONENT ===================== */

const AddIntervalModal = ({
    open,
    setOpen,
    resource,
    day,
    intervalToEdit,
    parentTemplate,
    ...props
}: {

    open: boolean;
    setOpen: any;
    resource: any;
    day: string;
    intervalToEdit?: AvailabilityTemplateIntervalResponseVM | null;
    parentTemplate: AvailabilityTemplateResponseVM;
    readOnly?: boolean;
}) => {
    const [record, setRecord] = useState<
        AvailabilityTemplateIntervalCreateDTO | AvailabilityTemplateIntervalUpdateDTO
    >({ ...newAvailabilityTemplateIntervalCreateDTO });
    const dispatch = useAppDispatch();
    const allowedServicesTouchedRef = useRef(false);
    const isEditMode = Boolean(intervalToEdit?.id);

    const normalizeAllowedServices = (input: any) => {
        if (!Array.isArray(input)) return [];
        return input
            .map((s: any) => {
                if (typeof s === 'string') return { id: null, service: s };
                if (s && typeof s === 'object' && 'service' in s) {
                    return { id: s.id ?? null, service: s.service ?? null };
                }
                return null;
            })
            .filter(Boolean);
    };

    const templateAllowedServices = useMemo(
        () => normalizeAllowedServices(resource?.allowedServices),
        [resource?.allowedServices]
    );

    const templateAllowedServiceValues = useMemo(() => {
        const values = templateAllowedServices
            .map((s: any) => s?.service)
            .filter((v: any) => typeof v === 'string' && v.length > 0);
        return Array.from(new Set(values));
    }, [templateAllowedServices]);

    const templateAllowedServiceMap = useMemo(() => {
        const map = new Map<string, number | null>();
        templateAllowedServices.forEach((s: any) => {
            if (typeof s?.service === 'string') {
                if (!map.has(s.service)) {
                    map.set(s.service, s.id ?? null);
                }
            }
        });
        return map;
    }, [templateAllowedServices]);

    const slotStrategyEnum = useEnumOptions('SlotStrategy');
    const [createAvailabilityTemplateInterval] = useCreateAvailabilityTemplateIntervalMutation();
    const [updateAvailabilityTemplateInterval] = useUpdateAvailabilityTemplateIntervalMutation();

    useEffect(() => {
        if (!open) return;
        allowedServicesTouchedRef.current = false;
    }, [open, resource?.id]);

    useEffect(() => {
        if (!open) return;
        if (isEditMode && intervalToEdit) {
            setRecord({
                ...newAvailabilityTemplateIntervalUpdateDTO,
                id: intervalToEdit?.id ?? 0,
                dayOfWeek: intervalToEdit?.dayOfWeek ?? day,
                startTime: intervalToEdit?.startTime ?? '',
                endTime: intervalToEdit?.endTime ?? '',
                slotStrategy: intervalToEdit?.slotStrategy ?? '',
                slotDurationMinutes: intervalToEdit?.slotDurationMinutes ?? 0,
                allowedServices: normalizeAllowedServices(intervalToEdit?.allowedServices)
            });
            return;
        }
        setRecord({ ...newAvailabilityTemplateIntervalCreateDTO });
    }, [open, isEditMode, intervalToEdit?.id, day]);

    useEffect(() => {
        if (!open) return;
        if (isEditMode) return;
        if (allowedServicesTouchedRef.current) return;
        if (templateAllowedServices.length === 0) return;
        setRecord(prev => {
            const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
            if (prevAllowed.length > 0) return prev;
            return {
                ...prev,
                allowedServices: templateAllowedServices,
            };
        });
    }, [open, templateAllowedServices]);

    useEffect(() => {
        setRecord(prev => {
            if (prev?.slotStrategy !== 'AS_DEPARTMENT_POOL') return prev;
            const nextDuration = parentTemplate?.durationMinutes ?? 0;
            if (prev?.slotDurationMinutes === nextDuration) return prev;
            return {
                ...prev,
                slotDurationMinutes: nextDuration
            };
        });
    }, [record?.slotStrategy, parentTemplate?.durationMinutes]);

    const conjureFormContent = (stepNumber = 0) => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid className="add-interval-modal">
                        <div className="day-title">{formatEnumString(day)}</div>
                        <Divider />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h6>
                                <Translate>Interval</Translate>
                            </h6>
                        </div>
                        <div className="interval-row">
                            <MyInput
                                fieldName="startTime"
                                fieldType='time'
                                record={record}
                                setRecord={setRecord}
                                placeholder="Start Time"
                                width="100%"
                                required
                                disabled={props?.readOnly}
                            />

                            <MyInput
                                fieldName="endTime"
                                fieldType="time"
                                record={record}
                                setRecord={setRecord}
                                placeholder="End Time"
                                width="100%"
                                required
                                disabled={props?.readOnly}
                            />
                        </div>
                        <div className="block">
                            <Translate>Services Allowed (optional):</Translate>
                            <Form fluid>
                                <Row>
                                    {templateAllowedServiceValues.map(serviceValue => {
                                        const fieldName = `service_${serviceValue}`;
                                        const selectedServiceValues = Array.isArray(record?.allowedServices)
                                            ? record.allowedServices
                                                .map((s: any) => s?.service)
                                                .filter((v: any) => typeof v === 'string' && v.length > 0)
                                            : [];
                                        const isChecked = selectedServiceValues.includes(serviceValue);
                                        return (
                                            <Col md={8} key={serviceValue}>
                                                <MyInput
                                                    width="100%"
                                                    fieldType="check"
                                                    fieldName={fieldName}
                                                    record={{ [fieldName]: isChecked }}
                                                    setRecord={(next: any) => {
                                                        const checked = Boolean(next[fieldName]);
                                                        allowedServicesTouchedRef.current = true;
                                                        setRecord(prev => {
                                                            const prevAllowed = Array.isArray(prev?.allowedServices)
                                                                ? prev.allowedServices
                                                                : [];
                                                            const prevValues = prevAllowed
                                                                .map((s: any) => s?.service)
                                                                .filter((v: any) => typeof v === 'string' && v.length > 0);
                                                            if (checked) {
                                                                if (prevValues.includes(serviceValue)) return prev;
                                                                return {
                                                                    ...prev,
                                                                    allowedServices: [
                                                                        ...prevAllowed,
                                                                        {
                                                                            id: templateAllowedServiceMap.get(serviceValue) ?? null,
                                                                            service: serviceValue
                                                                        }
                                                                    ]
                                                                };
                                                            }
                                                            return {
                                                                ...prev,
                                                                allowedServices: prevAllowed.filter(
                                                                    (s: any) => s?.service !== serviceValue
                                                                ),
                                                            };
                                                        });
                                                    }}
                                                    showLabel={false}
                                                    fieldLabel={formatEnumString(serviceValue)}
                                                    disabled={props?.readOnly}
                                                />
                                            </Col>
                                        );
                                    })}
                                </Row>
                            </Form>
                        </div>

                        <Divider />

                        <h6>
                            <Translate>Slot Strategy</Translate>
                        </h6>

                        <div className="slot-strategy-row">
                            <Form fluid layout='inline'>
                                <MyInput
                                    fieldName="slotStrategy"
                                    fieldType="select"
                                    record={record}
                                    setRecord={setRecord}
                                    selectData={slotStrategyEnum ?? []}
                                    selectDataLabel="label"
                                    selectDataValue="value"
                                    width="15vw"
                                    disabled={props?.readOnly}
                                    required
                                />

                                <MyInput
                                    fieldName="slotDurationMinutes"
                                    fieldType="number"
                                    record={record}
                                    setRecord={setRecord}
                                    width={"15vw"}
                                    rightAddon="min"
                                    fieldLabel='Duration'
                                    disabled={record?.slotStrategy === 'AS_DEPARTMENT_POOL' || props?.readOnly}
                                    required
                                />
                            </Form>
                        </div>


                        {!isEditMode && (
                            <div style={{ marginTop: 12 }}>
                                <MyInput
                                    fieldName="applyToAllWorkingDays"
                                    fieldType="check"
                                    record={record}
                                    setRecord={setRecord}
                                    label="Apply to all working days in this template"
                                    disabled={props?.readOnly}
                                />
                            </div>
                        )}
                        <Divider />

                    </Form>
                );
            default:
                return null;
        }
    };
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

        if (!record?.startTime) {
            errors.push('Start Time is required');
        }

        if (!record?.endTime) {
            errors.push('End Time is required');
        }
        if (record?.startTime && !isValidTimeFormat(record.startTime)) {
            errors.push('Start Time format is invalid (HH:mm or HH:mm:ss)');
        }

        if (record?.endTime && !isValidTimeFormat(record.endTime)) {
            errors.push('End Time format is invalid (HH:mm or HH:mm:ss)');
        }

        if (!record?.slotStrategy) {
            errors.push('Slot Strategy is required');
        }

        if (
            record?.slotStrategy !== 'AS_DEPARTMENT_POOL' &&
            !record?.slotDurationMinutes
        ) {
            errors.push('Slot Duration is required');
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
        const rawSlotDuration = (record as any)?.slotDurationMinutes;
        const parsedSlotDuration = Number(rawSlotDuration);
        const normalizedSlotDuration = Number.isFinite(parsedSlotDuration)
            ? parsedSlotDuration
            : null;

        if (isEditMode && intervalToEdit?.id) {
            const payload: AvailabilityTemplateIntervalUpdateDTO = {
                id: intervalToEdit.id,
                dayOfWeek: day,
                startTime: (record as any)?.startTime ?? '',
                endTime: (record as any)?.endTime ?? '',
                slotStrategy: (record as any)?.slotStrategy ?? '',
                slotDurationMinutes: normalizedSlotDuration,
                allowedServices: normalizeAllowedServices((record as any)?.allowedServices)
            };

            await updateAvailabilityTemplateInterval({
                id: intervalToEdit.id,
                body: payload
            })
                .unwrap()
                .then(() => {
                    dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
                    setOpen(false);
                })
                .catch(() => {
                    dispatch(notify({ msg: 'Could not update interval. Please check for overlapping times or invalid input.', sev: 'warning' }));
                });

            return;
        }

        const payload: AvailabilityTemplateIntervalCreateDTO = {
            ...(record as AvailabilityTemplateIntervalCreateDTO),
            templateId: resource?.id ?? (record as AvailabilityTemplateIntervalCreateDTO).templateId,
            dayOfWeek: day,
            slotDurationMinutes: Number(record?.slotDurationMinutes),
            applyToAllWorkingDays: Boolean((record as any)?.applyToAllWorkingDays)
        };
        await createAvailabilityTemplateInterval(payload)
            .unwrap()
            .then(() => {
                dispatch(notify({ msg: 'Added Successfully', sev: 'success' }));
                setOpen(false);
            })
            .catch((error) => {
                const errorMsg = extractErrorMessage(error) || 'Could not save interval. Please check for overlapping times or invalid input.';
                dispatch(notify({ msg: errorMsg, sev: 'warning' }));
            });
    };



    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title={props?.readOnly ? 'View Interval' : isEditMode ? "Edit Interval" : "Add Interval"}
            size="40vw"
            content={conjureFormContent}
            actionButtonLabel={isEditMode ? "Update" : "Save"}
            actionButtonFunction={handleSave}
            hideActionBtn={props?.readOnly}
        />
    );
};

export default AddIntervalModal;
