import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import { FaPlus } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTab from '@/components/MyTab';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useEnumOptions } from '@/services/enumsApi';
import { useGetAvailabilityTemplatesByParentTemplateIdQuery } from '@/services/appointment/availabilityTemplateService';
import { formatEnumString } from '@/utils';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import AvailabilityDayGrid from './AvailabilityDayGrid';
import AddResourceModal from './AddResourceModal';
import PreviewSlotsModal from './PreviewSlotsModal';

type Props = {
  open: boolean;
  setOpen: (open: boolean) => void;
  template: AvailabilityTemplateResponseVM;
};

const TemplateScheduleModal: React.FC<Props> = ({ open, setOpen, template }) => {
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  // ─── State ───────────────────────────────────────────────────────────────────
  const [openPreviewSlots, setOpenPreviewSlots] = useState(false);
  const [openAddResource, setOpenAddResource] = useState(false);
  const [resourceToEdit, setResourceToEdit] = useState<any>(null);

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: childTemplates } = useGetAvailabilityTemplatesByParentTemplateIdQuery(
    { parentTemplateId: template?.id },
    { skip: !template?.id }
  );

  // ─── Enums ───────────────────────────────────────────────────────────────────
  const dayOptions = useEnumOptions('DayOfWeek');

  // ─── Computed ─────────────────────────────────────────────────────────────────
  const workingDaysRecord = useMemo(() => {
    const map: Record<string, boolean> = {};
    dayOptions.forEach(day => { map[day.value] = false; });
    (template?.workingDays ?? []).forEach((day: any) => {
      if (day?.dayOfWeek != null) map[day.dayOfWeek] = day.isWorking === true;
    });
    return map;
  }, [template?.workingDays, dayOptions]);

  const tabData = useMemo(() => dayOptions.map(day => ({
    title: formatEnumString(day.value),
    content: (
      <AvailabilityDayGrid
        dayInclude={workingDaysRecord[day.value]}
        parentTemplate={template}
        templates={childTemplates}
        day={day.value}
        onEditTemplate={t => {
          setResourceToEdit(t);
          setOpenAddResource(true);
        }}
      />
    ),
  })), [dayOptions, template, childTemplates, workingDaysRecord]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleCloseAddResource = (next: boolean) => {
    if (!next) setResourceToEdit(null);
    setOpenAddResource(next);
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) {
      setOpenAddResource(false);
      setOpenPreviewSlots(false);
      setResourceToEdit(null);
    }
  }, [open]);

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title={<Translate>Schedule — {template?.templateName}</Translate>}
        size="70vw"
        hideActionBtn
        content={() => (
          <div className="availability-template-modal">
            <SectionContainer
              title="Working Days"
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

            <div className="days-header">
              <MyTab data={tabData} lazy/>
              <div className="days-actions">
                <MyButton
                  appearance="subtle"
                  disabled={!template?.id}
                  onClick={() => setOpenPreviewSlots(true)}
                >
                  <Translate>Preview slots</Translate>
                </MyButton>
                <MyButton
                  onClick={() => { setResourceToEdit(null); setOpenAddResource(true); }}
                  prefixIcon={() => <FaPlus />}
                  disabled={!template?.id}
                >
                  Add Resource
                </MyButton>
              </div>
            </div>
          </div>
        )}
      />

      <PreviewSlotsModal
        open={openPreviewSlots}
        onClose={() => setOpenPreviewSlots(false)}
        templateName={template?.templateName ?? (template as any)?.name}
        step={template?.durationMinutes ?? (template as any)?.step}
        parentTemplate={template}
        templates={Array.isArray(childTemplates) ? childTemplates : (childTemplates as any)?.data}
      />

      <AddResourceModal
        open={openAddResource}
        setOpen={handleCloseAddResource}
        editRecord={resourceToEdit}
        mainTemplate={template}
        selectedFacility={selectedFacility}
      />
    </>
  );
};

export default TemplateScheduleModal;
