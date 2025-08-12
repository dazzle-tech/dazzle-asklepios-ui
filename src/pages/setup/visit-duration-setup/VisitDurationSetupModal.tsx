import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService'; // Hook to get LOV values
import './style.less';

interface VisitDurationSetupModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  mode: 'add' | 'edit';
  record?: any;
}

const VisitDurationSetupModal: React.FC<VisitDurationSetupModalProps> = ({
  open,
  setOpen,
  mode,
  record: initialRecord
}) => {
  const [formRecord, setFormRecord] = useState<any>({});

  // Get visit type LOV options
  const { data: visitTypeLovData } = useGetLovValuesByCodeQuery('BOOK_VISIT_TYPE');
  const visitTypeOptions = visitTypeLovData?.object || [];

  // Get resource type LOV options
  const { data: resourceTypeLovData } = useGetLovValuesByCodeQuery('BOOK_RESOURCE_TYPE');
  const resourceTypeOptions = resourceTypeLovData?.object || [];

  // Static resource list for each type (can be dynamic later)
  const resourcesByType: Record<string, { label: string; value: string }[]> = {
    Practitioner: [
      { label: 'Dr. Ahmad', value: 'Dr. Ahmad' },
      { label: 'Dr. Farouk', value: 'Dr. Farouk' }
    ],
    Nurse: [
      { label: 'Nurse Lina', value: 'Nurse Lina' },
      { label: 'Nurse Sara', value: 'Nurse Sara' }
    ],
    Therapist: [{ label: 'Therapist Ali', value: 'Therapist Ali' }]
  };

  // Get resources list based on selected resource type
  const resourceOptions = formRecord.resourceType
    ? resourcesByType[formRecord.resourceType] || []
    : [];

  // Fill form in edit mode, reset in add mode
  useEffect(() => {
    if (mode === 'edit' && initialRecord) {
      setFormRecord({
        visitType: initialRecord.visitType || '',
        duration: initialRecord.duration || '',
        resourceSpecific: initialRecord.resourceSpecific || false,
        resourceType: initialRecord.resourceType || '',
        resource: initialRecord.resource || '',
        status: initialRecord.status || 'Active'
      });
    } else {
      setFormRecord({});
    }
  }, [mode, initialRecord]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Visit Duration Setup"
      steps={[
        { title: 'Visit Duration Setup', icon: <FontAwesomeIcon icon={faEye} /> }
      ]}
      size="33vw"
      position="right"
      actionButtonLabel="Save"
      content={
        <Form fluid layout="vertical" className="visit-duration-modal-form">
          {/* Visit Type & Duration fields */}
          <div className="top-row">
            <MyInput
              width="13vw"
              fieldName="visitType"
              fieldType="select"
              selectData={visitTypeOptions}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Visit Type"
              required
            />

            <MyInput
              width="10vw"
              fieldName="duration"
              fieldType="number"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Duration"
              placeholder="Enter duration"
              rightAddon="Min"
              required
            />
          </div>

          {/* Checkbox for resource-specific */}
          <div className="middle-row">
            <MyInput
              width="13vw"
              fieldName="resourceSpecific"
              fieldType="check"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Resource Specific"
              showLabel={false}
            />
          </div>

          {/* Resource type & resource fields (only if resource specific) */}
          {formRecord.resourceSpecific && (
            <div className="bottom-row">
              <MyInput
                width="13vw"
                fieldName="resourceType"
                fieldType="select"
                selectData={resourceTypeOptions}
                selectDataLabel="lovDisplayVale"
                selectDataValue="valueCode"
                record={formRecord}
                setRecord={setFormRecord}
                fieldLabel="Resource Type"
                required
              />

              <MyInput
                width="13vw"
                fieldName="resource"
                fieldType="select"
                selectData={resourceOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={formRecord}
                setRecord={setFormRecord}
                fieldLabel="Resource"
                required
                disabled={resourceOptions.length === 0}
              />
            </div>
          )}
        </Form>
      }
    />
  );
};

export default VisitDurationSetupModal;
