import React, { useState, useEffect } from 'react';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyModal from '@/components/MyModal/MyModal';
import { faFileLines, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import './styles.less';

const EditProgressNotes = ({ open, setOpen, progressNotesObj }) => {
  const [progressNotes, setProgressNotes] = useState<any>({});
  const [showMoreFields, setShowMoreFields] = useState(false);

  // Handle Save Progress Notes
  const handleSave = async () => {
    try {
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
      createdAt: '',
      noteType: '',
      noteCategory: '',
      notePriority: '',
      noteStatus: '',
      noteContent: '',
      noteSummary: '',
      isConfidential: false
    });
  };

  // Effects
  useEffect(() => {
    if (progressNotesObj) {
      setProgressNotes({ ...progressNotesObj });
    }
  }, [progressNotesObj]);

  useEffect(() => {
    if (!open) {
      handleClearField();
      setShowMoreFields(false);
    }
  }, [open]);

  // Modal Content
  const content = (
    <div>
      <Form fluid layout="inline">
        {/* Progress Notes field - on its own row */}
        <div className="progress-notes-field-row">
          <MyInput
            column
            width={400}
            fieldLabel="Progress Notes"
            fieldType="textarea"
            fieldName="ProgressNotes"
            record={progressNotes}
            setRecord={setProgressNotes}
            disabled={true}
            height={100}
          />
        </div>

        {/* More Fields Button - on its own row */}
        <div className="more-fields-button-row">
          <MyButton
            prefixIcon={() => (
              <FontAwesomeIcon icon={showMoreFields ? faChevronUp : faChevronDown} />
            )}
            onClick={() => setShowMoreFields(!showMoreFields)}
            color="var(--primary-blue)"
          >
            {showMoreFields ? 'Hide Details' : 'More'}
          </MyButton>
        </div>

        {/* Additional fields - shown only when showMoreFields is true */}
        {showMoreFields && (
          <div className="additional-fields-container">
            {/* First row - Job Role and Created By side by side */}
            <div className="fields-row">
              <MyInput
                column
                width={200}
                fieldLabel="Job Role"
                fieldType="text"
                fieldName="JobRole"
                record={progressNotes}
                setRecord={setProgressNotes}
                disabled={true}
              />
              <MyInput
                column
                width={200}
                fieldLabel="Created By"
                fieldType="text"
                fieldName="createdBy"
                record={progressNotes}
                setRecord={setProgressNotes}
                disabled={true}
              />
            </div>

            {/* Second row - Created At on its own */}
            <MyInput
              column
              width={200}
              fieldLabel="Created At"
              fieldType="datetime-local"
              fieldName="createdAt"
              record={progressNotes}
              setRecord={setProgressNotes}
              disabled={true}
            />
          </div>
        )}
      </Form>
    </div>
  );

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="View Progress Notes"
      actionButtonFunction={handleSave}
      position="right"
      isDisabledActionBtn={false}
      size="32vw"
      steps={[
        {
          title: 'Progress Notes Details',
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

export default EditProgressNotes;
