import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { faFileLines } from '@fortawesome/free-solid-svg-icons';
import './styles.less';

const AddProgressNotes = ({ open, setOpen }) => {
  const [progressNotes, setProgressNotes] = useState<any>({});

  // Handle Save Progress Notes
  const handleSave = async () => {
    try {
      // Add validation here if needed
      console.log('Saving new progress note:', progressNotes);
      setOpen(false);
      handleClearField();
    } catch (error) {
      console.error('Error saving Progress Notes:', error);
    }
  };

  // Handle Clear Fields
  const handleClearField = () => {
    setProgressNotes({
      ProgressNotes: '',
      JobRole: '',
      createdBy: '',
      createdAt: ''
    });
  };

  // Effects
  useEffect(() => {
    if (!open) {
      handleClearField();
    }
  }, [open]);

  // Modal Content
  const content = (
    <div>
      <Form fluid layout="inline">
        <MyInput
          column
          width={512}
          fieldLabel="Progress Notes"
          fieldType="textarea"
          fieldName="ProgressNotes"
          record={progressNotes}
          setRecord={setProgressNotes}
          required
          height={100}
        />
      </Form>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Add New Progress Notes"
      actionButtonFunction={handleSave}
      position="right"
      isDisabledActionBtn={false}
      size="32vw"
      steps={[
        {
          title: 'Add Progress Notes',
          icon: <FontAwesomeIcon icon={faFileLines} />,
          footer: (
            <MyButton appearance="ghost" onClick={handleClearField}>
              Clear
            </MyButton>
          )
        }
      ]}
      content={content}
    ></MyModal>
  );
};

export default AddProgressNotes;
