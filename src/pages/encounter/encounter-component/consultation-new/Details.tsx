import React, { useState, useEffect } from 'react';
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
import { faBroom, faFile, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import { useGetLovValuesByCodeQuery, useGetPractitionersQuery } from '@/services/setupService';
import { AttachmentUploadModal } from '@/components/AttachmentModals';
import { initialListRequest, ListRequest } from '@/types/types';
import clsx from 'clsx';
import SectionContainer from '@/components/SectionsoContainer';

const Details = ({
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

  const { data: practitionerListResponse } = useGetPractitionersQuery({ ...initialListRequest });
  const { data: consultantSpecialtyLovQueryResponse } =
    useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY ');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeQuery('CITY');
  const { data: consultationMethodLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_METHOD');
  const { data: consultationTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CONSULT_TYPE');
  const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');

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
        size="75vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <div style={{ display: 'flex', flexDirection: 'row', gap: '5px' }}>
            <MyButton
              disabled={edit}
              prefixIcon={() => <FontAwesomeIcon icon={faBroom} />}
              onClick={handleClear}
            >
              Clear
            </MyButton>
            <MyButton
              onClick={() => setShowAttachmentModal(true)}
              prefixIcon={() => <FontAwesomeIcon icon={faPaperclip} />}
            >
              Attachments
            </MyButton>
          </div>
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
              <SectionContainer
                title={'Choose Consultant'}
                content={
                  <div className="consultion-details-modal-handle-position">

                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="City"
                      selectData={cityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'cityLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />

                    <MyInput
                      disabled={editing}
                      width={'12vw'}
                      fieldType="select"
                      fieldLabel="Consultant Specialty"
                      selectData={consultantSpecialtyLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultantSpecialtyLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Preferred Consultant"
                      fieldName={'preferredConsultantKey'}
                      selectData={practitionerListResponse?.object ?? []}
                      selectDataLabel="practitionerFullName"
                      selectDataValue="key"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                  </div>
                }
              ></SectionContainer>
              <SectionContainer
                title={'Details'}
                content={
                  <div className="consultion-details-modal-handle-position">
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Consultation Method"
                      selectData={consultationMethodLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationMethodLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      searchable={false}
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Consultation Type"
                      selectData={consultationTypeLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      fieldName={'consultationTypeLkey'}
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                      searchable={false}
                    />
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="select"
                      fieldLabel="Priority Level"
                      fieldName="priorityLkey"
                      selectData={orderPriorityLovQueryResponse?.object ?? []}
                      selectDataLabel="lovDisplayVale"
                      selectDataValue="key"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                  </div>
                }
              ></SectionContainer>
              <SectionContainer
                title={'Question to Consultant'}
                content={
                  <div className="text-area-positions-detail-consultion">
                    <MyInput
                      width={'35vw'}
                      disabled={editing}
                      fieldName="consultationContent"
                      rows={6}
                      fieldType="textarea"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                  </div>
                }
              ></SectionContainer>
              <SectionContainer
                title={'Notes & Documentation'}
                content={
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
                    <MyInput
                      width={'12vw'}
                      disabled={editing}
                      fieldType="text"
                      fieldLabel="Approval Number"
                      fieldName="approvalNumber"
                      record={consultationOrders}
                      setRecord={setConsultationOrder}
                    />
                  </div>
                }
              ></SectionContainer>
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
        source="CONSULTATION_ORDER_ATTACHMENT"
      />
    </>
  );
};
export default Details;
