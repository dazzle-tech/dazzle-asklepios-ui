// Import necessary modules and components
import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPersonPregnant } from '@fortawesome/free-solid-svg-icons';
import './Style.less';

// Define the shape of the form data
interface StartNewPregnancyData {
  lmp: string;
  dueDate: string;
  gravida: number | null;
  para: number | null;
  abortion: number | null;
  numberOfEmbryo: number | null;
}

// Define props expected by the modal
interface StartNewPregnancyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSave?: (data: StartNewPregnancyData) => void;
}

// Helper function to calculate due date (280 days after LMP)
const calculateDueDate = (lmp: string): string => {
  if (!lmp) return '';
  const lmpDate = new Date(lmp);
  lmpDate.setDate(lmpDate.getDate() + 280); // add 40 weeks
  return lmpDate.toISOString().split('T')[0]; // format as YYYY-MM-DD
};

const StartNewPregnancyModal: React.FC<StartNewPregnancyModalProps> = ({
  open,
  setOpen,
  onSave
}) => {
  // Local state for form values
  const [data, setData] = useState<StartNewPregnancyData>({
    lmp: '',
    dueDate: '',
    gravida: null,
    para: null,
    abortion: null,
    numberOfEmbryo: null
  });

  // Automatically calculate due date when LMP changes
  useEffect(() => {
    const due = calculateDueDate(data.lmp);
    setData(prev => ({ ...prev, dueDate: due }));
  }, [data.lmp]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setData({
        lmp: '',
        dueDate: '',
        gravida: null,
        para: null,
        abortion: null,
        numberOfEmbryo: null
      });
    }
  }, [open]);

  // Handle saving the form
  const handleSave = () => {
    if (onSave) {
      onSave(data);
    }
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Start New Pregnancy"
      size="30vw"
      position="right"
      actionButtonLabel="Save"
        steps={[{ title: 'Start New Pregnancy',icon:<FontAwesomeIcon icon={faPersonPregnant}/> }]}
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="start-new-pregnancy-form">
          {/* LMP input */}
          <MyInput
            width="25vw"
            fieldName="lmp"
            fieldType="date"
            fieldLabel="LMP"
            record={data}
            setRecord={setData}
          />

          {/* Due date input (calculated automatically, read-only) */}
          <MyInput
            width="25vw"
            fieldName="dueDate"
            fieldType="date"
            fieldLabel="Due Date"
            record={data}
            setRecord={setData}
            disabled
          />

          {/* Gravida / Para / Abortion inputs */}
          <div className="third-inputs-row-form">
            <MyInput
              width="7vw"
              fieldName="gravida"
              fieldType="number"
              fieldLabel="Gravida"
              record={data}
              setRecord={setData}
              min={0}
            />

            <MyInput
              width="7vw"
              fieldName="para"
              fieldType="number"
              fieldLabel="Para"
              record={data}
              setRecord={setData}
              min={0}
            />

            <MyInput
              width="7vw"
              fieldName="abortion"
              fieldType="number"
              fieldLabel="Abortion"
              record={data}
              setRecord={setData}
              min={0}
            />
          </div>

          {/* Number of embryo input */}
          <MyInput
            width="25vw"
            fieldName="numberOfEmbryo"
            fieldType="number"
            fieldLabel="Number of Embryo"
            record={data}
            setRecord={setData}
            min={1}
          />
        </Form>
      }
    />
  );
};

export default StartNewPregnancyModal;
