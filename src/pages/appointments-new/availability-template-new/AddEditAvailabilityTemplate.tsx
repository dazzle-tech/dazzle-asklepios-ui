import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Divider, Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useGetActiveFacilitiesQuery, useGetFacilityByIdQuery } from '@/services/security/facilityService';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { useGetAllOrganizationDefinitionsQuery } from '@/services/system-configurations/organizationDefinitionService';
import {
  useCreateAvailabilityTemplateMutation,
  useUpdateAvailabilityTemplateMutation,
} from '@/services/appointment/availabilityTemplateService';
import { useGetDepartmentServicesQuery } from '@/services/departmentServicesService';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateCreateDTO } from '@/types/model-types-constructor-new';
import { extractErrorMessage, normalizeAllowedServices } from './utils';
import { useTemplateFormOptions } from './useTemplateFormOptions';
import './styles.less';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  template: AvailabilityTemplateResponseVM;
  setTemplate: (t: AvailabilityTemplateResponseVM) => void;
};

const AddEditAvailabilityTemplate: React.FC<Props> = ({ open, setOpen, template, setTemplate }) => {
  const dispatch = useAppDispatch();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const isEditMode = !!template?.id;

  // ─── State ───────────────────────────────────────────────────────────────────
  const [record, setRecord] = useState<any>({});
  const [currentColor, setCurrentColor] = useState('#6982F0');

  // ─── Refs ────────────────────────────────────────────────────────────────────
  // These refs act as "user intent flags" — they don't trigger re-renders,
  // they just tell the auto-fill effects "the user already chose something,
  // don't overwrite it."

  /* Becomes true the moment the user ticks/unticks any allowed service.
   Prevents the services effect from overwriting the user's selection
    when departmentServices loads asynchronously. */
  const userChangedServicesRef = useRef(false);

  /* Becomes true the moment the user ticks/unticks any working day.
    Prevents the working-days hierarchy effect from overwriting the user's
    selection while the modal is still open. */
  const userChangedWorkingDaysRef = useRef(false);

  /* Becomes true when the user picks a new department (in create mode).
    The services auto-fill effect guards on this so it only fires after
    a real department change, not on initial modal open. */
  const hasChangedDepartmentRef = useRef(false);

  /* Tracks whether the modal is already open. Used by the merged [open, template]
    effect to distinguish "modal just opened" from "template prop changed while
    the modal was already open". */
  const wasOpenRef = useRef(false);

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const { data: organizationDefinitions } = useGetAllOrganizationDefinitionsQuery({});
  const { data: selectedFacilityFullObject } = useGetFacilityByIdQuery(selectedFacility?.id, {
    skip: !selectedFacility?.id,
  });
  const { data: departmentServices = [] } = useGetDepartmentServicesQuery(
    { departmentId: record?.departmentId },
    { skip: !record?.departmentId }
  );
  /* Reactive (not lazy) query — fires automatically whenever record.departmentId changes.
     We use the regular query instead of useLazyGetDepartmentByIdQuery so that
     the department data becomes available reactively, the same way departmentServices
     does, allowing the working-days hierarchy effect to react consistently.
     Skipped in edit mode because the template already has its own stored values;
     we should not overwrite them with department defaults.*/
  const { data: selectedDepartmentFullObject } = useGetDepartmentByIdQuery(
    record?.departmentId,
    { skip: !record?.departmentId || isEditMode }
  );

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const [create] = useCreateAvailabilityTemplateMutation();
  const [update] = useUpdateAvailabilityTemplateMutation();

  // ─── Enums & Form Options ─────────────────────────────────────────────────────
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  const dayOptions = useEnumOptions('DayOfWeek');
  const encounterReasonEnum = useEnumOptions('EncounterReason');

  const {
    departmentOptions, isDeptLoading, deptHasMore, deptNextLink, loadDepartments, resetDepartments,
    serviceOptions, isServiceLoading, serviceHasMore, serviceNextLink, loadServices, resetServices,
    practitionerOptions, isPractitionerLoading, practitionerHasMore, practitionerNextLink, loadPractitioners, resetPractitioners,
  } = useTemplateFormOptions();

  // ─── Computed (useMemo) ──────────────────────────────────────────────────────
  const dayOptionsKey = useMemo(() => dayOptions.map(d => `${d.value}:${d.label}`).join('|'), [dayOptions]);

  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    if (!dayOptions?.length) return map;
    dayOptions.forEach(day => { map[day.value] = false; });
    (record?.workingDays ?? []).forEach((day: any) => {
      if (day?.dayOfWeek != null) map[day.dayOfWeek] = day.isWorking === true;
    });
    return map;
  }, [record?.workingDays, dayOptionsKey]);

  const selectedServiceValues = useMemo(() => {
    if (!Array.isArray(record?.allowedServices)) return [];
    return record.allowedServices
      .map((s: any) => s?.service)
      .filter((v: any) => typeof v === 'string' && v.length > 0);
  }, [record?.allowedServices]);

  // ─── Helpers ─────────────────────────────────────────────────────────────────
  const hasAnyWorkingDayEnabled = (days: any) =>
    Array.isArray(days) && days.some((d: any) => d?.isWorking === true);

  // Converts a raw working-days array from the API into a normalized array
  // where every day in dayOptions has an entry. Days not present in the source
  // default to isWorking: false. Returns null if the source is empty or dayOptions
  // hasn't loaded yet (caller uses null to mean "don't apply yet").
  const normalizeWorkingDays = (source: any[]): any[] | null => {
    if (!dayOptions?.length || !Array.isArray(source) || !source.length) return null;
    return dayOptions.map(day => {
      const found = source.find((d: any) => String(d?.dayOfWeek) === String(day.value));
      return { dayOfWeek: day.value, isWorking: found?.isWorking === true };
    });
  };

  // Determines which working days to use by walking up the hierarchy:
  // Department → Facility → Organization.
  // We prefer the most specific level that has at least one working day marked true.
  //
  // The null-return guard at the top handles a race condition: after the user picks
  // a department, record.departmentId updates immediately but selectedDepartmentFullObject
  // is still loading. Returning null tells the calling effect to wait rather than
  // applying stale data from a previous department.
  const getWorkingDaysFromHierarchy = (): any[] | null => {
    const facilityData = facilityListResponse?.find((f: any) => String(f?.id) === String(selectedFacility?.id));
    const facilityWorkingDays = selectedFacilityFullObject?.workingDays ?? facilityData?.workingDays ?? [];
    const organizationWorkingDays = organizationDefinitions?.[0]?.workingDays ?? [];
    const departmentWorkingDays =
      String(selectedDepartmentFullObject?.id ?? '') === String(record?.departmentId ?? '')
        ? selectedDepartmentFullObject?.workingDays ?? []
        : [];

    // Guard: department selected but its data hasn't arrived yet — don't apply yet.
    if (record?.departmentId && String(selectedDepartmentFullObject?.id ?? '') !== String(record?.departmentId ?? '')) {
      return null;
    }

    const source = hasAnyWorkingDayEnabled(departmentWorkingDays)
      ? departmentWorkingDays
      : hasAnyWorkingDayEnabled(facilityWorkingDays)
        ? facilityWorkingDays
        : organizationWorkingDays;

    return normalizeWorkingDays(source);
  };

  const setWorkingDaysRecord = (nextRecord: Record<string, boolean>) => {
    if (!dayOptions?.length) return;
    userChangedWorkingDaysRef.current = true;
    setRecord((prev: any) => ({
      ...prev,
      workingDays: dayOptions.map(day => ({ dayOfWeek: day.value, isWorking: !!nextRecord[day.value] })),
    }));
  };

  const toggleAllowedService = (serviceValue: string, checked: boolean) => {
    userChangedServicesRef.current = true;
    setRecord((prev: any) => {
      const prevAllowed = Array.isArray(prev?.allowedServices) ? prev.allowedServices : [];
      if (checked) {
        if (prevAllowed.some((s: any) => s?.service === serviceValue)) return prev;
        return { ...prev, allowedServices: [...prevAllowed, { id: null, service: serviceValue }] };
      }
      return { ...prev, allowedServices: prevAllowed.filter((s: any) => s?.service !== serviceValue) };
    });
  };

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleDepartmentChange = (next: any) => {
    // In edit mode we only update the field value — no auto-fill side effects.
    if (isEditMode) {
      setRecord((prev: any) => ({ ...prev, ...next }));
      return;
    }
    // Reset intent flags so the auto-fill effects can re-apply defaults for
    // the newly selected department. Without these resets, if the user had
    // manually touched services or working days and then changed department,
    // the flags would stay true and block the auto-fill.
    userChangedServicesRef.current = false;
    userChangedWorkingDaysRef.current = false;
    hasChangedDepartmentRef.current = true;
    // Clear services that were relevant to the previous department.
    setRecord((prev: any) => ({ ...prev, ...next, allowedServices: [], defaultServiceId: null }));
  };

  const handleSave = async () => {
    if (!record?.templateName?.trim()) { dispatch(notify({ msg: 'Template Name is required', sev: 'warning' })); return; }
    if (!record?.facilityId) { dispatch(notify({ msg: 'Facility is required', sev: 'warning' })); return; }
    if (!record?.templateType) { dispatch(notify({ msg: 'Template Type is required', sev: 'warning' })); return; }
    if (!record?.departmentId) { dispatch(notify({ msg: 'Department is required', sev: 'warning' })); return; }
    if (record?.requirePractitioner && !record?.defaultPractitionerId) {
      dispatch(notify({ msg: 'Default Practitioner is required', sev: 'warning' }));
      return;
    }

    const payload = {
      ...record,
      resourceId: record?.departmentId,
      numberOfResourcesExpected: Number(record.numberOfResourcesExpected),
      durationMinutes: Number(record?.durationMinutes),
      defaultBufferBeforeMinutes: Number(record?.defaultBufferBeforeMinutes),
      defaultBufferAfterMinutes: Number(record?.defaultBufferAfterMinutes),
      parallelCapacityValue: Number(record?.parallelCapacityValue ?? 1),
      allowedServices: Array.isArray(record?.allowedServices) ? record.allowedServices : [],
    };

    try {
      if (template?.id) {
        const updated = await update({ id: template.id, ...payload }).unwrap();
        setTemplate(updated);
        dispatch(notify({ msg: 'Updated Successfully', sev: 'success' }));
      } else {
        const created = await create(payload).unwrap();
        setTemplate(created);
        dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
      }
    } catch (err) {
      dispatch(notify({ msg: extractErrorMessage(err) || 'Save Failed', sev: 'warning' }));
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────

  // Single merged effect for [open, template].
  //
  // Why merged? In React 18 both deps can change in the same render batch
  // (e.g. parent calls setOpen(true) and setSelectedTemplate(t) in one handler).
  // If they were two separate effects, both would fire in the same flush and
  // setRecord would be called twice, with the second call potentially
  // overwriting partial state from the first.
  //
  // wasOpenRef lets us tell the two cases apart:
  //   • "modal just opened"  → justOpened = true  → reset all flags and load form
  //   • "template changed while modal was already open" → justOpened = false
  //     → still reload the form so it reflects the new template, but DON'T reset
  //       the flags (the user may have already interacted)
  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      return;
    }

    const justOpened = !wasOpenRef.current;
    wasOpenRef.current = true;

    if (justOpened) {
      userChangedServicesRef.current = false;
      userChangedWorkingDaysRef.current = false;
      hasChangedDepartmentRef.current = false;
    }

    if (isEditMode) {
      setRecord({
        ...template,
        facilityId: selectedFacility?.id,
        allowedServices: normalizeAllowedServices(template?.allowedServices),
      });
      setCurrentColor(template?.templateColor ?? '#6982F0');
    } else {
      setRecord({
        ...newAvailabilityTemplateCreateDTO,
        facilityId: selectedFacility?.id,
        departmentId: null,
        allowedServices: [],
        workingDays: [],
      });
      setCurrentColor('#6982F0');
    }
  }, [open, template]);

  // Effect 1 of 2 for department timing defaults (create mode only).
  // Fires when departmentId becomes null/undefined (user cleared the selection).
  // Resets timing fields to safe zero values so no stale values from the
  // previous department remain in the form.
  useEffect(() => {
    if (isEditMode || record?.departmentId) return;
    setRecord((prev: any) => ({
      ...prev,
      durationMinutes: 0,
      defaultBufferBeforeMinutes: 0,
      defaultBufferAfterMinutes: 0,
      parallelCapacityValue: 1,
    }));
  }, [record?.departmentId]);

  // Effect 2 of 2 for department timing defaults (create mode only).
  // Fires when the department's full data arrives from the API.
  // Applies the department's own default timing values to the form.
  // Kept separate from Effect 1 because selectedDepartmentFullObject is async —
  // it arrives after departmentId changes, in its own render cycle.
  useEffect(() => {
    if (isEditMode || !selectedDepartmentFullObject) return;
    setRecord((prev: any) => ({
      ...prev,
      durationMinutes: selectedDepartmentFullObject?.defaultDurationMinutes,
      defaultBufferBeforeMinutes: selectedDepartmentFullObject?.defaultBufferBeforeMinutes,
      defaultBufferAfterMinutes: selectedDepartmentFullObject?.defaultBufferAfterMinutes,
      parallelCapacityValue: Number(selectedDepartmentFullObject?.parallelCapacityValue ?? 1),
    }));
  }, [selectedDepartmentFullObject]);

  // Auto-fills working days using the dept → facility → org hierarchy (create mode only).
  // Runs whenever any of its data sources change so it reacts to:
  //   • the user picking a different department (record.departmentId changes)
  //   • the department full object arriving async (selectedDepartmentFullObject changes)
  //   • facility or org data loading for the first time
  //
  // Guards:
  //   • !open          → don't run when modal is closed
  //   • isEditMode     → don't overwrite an existing template's saved days
  //   • userChangedWorkingDaysRef → don't overwrite what the user manually picked
  //   • !dayOptions    → enum not loaded yet, normalizeWorkingDays would return nothing useful
  //   • !workingDays   → getWorkingDaysFromHierarchy returned null (dept data still loading)
  useEffect(() => {
    if (!open || isEditMode || userChangedWorkingDaysRef.current || !dayOptions?.length) return;
    const workingDays = getWorkingDaysFromHierarchy();
    if (!workingDays) return;
    setRecord((prev: any) => ({ ...prev, workingDays }));
  }, [open, selectedFacilityFullObject, facilityListResponse, selectedDepartmentFullObject, organizationDefinitions, record?.departmentId]);

  // Auto-fills allowed services from departmentServices after the user picks a department.
  // Runs on [departmentServices] so it fires as soon as the API response arrives.
  //
  // Guards:
  //   • !open                      → don't run when modal is closed
  //   • isEditMode                 → don't overwrite saved services
  //   • userChangedServicesRef     → don't overwrite what the user manually toggled
  //   • !record.departmentId       → no department selected yet
  //   • !hasChangedDepartmentRef   → only apply after a real department change, not on
  //                                  initial open (where the dept services from the
  //                                  previous session might still be cached in RTK)
  useEffect(() => {
    if (!open || isEditMode || userChangedServicesRef.current || !record?.departmentId || !hasChangedDepartmentRef.current) return;
    const services = Array.isArray(departmentServices)
      ? departmentServices
          .map((s: any) => s?.service)
          .filter((v: any) => typeof v === 'string' && v.length > 0)
          .map(service => ({ id: null, service }))
      : [];
    if (services.length === 0) return;
    setRecord((prev: any) => ({ ...prev, allowedServices: services }));
  }, [departmentServices]);

  useEffect(() => {
    if (!record?.facilityId) return;
    resetDepartments();
    loadDepartments(record.facilityId, 0);
  }, [record?.facilityId]);

  useEffect(() => {
    if (!record?.departmentId) return;
    resetServices();
    loadServices(record.departmentId, 0);
  }, [record?.departmentId]);

  useEffect(() => {
    if (!record?.departmentId) return;
    resetPractitioners();
    loadPractitioners(record.departmentId, 0);
  }, [record?.departmentId]);

  // ─── Form ─────────────────────────────────────────────────────────────────────
  const formContent = () => (
    <div className="availability-template-modal">
      <Row>
        <Col md={12}>
          <SectionContainer
            title="Basic Information"
            content={
              <Form fluid>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="templateName" fieldType="text" record={record} setRecord={setRecord} width="100%" required />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="status" fieldType="select" fieldLabel="Status" record={record} setRecord={setRecord} width="100%" isEnum selectData={statusEnum ?? []} selectDataLabel="label" selectDataValue="value" disabled />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput column fieldLabel="Facility" selectData={facilityListResponse ?? []} fieldType="select" selectDataLabel="name" selectDataValue="id" fieldName="facilityId" record={record} setRecord={setRecord} width="100%" required disabled />
                  </Col>
                  <Col md={12}>
                    <MyInput
                      width="100%"
                      fieldName="departmentId"
                      fieldLabel="Department"
                      fieldType="selectPagination"
                      selectData={departmentOptions}
                      selectDataLabel="label"
                      selectDataValue="value"
                      record={record}
                      setRecord={handleDepartmentChange}
                      loading={isDeptLoading}
                      hasMore={deptHasMore}
                      onFetchMore={async () => {
                        if (!deptNextLink || !record?.facilityId) return;
                        const { page } = extractPaginationFromLink(deptNextLink);
                        await loadDepartments(record.facilityId, page, true);
                      }}
                      menuMaxHeight={200}
                      disabled={record?.id}
                      required
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="templateType" record={record} setRecord={setRecord} fieldType="select" selectData={templateTypeEnum ?? []} selectDataLabel="label" selectDataValue="value" width="100%" disabled required />
                  </Col>
                  <div className="block">
                    <Translate>Color</Translate>
                    <div className="color-picker-row">
                      <input
                        type="color"
                        value={currentColor}
                        onChange={e => {
                          setCurrentColor(e.target.value);
                          setRecord((prev: any) => ({ ...prev, templateColor: e.target.value }));
                        }}
                      />
                    </div>
                  </div>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="durationMinutes" fieldLabel="duration" fieldType="number" record={record} setRecord={setRecord} width="100%" rightAddon="min" />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="parallelCapacityValue" fieldLabel="Parallel Capacity Value" fieldType="number" record={record} setRecord={setRecord} width="100%" min={1} />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="defaultBufferBeforeMinutes" fieldLabel="Slot Before" fieldType="number" record={record} setRecord={setRecord} width="100%" />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldLabel="Slot After" fieldName="defaultBufferAfterMinutes" fieldType="number" record={record} setRecord={setRecord} width="100%" />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="versionNo" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled />
                  </Col>
                  <Col md={12}>
                    <MyInput width="100%" fieldType="check" fieldName="requireConfirmation" record={record} setRecord={setRecord} showLabel={false} />
                  </Col>
                </Row>
              </Form>
            }
          />
        </Col>

        <Col md={12}>
          <SectionContainer
            title="Department Details"
            content={
              <Form fluid>
                <MyInput
                  key={`service-${record?.departmentId}`}
                  width="100%"
                  fieldType="selectPagination"
                  fieldLabel="Default Service"
                  fieldName="defaultServiceId"
                  selectData={serviceOptions}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={record}
                  setRecord={setRecord}
                  loading={isServiceLoading}
                  hasMore={serviceHasMore}
                  onFetchMore={async () => {
                    if (!serviceNextLink) return;
                    const { page } = extractPaginationFromLink(serviceNextLink);
                    await loadServices(record.departmentId, page, true);
                  }}
                />
                <MyInput width="100%" fieldType="number" fieldLabel="Number Of Resources" fieldName="numberOfResourcesExpected" record={record} setRecord={setRecord} />
                <Row>
                  <Col md={12}>
                    <MyInput width="100%" fieldType="check" fieldName="requirePractitioner" record={record} setRecord={setRecord} showLabel={false} />
                  </Col>
                  {record['requirePractitioner'] && (
                    <Col md={12}>
                      <MyInput
                        key={`practitioner-${record?.departmentId}`}
                        width="100%"
                        fieldType="selectPagination"
                        fieldLabel="Default Practitioner"
                        fieldName="defaultPractitionerId"
                        selectData={practitionerOptions}
                        selectDataLabel="label"
                        selectDataValue="value"
                        record={record}
                        setRecord={setRecord}
                        loading={isPractitionerLoading}
                        hasMore={practitionerHasMore}
                        onFetchMore={async () => {
                          if (!practitionerNextLink) return;
                          const { page } = extractPaginationFromLink(practitionerNextLink);
                          await loadPractitioners(record.departmentId, page, true);
                        }}
                      />
                    </Col>
                  )}
                </Row>
                <MyInput width="100%" fieldType="check" fieldName="requirePreAssessment" record={record} setRecord={setRecord} showLabel={false} />
              </Form>
            }
          />
        </Col>
      </Row>

      <Row>
        <Col md={24}>
          <SectionContainer
            title="Services Allowed"
            content={
              <Form fluid>
                <Row>
                  {encounterReasonEnum.map((service: any) => {
                    const fieldName = `service_${service.value}`;
                    return (
                      <Col md={8} key={service.value}>
                        <MyInput
                          width="100%"
                          fieldType="check"
                          fieldName={fieldName}
                          record={{ [fieldName]: selectedServiceValues.includes(service.value) }}
                          setRecord={(next: any) => toggleAllowedService(service.value, Boolean(next[fieldName]))}
                          showLabel={false}
                          fieldLabel={service.label}
                        />
                      </Col>
                    );
                  })}
                </Row>
              </Form>
            }
          />
        </Col>
      </Row>

      <SectionContainer
        title="Days"
        content={
          <Form fluid layout="inline">
            {dayOptions.map(day => (
              <MyInput
                key={day.value}
                width="13vw"
                fieldName={day.value}
                fieldType="check"
                record={workingDaysRecord}
                setRecord={setWorkingDaysRecord}
                label={formatEnumString(day.value)}
                showLabel={false}
              />
            ))}
          </Form>
        }
      />
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      actionButtonFunction={handleSave}
      title={template?.id ? <Translate>Edit Availability Template</Translate> : <Translate>New Availability Template</Translate>}
      size="70vw"
      content={formContent}
    />
  );
};

export default AddEditAvailabilityTemplate;
