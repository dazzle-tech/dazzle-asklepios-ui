import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './style.less';

// Props interface for the modal
interface VisitDurationSetupModalProps {
  open: boolean;// Modal visibility
  setOpen: (open: boolean) => void; // Function to toggle modal
  mode: 'add' | 'edit';// Determines whether we are adding or editing
  record?: any;// The record to edit (optional)
}

const VisitDurationSetupModal: React.FC<VisitDurationSetupModalProps> = ({
  open,
  setOpen,
  mode,
  record: initialRecord
}) => {
  // State to hold form values
  const [formRecord, setFormRecord] = useState<any>({});

  // Visit Type options (dropdown)
  const visitTypeLov = [
    { label: 'Outpatient', value: 'Outpatient' },
    { label: 'Inpatient', value: 'Inpatient' },
    { label: 'Emergency', value: 'Emergency' }
  ];

  // Resource Type options (dropdown)
  const resourceTypeLov = [
    { label: 'Doctor', value: 'Doctor' },
    { label: 'Nurse', value: 'Nurse' },
    { label: 'Therapist', value: 'Therapist' }
  ];

  // Resource options mapped by resource type
  const resourcesByType: Record<string, { label: string; value: string }[]> = {
    Doctor: [
      { label: 'Dr. Ahmad', value: 'Dr. Ahmad' },
      { label: 'Dr. Farouk', value: 'Dr. Farouk' }
    ],
    Nurse: [
      { label: 'Nurse Lina', value: 'Nurse Lina' },
      { label: 'Nurse Sara', value: 'Nurse Sara' }
    ],
    Therapist: [{ label: 'Therapist Ali', value: 'Therapist Ali' }]
  };

  // Compute resource options based on selected resource type
  const resourceOptions = formRecord.resourceType
    ? resourcesByType[formRecord.resourceType] || []
    : [];

  // Reset or populate form depending on mode (add or edit)
  useEffect(() => {
    if (mode === 'edit' && initialRecord) {
      // Populate form with existing values
      setFormRecord({
        visitType: initialRecord.visitType || '',
        duration: initialRecord.duration || '',
        resourceSpecific: initialRecord.resourceSpecific || false,
        resourceType: initialRecord.resourceType || '',
        resource: initialRecord.resource || '',
        status: initialRecord.status || 'Active'
      });
    } else {
      // Reset form for "add" mode
      setFormRecord({});
    }
  }, [mode, initialRecord]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Visit Duration Setup"
      steps={[
        {
          title: 'Visit Duration Setup',
          icon: <FontAwesomeIcon icon={faEye} />
        }
      ]}
      size="33vw"
      position="right"
      actionButtonLabel="Save"
      content={
        <Form fluid layout="vertical" className="visit-duration-modal-form">
          {/* Top section: Visit Type & Duration */}
          <div className="top-row">
            <MyInput
              width={'13vw'}
              fieldName="visitType"
              fieldType="select"
              selectData={visitTypeLov}
              selectDataLabel="label"
              selectDataValue="value"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Visit Type"
              required
            />

            <MyInput
              width={'10vw'}
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

          {/* Middle section: Resource Specific (checkbox) */}
          <div className="middle-row">
            <MyInput
              width={'13vw'}
              fieldName="resourceSpecific"
              fieldType="check"
              record={formRecord}
              setRecord={setFormRecord}
              fieldLabel="Resource Specific"
              showLabel={false}
            />
          </div>

          {/* Bottom section: Conditional rendering based on resourceSpecific */}
          {formRecord.resourceSpecific && (
            <div className="bottom-row">
              <MyInput
                width={'13vw'}
                fieldName="resourceType"
                fieldType="select"
                selectData={resourceTypeLov}
                selectDataLabel="label"
                selectDataValue="value"
                record={formRecord}
                setRecord={setFormRecord}
                fieldLabel="Resource Type"
                required
              />

              <MyInput
                width={'13vw'}
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
