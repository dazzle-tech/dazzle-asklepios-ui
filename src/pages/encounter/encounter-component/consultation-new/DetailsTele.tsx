import React, { useState } from 'react';
import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import MyInput from '@/components/MyInput';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import { Form } from 'rsuite';
import { useSaveConsultationOrdersMutation } from '@/services/encounterService';
import { newApConsultationOrder } from '@/types/model-types-constructor';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import clsx from 'clsx';

const DetailsTele = ({
  patient,
  encounter,
  consultationOrders,
  setConsultationOrder,
  open,
  setOpen,
  refetchCon,
  editing,
  edit
}) => {
  const dispatch = useAppDispatch();
  const [saveconsultationOrders, saveConsultationOrdersMutation] =
    useSaveConsultationOrdersMutation();

  const handleOpenAttachmentModal = () => {
    console.log('Tele-consultation order for attachment:', consultationOrders);
    setShowAttachmentModal(true);
  };

  const handleClear = async () => {
    setConsultationOrder({
      ...newApConsultationOrder,
      consultationMethodLkey: null,
      consultationTypeLkey: null,
      cityLkey: null,
      consultantSpecialtyLkey: null,
      preferredConsultantKey: null
    });
  };
  const handleSave = async () => {
    try {
      await saveconsultationOrders({
        ...consultationOrders,
        patientKey: patient.key,
        visitKey: encounter.key,
        statusLkey: '164797574082125',
        createdBy: 'Admin'
      }).unwrap();
      dispatch(notify({ msg: 'saved  Successfully', sev: 'success' }));
      refetchCon()
        .then(() => {
          setOpen(false);
          handleClear();
        })
        .catch(error => {
          console.error('Refetch failed:', error);
        });
    } catch (error) {
      dispatch(notify('Save Failed'));
    }
  };

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  return (
    <>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        size="50vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <MyButton
            disabled={edit}
            prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
            onClick={handleClear}
          >
            Clear
          </MyButton>
        }
        rightTitle="Add Consultation"
        rightContent={
          <Form
            fluid
            className={clsx('', {
              'disabled-panel': edit
            })}
          >
            <div className="main-details-consultion-page-container">
              <div className="consultion-details-modal-handle-position">
                <MyInput
                  width={'12vw'}
                  fieldName="physician"
                  fieldLabel="Physician"
                  fieldType="text"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
                <MyInput
                  width={'12vw'}
                  fieldName="callDateTime"
                  fieldLabel="Call Date/Time"
                  fieldType="datetime"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
                <MyInput
                  width={'24vw'}
                  disabled={editing}
                  fieldName="consultationContent"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
                <MyInput
                  width={'12vw'}
                  disabled={editing}
                  fieldType="text"
                  fieldLabel="Approval Number"
                  fieldName="approvalNumber"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
                <div className="attachment-button-consultation-position">
                  <MyButton
                    className="my-button-for-attachment-modal"
                    onClick={handleOpenAttachmentModal}
                    disabled={!consultationOrders?.key}
                  >
                    <FontAwesomeIcon icon={faPaperclip} />
                    Attachments
                  </MyButton>
                </div>
              </div>
              <div className="text-area-positions-detail-consultion">
                <MyInput
                  width={'12vw'}
                  disabled={editing}
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
                <MyInput
                  width={'12vw'}
                  disabled={editing}
                  fieldName="extra documentation"
                  rows={6}
                  fieldType="textarea"
                  record={consultationOrders}
                  setRecord={setConsultationOrder}
                />
              </div>
            </div>
          </Form>
        }
        leftContent={<Diagnosis patient={patient} encounter={encounter} />}
      ></AdvancedModal>

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.id || encounter?.key}
        refetchData={() => {}}
        source="TELE_CONSULTATION_ORDER_ATTACHMENT"
        sourceId={consultationOrders?.key ? Number(consultationOrders.key) : 0}
      />
    </>
  );
};
export default DetailsTele;
