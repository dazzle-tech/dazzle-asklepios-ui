import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom, faPaperclip } from '@fortawesome/free-solid-svg-icons';

import Diagnosis from '../../../medical-component/diagnosis/DiagnosisAndFindings';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import { AttachmentUploadModal } from '@/components/AttachmentModals';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';

import {
  useCreateMutation,
  useUpdateMutation
} from '@/services/patients/telephonicConsultationService';

import { newTelephonicConsultation, newPractitioner } from '@/types/model-types-constructor-new';

import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import { Practitioner, TelephonicConsultations } from '@/types/model-types-new';

import {
  useLazyGetActivePractitionersByFacilityQuery,
  useLazyGetPractitionerByIdQuery
} from '@/services/setup/practitioner/PractitionerService';

const TELEPHONIC_FIELD_LABELS: Record<string, string> = {
  facilityId: 'Facility',
  practitionerId: 'Physician',
  dateOfCall: 'Date Of Call',
  consultationContent: 'Consultation Content',
  approvalNumber: 'Approval Number',
  notes: 'Notes',
  extraDocumentation: 'Extra Documentation',
  patientId: 'Patient',
  encounterId: 'Encounter'
};

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const lines = data.fieldErrors.map((fe: any) => {
      const label = TELEPHONIC_FIELD_LABELS[fe.field] || fe.field;

      const msg = (fe.message || '').toLowerCase();
      let normalized = fe.message;

      if (msg.includes('must not be null')) normalized = 'is required';
      else if (msg.includes('must not be blank')) normalized = 'must not be blank';
      else if (msg.includes('size must be')) normalized = 'length is out of range';

      return `• ${label}: ${normalized}`;
    });

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}${suffix}`,
        sev: 'warning'
      })
    );
    return;
  }

  const errorKey: string | undefined =
    data?.errorKey ||
    (typeof data?.message === 'string' && data.message.startsWith('error.')
      ? data.message.replace('error.', '')
      : undefined);

  if (errorKey === 'fk.patient') {
    dispatch(
      notify({
        msg: `Please fix the following fields:\n• Facility: is required${suffix}`,
        sev: 'warning'
      })
    );
    return;
  }

  if (errorKey && keyMap[errorKey]) {
    dispatch(
      notify({
        msg: keyMap[errorKey] + suffix,
        sev: 'warning'
      })
    );
    return;
  }

  const fallbackMsg = data?.detail || data?.title || data?.message || 'Unexpected error occurred';

  dispatch(
    notify({
      msg: fallbackMsg + suffix,
      sev: 'warning'
    })
  );
};

const TELEPHONIC_CONSULTATION_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Telephonic consultation payload is required.',
  'id.required': 'Telephonic consultation id is required.',
  'id.mismatch': 'Path id does not match payload id.',

  'patient.required': 'Patient is required.',
  'patient.invalid': 'Invalid patient reference.',
  'patient.notfound': 'Patient not found.',
  'fk.patient': 'Patient information is missing or invalid.',

  'encounter.required': 'Encounter is required.',
  'encounter.invalid': 'Invalid encounter reference.',
  'fk.encounter': 'Encounter information is missing or invalid.',

  'facility.notfound': 'Selected facility not found.',
  'practitioners.notfound': 'No practitioners found for this facility.',
  'facility.invalid': 'Invalid facility selection.',

  notfound: 'Telephonic consultation not found.',
  duplicate: 'Telephonic consultation already exists.',
  'already.cancelled': 'Telephonic consultation already cancelled.',
  'already.cancelled.update': 'Cancelled telephonic consultation cannot be updated.',

  'db.constraint': 'Database constraint violation.'
};

const DetailsTele = ({
  patient,
  encounter,
  consultationOrders,
  open,
  setOpen,
  refetchCon,
  editing,
  edit
}) => {
  const dispatch = useAppDispatch();

  const [formData, setFormData] = useState({ ...newTelephonicConsultation });
  const [practitioner, setPractitioner] = useState<Practitioner>({ ...newPractitioner });

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const [practitionerPage, setPractitionerPage] = useState(0);
  const pageSize = 5;
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);

  const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});

  const [createConsultation] = useCreateMutation();
  const [updateConsultation] = useUpdateMutation();

  const [triggerGetPractitionersByFacility, practitionersResult] =
    useLazyGetActivePractitionersByFacilityQuery();

  const [triggerGetPractitionerById, { data: practitionerById, isSuccess: practitionerLoaded }] =
    useLazyGetPractitionerByIdQuery();

  useEffect(() => {
    if (!open) return;

    if (consultationOrders?.id) {
      setFormData({
        ...consultationOrders,
        patientId: patient?.id,
        encounterId: encounter?.id
      });
    } else {
      setFormData({
        ...newTelephonicConsultation,
        patientId: patient?.id,
        encounterId: encounter?.id,
        practitionerId: null
      });

      setPractitioner({ ...newPractitioner });
      setAllPractitioners([]);
      setPractitionerPage(0);
    }
  }, [open, consultationOrders?.id]);

  useEffect(() => {
    if (!open || !consultationOrders?.id) return;
    if (!consultationOrders?.practitionerId) return;

    triggerGetPractitionerById(consultationOrders.practitionerId);
  }, [open, consultationOrders?.id]);

  useEffect(() => {
    if (!open || !consultationOrders?.id) return;

    if (!practitionerLoaded || !practitionerById) return;

    setPractitioner({
      ...newPractitioner,
      facilityId: practitionerById.facilityId
    });

    setAllPractitioners([practitionerById]);
    setPractitionerPage(0);

    triggerGetPractitionersByFacility({
      facilityId: practitionerById.facilityId,
      page: 0,
      size: pageSize,
      sort: 'id,asc'
    });

    setFormData(prev => ({
      ...prev,
      practitionerId: practitionerById.id
    }));
  }, [open, consultationOrders?.id, practitionerLoaded]);

  useEffect(() => {
    if (!practitionersResult?.data?.data) return;

    const newPractitioners = practitionersResult.data.data;

    setAllPractitioners(prev => {
      const existingIds = new Set(prev.map(p => p.id));
      const unique = newPractitioners.filter(p => !existingIds.has(p.id));
      return [...prev, ...unique];
    });
  }, [practitionersResult?.data?.data]);

  /* ========================= ACTIONS ========================= */

  const handleClear = () => {
    setFormData({
      ...newTelephonicConsultation,
      patientId: patient.id,
      encounterId: encounter?.id
    });
    setPractitioner({ ...newPractitioner });
    setAllPractitioners([]);
    setPractitionerPage(0);
  };

  const handleSave = async () => {
    try {
      if ((formData as TelephonicConsultations).id) {
        const payload = {
          id: consultationOrders?.id,
          practitionerId: formData.practitionerId,
          dateOfCall: formData.dateOfCall,
          consultationContent: formData.consultationContent,
          approvalNumber: formData.approvalNumber,
          notes: formData.notes,
          extraDocumentation: formData.extraDocumentation
        };
        await updateConsultation(payload).unwrap();
        dispatch(notify({ msg: 'Telephonic consultation updated successfully', sev: 'success' }));
      } else {
        const createPayload = {
          ...formData,
          patientId: patient?.id
        };
        await createConsultation(createPayload).unwrap();
        dispatch(notify({ msg: 'Telephonic consultation created successfully', sev: 'success' }));
      }

      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, TELEPHONIC_CONSULTATION_ERROR_MAP);
      return;
    }

    refetchCon?.();
  };

  const handleOpenAttachmentModal = () => {
    if (!(formData as any)?.id) return;
    setShowAttachmentModal(true);
  };

        // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
      <AdvancedModal
        open={open}
        setOpen={setOpen}
        size="50vw"
        leftWidth="40%"
        rightWidth="60%"
        actionButtonFunction={handleSave}
        isDisabledActionBtn={edit}
        footerButtons={
          <MyButton disabled={edit} onClick={handleClear}>
            <FontAwesomeIcon icon={faBroom} /> Clear
          </MyButton>
        }
        rightTitle="Telephonic Consultation"
        rightContent={
          <Form fluid className={clsx({ 'disabled-panel': edit })}>
            <div className="main-details-consultion-page-container">
              <MyInput
                width="24vw"
                column
                fieldLabel="Facility"
                fieldType="select"
                fieldName="facilityId"
                selectData={facilityListResponse ?? []}
                selectDataLabel="name"
                selectDataValue="id"
                record={practitioner}
                setRecord={(rec: Practitioner) => {
                  setPractitioner(rec);
                  setFormData(prev => ({ ...prev, practitionerId: null }));
                  setAllPractitioners([]);
                  setPractitionerPage(0);

                  if (rec?.facilityId) {
                    triggerGetPractitionersByFacility({
                      facilityId: rec.facilityId,
                      page: 0,
                      size: pageSize,
                      sort: 'id,asc'
                    }).catch(err => {
                      handleCrudError(err, dispatch, TELEPHONIC_CONSULTATION_ERROR_MAP);
                    });
                  }
                }}
                required
              />

              <div className="row-2-cols">
                <MyInput
                  width="11vw"
                  fieldLabel="Physician"
                  fieldName="practitionerId"
                  fieldType="selectPagination"
                  selectData={allPractitioners}
                  selectDataLabel={['firstName', 'lastName']}
                  selectDataValue="id"
                  record={formData}
                  setRecord={setFormData}
                  disabled={!practitioner?.facilityId}
                  loading={practitionersResult?.isFetching}
                  searchable
                  hasMore={practitionersResult?.data?.totalCount > allPractitioners.length}
                  onFetchMore={() => {
                    const nextPage = practitionerPage + 1;
                    setPractitionerPage(nextPage);

                    triggerGetPractitionersByFacility({
                      facilityId: practitioner.facilityId,
                      page: nextPage,
                      size: pageSize,
                      sort: 'id,asc'
                    }).catch(err => {
                      handleCrudError(err, dispatch, TELEPHONIC_CONSULTATION_ERROR_MAP);
                    });
                  }}
                  required
                />

                <MyInput
                  width="11vw"
                  fieldName="dateOfCall"
                  fieldLabel="Date Of Call"
                  fieldType="datetime"
                  record={formData}
                  setRecord={setFormData}
                  required
                />
              </div>

              <MyInput
                width="24vw"
                fieldName="consultationContent"
                fieldLabel="Consultation Content"
                fieldType="textarea"
                rows={6}
                record={formData}
                setRecord={setFormData}
                required
              />

              <div className="row-approval-attach">
                <MyInput
                  width="12vw"
                  fieldName="approvalNumber"
                  fieldType="textnumber"
                  fieldLabel="Approval Number"
                  record={formData}
                  setRecord={setFormData}
                />

                <div className="attachment-button-consultation-position">
                  <MyButton
                    className="my-button-for-attachment-modal"
                    onClick={handleOpenAttachmentModal}
                    disabled={!(formData as any)?.id}
                  >
                    <FontAwesomeIcon icon={faPaperclip} /> Attachments
                  </MyButton>
                </div>
              </div>

              <div className="row-2-cols">
                <MyInput
                  width="12vw"
                  fieldName="notes"
                  rows={6}
                  fieldType="textarea"
                  record={formData}
                  setRecord={setFormData}
                />

                <MyInput
                  width="12vw"
                  fieldName="extraDocumentation"
                  fieldLabel="Extra Documentation"
                  rows={6}
                  fieldType="textarea"
                  record={formData}
                  setRecord={setFormData}
                />
              </div>
            </div>
          </Form>
        }
        leftContent={<Diagnosis patient={patient} encounter={encounter} />}
      />

      <AttachmentUploadModal
        isOpen={showAttachmentModal}
        setIsOpen={setShowAttachmentModal}
        encounterId={encounter?.key}
        refetchData={() => {}}
        source="TELEPHONIC_CONSULTATION_ORDER_ATTACHMENT"
        sourceId={(formData as any)?.id ?? 0}
      />
    </div>
  );
};

export default DetailsTele;
