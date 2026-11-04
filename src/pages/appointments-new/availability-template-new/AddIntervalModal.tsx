import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Form, Divider, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';
import {
  AvailabilityTemplateIntervalCreateDTO,
  AvailabilityTemplateIntervalResponseVM,
  AvailabilityTemplateIntervalUpdateDTO,
  AvailabilityTemplateResponseVM,
} from '@/types/model-types-new';
import {
  newAvailabilityTemplateIntervalCreateDTO,
  newAvailabilityTemplateIntervalUpdateDTO,
} from '@/types/model-types-constructor-new';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useCreateAvailabilityTemplateIntervalMutation,
  useUpdateAvailabilityTemplateIntervalMutation,
} from '@/services/appointment/availabilityTemplate/availabilityTemplateInterval';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { extractErrorMessage, isValidTimeFormat, normalizeAllowedServices, timeToSeconds } from './utils';
import './AddIntervalModal.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  resource: any;
  day: string;
  intervalToEdit?: AvailabilityTemplateIntervalResponseVM | null;
  parentTemplate: AvailabilityTemplateResponseVM;
  readOnly?: boolean;
};

const AddIntervalModal: React.FC<Props> = ({ open, setOpen, resource, day, intervalToEdit, parentTemplate, readOnly }) => {
  const dispatch = useAppDispatch();
  const [record, setRecord] = useState<AvailabilityTemplateIntervalCreateDTO | AvailabilityTemplateIntervalUpdateDTO>(
    { ...newAvailabilityTemplateIntervalCreateDTO }
  );
  const allowedServicesTouchedRef = useRef(false);
  const isEditMode = Boolean(intervalToEdit?.id);

  const [createInterval] = useCreateAvailabilityTemplateIntervalMutation();
  const [updateInterval] = useUpdateAvailabilityTemplateIntervalMutation();
  const slotStrategyEnum = useEnumOptions('SlotStrategy');

  const templateAllowedServices = useMemo(
    () => normalizeAllowedServices(resource?.allowedServices),
    [resource?.allowedServices]
  );

  const templateAllowedServiceValues = useMemo(() => {
    const values = templateAllowedServices.map((s: any) => s?.service).filter((v: any) => typeof v === 'string' && v.length > 0);
    return Array.from(new Set(values)) as string[];
  }, [templateAllowedServices]);

  const templateAllowedServiceMap = useMemo(() => {
    const map = new Map<string, number | null>();
    templateAllowedServices.forEach((s: any) => {
      if (typeof s?.service === 'string' && !map.has(s.service)) {
        map.set(s.service, s.id ?? null);
      }
    });
    return map;
  }, [templateAllowedServices]);

  const selectedServiceValues = useMemo(() => {
    return Array.isArray(record?.allowedServices)
      ? record.allowedServices.map((s: any) => s?.service).filter((v: any) => typeof v === 'string' && v.length > 0)
      : [];
  }, [record?.allowedServices]);

  const toggleAllowedService = (serviceValue: string, checked: boolean) => {
    allowedServicesTouchedRef.current = true;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (checked) {
        if (prevAllowed.some((s: any) => s?.service === serviceValue)) return prev;
        return { ...prev, allowedServices: [...prevAllowed, { id: templateAllowedServiceMap.get(serviceValue) ?? null, service: serviceValue }] };
      }
      return { ...prev, allowedServices: prevAllowed.filter((s: any) => s?.service !== serviceValue) };
    });
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
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
        allowedServices: normalizeAllowedServices(intervalToEdit?.allowedServices),
      });
      return;
    }
    setRecord({ ...newAvailabilityTemplateIntervalCreateDTO });
  }, [open, isEditMode, intervalToEdit?.id, day]);

  useEffect(() => {
    if (!open || isEditMode || allowedServicesTouchedRef.current || templateAllowedServices.length === 0) return;
    setRecord(prev => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (prevAllowed.length > 0) return prev;
      return { ...prev, allowedServices: templateAllowedServices };
    });
  }, [open, templateAllowedServices]);

  useEffect(() => {
    setRecord(prev => {
      if (prev?.slotStrategy !== 'AS_DEPARTMENT_POOL') return prev;
      const nextDuration = parentTemplate?.durationMinutes ?? 0;
      if (prev?.slotDurationMinutes === nextDuration) return prev;
      return { ...prev, slotDurationMinutes: nextDuration };
    });
  }, [record?.slotStrategy, parentTemplate?.durationMinutes]);

  // ─── Save Handler ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errors: string[] = [];

    if (!record?.startTime) errors.push('Start Time is required');
    if (!record?.endTime) errors.push('End Time is required');
    if (record?.startTime && !isValidTimeFormat(record.startTime)) errors.push('Start Time format is invalid (HH:mm or HH:mm:ss)');
    if (record?.endTime && !isValidTimeFormat(record.endTime)) errors.push('End Time format is invalid (HH:mm or HH:mm:ss)');
    if (!record?.slotStrategy) errors.push('Slot Strategy is required');
    if (record?.slotStrategy !== 'AS_DEPARTMENT_POOL' && !record?.slotDurationMinutes) errors.push('Slot Duration is required');

    if (record?.startTime && record?.endTime && isValidTimeFormat(record.startTime) && isValidTimeFormat(record.endTime)) {
      if (timeToSeconds(record.startTime) >= timeToSeconds(record.endTime)) {
        errors.push('End Time must be after Start Time');
      }
    }

    if (errors.length > 0) {
      dispatch(notify({ msg: errors.join(' ,'), sev: 'warning' }));
      return;
    }

    const slotDurationMinutes = Number.isFinite(Number(record?.slotDurationMinutes)) ? Number(record?.slotDurationMinutes) : null;

    if (isEditMode && intervalToEdit?.id) {
      const payload: AvailabilityTemplateIntervalUpdateDTO = {
        id: intervalToEdit.id,
        dayOfWeek: day,
        startTime: (record as any)?.startTime ?? '',
        endTime: (record as any)?.endTime ?? '',
        slotStrategy: (record as any)?.slotStrategy ?? '',
        slotDurationMinutes,
        allowedServices: normalizeAllowedServices((record as any)?.allowedServices),
      };
      await updateInterval({ id: intervalToEdit.id, body: payload })
        .unwrap()
        .then(() => { dispatch(notify({ msg: 'Updated Successfully', sev: 'success' })); setOpen(false); })
        .catch(() => { dispatch(notify({ msg: 'Could not update interval. Please check for overlapping times or invalid input.', sev: 'warning' })); });
      return;
    }

    const payload: AvailabilityTemplateIntervalCreateDTO = {
      ...(record as AvailabilityTemplateIntervalCreateDTO),
      templateId: resource?.id ?? (record as AvailabilityTemplateIntervalCreateDTO).templateId,
      dayOfWeek: day,
      slotDurationMinutes: Number(record?.slotDurationMinutes),
    };
    await createInterval(payload)
      .unwrap()
      .then(() => { dispatch(notify({ msg: 'Added Successfully', sev: 'success' })); setOpen(false); })
      .catch(error => { dispatch(notify({ msg: extractErrorMessage(error) || 'Could not save interval. Please check for overlapping times or invalid input.', sev: 'warning' })); });
  };

  const formContent = () => (
    <Form fluid className="add-interval-modal">
      <div className="day-title">{formatEnumString(day)}</div>
      <Divider />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h6><Translate>Interval</Translate></h6>
      </div>
      <div className="interval-row">
        <MyInput fieldName="startTime" fieldType="time" record={record} setRecord={setRecord} placeholder="Start Time" width="100%" required disabled={readOnly} />
        <MyInput fieldName="endTime" fieldType="time" record={record} setRecord={setRecord} placeholder="End Time" width="100%" required disabled={readOnly} />
      </div>

      <div className="block">
        <Translate>Services Allowed (optional):</Translate>
        <Form fluid>
          <Row>
            {templateAllowedServiceValues.map(serviceValue => {
              const fieldName = `service_${serviceValue}`;
              return (
                <Col md={8} key={serviceValue}>
                  <MyInput
                    width="100%"
                    fieldType="check"
                    fieldName={fieldName}
                    record={{ [fieldName]: selectedServiceValues.includes(serviceValue) }}
                    setRecord={(next: any) => toggleAllowedService(serviceValue, Boolean(next[fieldName]))}
                    showLabel={false}
                    fieldLabel={formatEnumString(serviceValue)}
                    disabled={readOnly}
                  />
                </Col>
              );
            })}
          </Row>
        </Form>
      </div>

      <Divider />
      <h6><Translate>Slot Strategy</Translate></h6>
      <div className="slot-strategy-row">
        <Form fluid layout="inline">
          <MyInput
            fieldName="slotStrategy"
            fieldType="select"
            record={record}
            setRecord={setRecord}
            selectData={slotStrategyEnum ?? []}
            selectDataLabel="label"
            selectDataValue="value"
            width="15vw"
            disabled={readOnly}
            required
          />
          <MyInput
            fieldName="slotDurationMinutes"
            fieldType="number"
            record={record}
            setRecord={setRecord}
            width="15vw"
            rightAddon="min"
            fieldLabel="Duration"
            disabled={record?.slotStrategy === 'AS_DEPARTMENT_POOL' || readOnly}
            required
          />
        </Form>
      </div>
      <Divider />
    </Form>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={readOnly ? 'View Interval' : isEditMode ? 'Edit Interval' : 'Add Interval'}
      size="40vw"
      content={formContent}
      actionButtonLabel={isEditMode ? 'Update' : 'Save'}
      actionButtonFunction={handleSave}
      hideActionBtn={readOnly}
    />
  );
};

export default AddIntervalModal;
