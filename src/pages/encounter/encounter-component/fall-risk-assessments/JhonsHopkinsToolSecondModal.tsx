import React from 'react';
import { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import { Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { Checkbox } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import AttachmentModal from '@/components/AttachmentUploadModal/AttachmentUploadModal';
import { faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const JhonsHopkinsToolSecondModal = ({
  open,
  setOpen
}: {
  open: boolean;
  setOpen: (val: boolean) => void;
}) => {
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const ModalContent = (
    <>
      <Form fluid>
        <Row>
          <div className="full-inputs-jhons-hopkins-tool">
            <div className="input-section-jhons-hopkins">
              <Checkbox>Fall-risk wristband applied</Checkbox>

              <Checkbox>Bed in low position</Checkbox>

              <Checkbox>Bed alarms enabled</Checkbox>
              <Checkbox>2-hour rounding</Checkbox>

              <Checkbox>Non-skid footwear</Checkbox>

              <Checkbox>Assistive device provided</Checkbox>
            </div>

            <div className="input-section-jhons-hopkins">
              <MyInput
                width={200}
                column
                fieldLabel="Assessment Notes"
                fieldName="text"
                record={''}
                disabled={false}
                className="search-input"
              />
              <MyButton
                onClick={() => {
                  setShowAttachmentModal(true);
                }}
              ><FontAwesomeIcon icon={faPaperclip} />
                Attachments
              </MyButton>

              <MyInput
                width={'100%'}
                fieldLabel="Next Assessment Due"
                fieldType="date"
                fieldName="key0"
                record={''}
                setRecord={''}
              />
            </div>
          </div>
        </Row>
      </Form>
    </>
  );

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Second Modal"
        steps={[{ title: 'Fall Prevention Plan Triggered' }]}
        size="30vw"
        position="right"
        actionButtonLabel="Save"
        content={ModalContent}
      />

      <AttachmentModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        selectedPatientAttacment={null}
        setSelectedPatientAttacment={() => null}
      />
    </>
  );
};

export default JhonsHopkinsToolSecondModal;
