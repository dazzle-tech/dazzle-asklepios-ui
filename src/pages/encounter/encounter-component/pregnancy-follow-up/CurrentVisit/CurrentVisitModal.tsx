// Import required modules and components
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './style.less';

// Define the shape of a visit record
interface VisitRecord {
  date: string;
  weeks: number;
  weight: number | null;
  bloodPressure: string;
  heightOfUterus: number | null;
  bloodGlucose: number | null;
  urineDipstick: string;
  fetalHeartRate: number | null;
}

// Props for the modal component
interface CurrentVisitModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSave?: (record: VisitRecord) => void; // Optional save callback
  lmp: Date; // Last menstrual period
}

// Calculate gestational age (weeks) based on LMP and current date
const calculateWeeks = (lmpDate: Date, currentDate: Date) => {
  const diffMs = currentDate.getTime() - lmpDate.getTime();
  const diffWeeks = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
  return diffWeeks >= 0 ? diffWeeks : 0;
};

const CurrentVisitModal: React.FC<CurrentVisitModalProps> = ({ open, setOpen, onSave, lmp }) => {
  // State to store form data
  const [record, setRecord] = useState<VisitRecord>({
    date: new Date().toLocaleDateString(), // Default: today's date
    weeks: calculateWeeks(lmp, new Date()), // Calculate weeks from LMP
    weight: null,
    bloodPressure: '',
    heightOfUterus: null,
    bloodGlucose: null,
    urineDipstick: '',
    fetalHeartRate: null,
  });

  // Reset form when modal opens or LMP changes
  useEffect(() => {
    if (open) {
      setRecord({
        date: new Date().toLocaleDateString(),
        weeks: calculateWeeks(lmp, new Date()),
        weight: null,
        bloodPressure: '',
        heightOfUterus: null,
        bloodGlucose: null,
        urineDipstick: '',
        fetalHeartRate: null,
      });
    }
  }, [open, lmp]);

  // Handle save button click
  const handleSave = () => {
    if (onSave) {
      onSave(record);
    }
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add New Pregnancy Follow-up"
      steps={[{ title: 'Current Visit', icon: <FontAwesomeIcon icon={faEye} /> }]}
      size="33vw"
      position="right"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="visit-modal-form">
          <div className='main-container-coulmn-position'>

            {/* Date & Weeks (read-only) */}
            <div className='each-two-rows-position'>
              <MyInput
                width={'13vw'}
                fieldName="date"
                fieldType="text"
                fieldLabel="Date"
                record={record}
                setRecord={setRecord}
                disabled
              />
              <MyInput
                width={'13vw'}
                fieldName="weeks"
                fieldType="text"
                fieldLabel="Weeks"
                record={record}
                setRecord={setRecord}
                disabled
              />
            </div>

            {/* Weight & Blood Pressure */}
            <div className='each-two-rows-position'>
              <MyInput
                width={'10vw'}
                fieldName="weight"
                fieldType="number"
                fieldLabel="Weight"
                rightAddon="kg"
                record={record}
                setRecord={setRecord}
                min={0}
                step={0.1}
              />
              <MyInput
                width={'13vw'}
                fieldName="bloodPressure"
                fieldType="text"
                fieldLabel="Blood Pressure"
                placeholder="Enter blood pressure"
                record={record}
                setRecord={setRecord}
              />
            </div>

            {/* Height of Uterus & Blood Glucose */}
            <div className='each-two-rows-position'>
              <MyInput
                width={'10vw'}
                fieldName="heightOfUterus"
                fieldType="number"
                fieldLabel="Height of Uterus"
                rightAddon="cm"
                record={record}
                setRecord={setRecord}
                min={0}
                step={0.1}
              />
              <MyInput
                width={'10vw'}
                fieldName="bloodGlucose"
                fieldType="number"
                fieldLabel="Blood Glucose"
                rightAddon="mg"
                record={record}
                setRecord={setRecord}
                min={0}
                step={1}
              />
            </div>

            {/* Urine Dipstick & Fetal Heart Rate */}
            <div className='each-two-rows-position'>
              <MyInput
                width={'13vw'}
                fieldName="urineDipstick"
                fieldType="text"
                fieldLabel="Urine Dipstick"
                record={record}
                setRecord={setRecord}
              />
              <MyInput
                width={'10vw'}
                fieldName="fetalHeartRate"
                fieldType="number"
                fieldLabel="Fetal Heart Rate"
                rightAddon="bpm"
                record={record}
                setRecord={setRecord}
                min={0}
                step={1}
              />
            </div>

          </div>
        </Form>
      }
    />
  );
};

export default CurrentVisitModal;
