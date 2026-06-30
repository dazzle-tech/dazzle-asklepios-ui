import React, { useEffect, useMemo, useState } from 'react';
import { Divider, Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { useEnumOptions } from '@/services/enumsApi';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import {
  useGetAvailabilityTemplateQuery,
  useGetAvailabilityTemplatesByParentTemplateIdQuery,
} from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { normalizeAllowedServices } from './utils';
import { useTemplateFormOptions } from './useTemplateFormOptions';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';
import './styles.less';

type Props = {
  template: AvailabilityTemplateResponseVM;
};

const AvailabilityTemplateDetailsSection: React.FC<Props> = ({ template }) => {
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  // ─── State ───────────────────────────────────────────────────────────────────
  const [record, setRecord] = useState<any>({ ...newAvailabilityTemplateResponseVM });
  const [openPreviewSlots, setOpenPreviewSlots] = useState(false);
  const [openAddResource, setOpenAddResource] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<any>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
  const { data: templateById } = useGetAvailabilityTemplateQuery(
    { id: template?.id },
    { skip: !template?.id }
  );
  const { data: childTemplates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    { parentTemplateId: record?.id },
    { skip: !record?.id }
  );

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

  const tabData = useMemo(() => dayOptions.map(day => ({
    title: formatEnumString(day.value),
    content: (
      <AvailabilityDayGrid
        dayInclude={workingDaysRecord[day.value]}
        parentTemplate={record}
        templates={childTemplates}
        day={day.value}
        onEditTemplate={t => {
          setResourceToEdit(t);
          setOpenAddResource(true);
        }}
        readOnly
      />
    ),
  })), [dayOptions, record, childTemplates, workingDaysRecord]);

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    const source: any = templateById ?? template;
    if (source?.id) {
      setRecord({
        ...source,
        facilityId: selectedFacility?.id,
        allowedServices: normalizeAllowedServices(source?.allowedServices),
      });
    } else {
      setRecord({ ...newAvailabilityTemplateResponseVM, facilityId: selectedFacility?.id });
    }
  }, [template, templateById]);

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

  return (
    <div className="availability-template-modal">
      <Row className="availability-template-top-row">
        <Col md={12} className="availability-template-column--left">
          <SectionContainer
            title="Basic Information"
            content={
              <Form fluid>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="templateName" fieldType="text" record={record} setRecord={setRecord} width="100%" disabled />
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="status" fieldType="select" fieldLabel="Status" record={record} setRecord={setRecord} width="100%" isEnum selectData={statusEnum ?? []} selectDataLabel="label" selectDataValue="value" disabled />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput column fieldLabel="Facility" selectData={facilityListResponse ?? []} fieldType="select" selectDataLabel="name" selectDataValue="id" fieldName="facilityId" record={record} setRecord={setRecord} width="100%" disabled />
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
                      setRecord={setRecord}
                      loading={isDeptLoading}
                      hasMore={deptHasMore}
                      onFetchMore={async () => {
                        if (!deptNextLink || !record?.facilityId) return;
                        const { page } = extractPaginationFromLink(deptNextLink);
                        await loadDepartments(record.facilityId, page, true);
                      }}
                      menuMaxHeight={200}
                      disabled
                    />
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="templateType" record={record} setRecord={setRecord} fieldType="select" selectData={templateTypeEnum ?? []} selectDataLabel="label" selectDataValue="value" width="100%" disabled />
                  </Col>
                  <div className="block">
                    <Translate>Color</Translate>
                    <div className="color-picker-row">
                      <input disabled type="color" value={record?.templateColor ?? '#6982F0'} onChange={() => {}} />
                    </div>
                  </div>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="durationMinutes" fieldLabel="duration" fieldType="number" record={record} setRecord={setRecord} width="100%" rightAddon="min" disabled showZero/>
                  </Col>
                  <Col md={12}>
                    <MyInput fieldName="parallelCapacityValue" fieldLabel="Parallel Capacity Value" fieldType="number" record={record} setRecord={setRecord} width="100%" min={1} disabled showZero/>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="defaultBufferBeforeMinutes" fieldLabel="Slot Before" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled showZero/>
                  </Col>
                  <Col md={12}>
                    <MyInput fieldLabel="Slot After" fieldName="defaultBufferAfterMinutes" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled showZero/>
                  </Col>
                </Row>
                <Row>
                  <Col md={12}>
                    <MyInput fieldName="versionNo" fieldType="number" record={record} setRecord={setRecord} width="100%" disabled />
                  </Col>
                </Row>
              </Form>
            }
          />
        </Col>

        <Col md={12} className="availability-template-column--right">
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
                  disabled
                />
                <MyInput width="100%" fieldType="number" fieldLabel="Number Of Resources" fieldName="numberOfResourcesExpected" record={record} setRecord={setRecord} disabled />
                <Row>
                  <Col md={12}>
                    <MyInput width="100%" fieldType="check" fieldName="requirePractitioner" record={record} setRecord={setRecord} showLabel={false} disabled />
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
                        disabled
                      />
                    </Col>
                  )}
                </Row>
                <MyInput width="100%" fieldType="check" fieldName="requirePreAssessment" record={record} setRecord={setRecord} showLabel={false} disabled />
              </Form>
            }
          />
          <SectionContainer
            title="Appointment Details"
            content={
              <Form fluid>
                <MyInput width="100%" fieldType="check" fieldName="requireConfirmation" record={record} setRecord={setRecord} showLabel={false} disabled />
                <MyInput width="100%" fieldType="check" fieldName="allowWalkInBooking" record={record} setRecord={setRecord} showLabel={false} disabled />
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
                          disabled
                          width="100%"
                          fieldType="check"
                          fieldName={fieldName}
                          record={{ [fieldName]: selectedServiceValues.includes(service.value) }}
                          setRecord={() => {}}
                          showLabel={false}
                          label={service.label}
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
                disabled
                key={day.value}
                width="13vw"
                fieldName={day.value}
                fieldType="check"
                record={workingDaysRecord}
                setRecord={() => {}}
                label={day.label}
                showLabel={false}
              />
            ))}
          </Form>
        }
      />

      <Divider />

      <div className="days-header">
        <MyTab data={tabData} lazy/>
        <div className="days-actions">
          <MyButton appearance="subtle" disabled={!record?.id} onClick={() => setOpenPreviewSlots(true)}>
            <Translate>Preview slots</Translate>
          </MyButton>
        </div>
      </div>

      <PreviewSlotsModal
        open={openPreviewSlots}
        onClose={() => setOpenPreviewSlots(false)}
        templateName={record.templateName ?? record.name}
        step={record.durationMinutes ?? record.step}
        parentTemplate={record}
        templates={Array.isArray(childTemplates) ? childTemplates : (childTemplates as any)?.data}
      />

      <AddResourceModal
        open={openAddResource}
        setOpen={(next: boolean) => { if (!next) setResourceToEdit(null); setOpenAddResource(next); }}
        editRecord={resourceToEdit}
        mainTemplate={record}
        selectedFacility={selectedFacility}
        readOnly
      />
    </div>
  );
};

export default AvailabilityTemplateDetailsSection;
