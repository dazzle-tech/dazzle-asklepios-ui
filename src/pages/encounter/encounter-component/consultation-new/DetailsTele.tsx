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

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { Practitioner, TelephonicConsultation } from '@/types/model-types-new';

import {
  useLazyGetPractitionersByFacilityQuery,
  useLazyGetPractitionerByIdQuery
} from '@/services/setup/practitioner/PractitionerService';

const handleCrudError = (err: any, dispatch: any, keyMap: Record<string, string>) => {
  const data = err?.data ?? {};
  const traceId = data?.traceId || data?.requestId || data?.correlationId;
  const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

  if (Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
    const normalizeMsg = (msg: string) => {
      const m = (msg || '').toLowerCase();
      if (m.includes('must not be null')) return 'is required';
      if (m.includes('must not be blank')) return 'must not be blank';
      if (m.includes('size must be between')) return 'length is out of range';
      return msg || 'invalid value';
    };

    const lines = data.fieldErrors.map((fe: any) => `• ${fe.field}: ${normalizeMsg(fe.message)}`);

    dispatch(
      notify({
        msg: `Please fix the following fields:\n${lines.join('\n')}` + suffix,
        sev: 'error'
      })
    );
    return;
  }

  const messageProp: string = data?.message || '';

  if (
    messageProp.includes('ConstraintViolationImpl') ||
    messageProp.includes('Validation failed')
  ) {
    const violations: string[] = [];
    const pattern = /propertyPath=(\w+).*?interpolatedMessage='([^']+)'/g;
    let match;

    while ((match = pattern.exec(messageProp)) !== null) {
      const field = match[1];
      const message = match[2];

      const normalized = message.includes('must not be null')
        ? 'is required'
        : message.includes('must not be blank')
        ? 'must not be blank'
        : message;

      violations.push(`• ${field}: ${normalized}`);
    }

    if (violations.length > 0) {
      dispatch(
        notify({
          msg: `Please fix the following fields:\n${violations.join('\n')}` + suffix,
          sev: 'error'
        })
      );
      return;
    }
  }

  const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : data?.errorKey;

  const humanMsg =
    (errorKey && keyMap[errorKey]) ||
    data?.detail ||
    data?.title ||
    data?.message ||
    'Unexpected error';

  dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
};

const TELEPHONIC_CONSULTATION_ERROR_MAP: Record<string, string> = {
  'payload.required': 'Telephonic consultation payload is required.',
  'patient.invalid': 'Invalid patient reference.',
  'encounter.invalid': 'Invalid encounter reference.',
  duplicate: 'Telephonic consultation already exists.',
  'db.constraint': 'Database constraint violation.',
  notfound: 'Telephonic consultation not found.'
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

  const [practitioner, setPractitioner] = useState<Practitioner>({
    ...newPractitioner
  });

  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const [practitionerPage, setPractitionerPage] = useState(0);
  const pageSize = 5;
  const [allPractitioners, setAllPractitioners] = useState<any[]>([]);

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const [createConsultation] = useCreateMutation();
  const [updateConsultation] = useUpdateMutation();

  const [triggerGetPractitionersByFacility, practitionersResult] =
    useLazyGetPractitionersByFacilityQuery();

  const [triggerGetPractitionerById, { data: practitionerById, isSuccess: practitionerLoaded }] =
    useLazyGetPractitionerByIdQuery();

  useEffect(() => {
    if (!open) return;

    if (consultationOrders?.id) {
      setFormData({
        ...consultationOrders,
        patientId: Number(patient?.key),
        encounterId: Number(encounter?.key)
      });
    } else {
      setFormData({
        ...newTelephonicConsultation,
        patientId: Number(patient?.key),
        encounterId: Number(encounter?.key)
      });
      setPractitioner({ ...newPractitioner });
      setAllPractitioners([]);
      setPractitionerPage(0);
    }
  }, [open, consultationOrders, patient?.key, encounter?.key]);

  useEffect(() => {
    if (!open) return;
    if (!consultationOrders?.practitionerId) return;

    triggerGetPractitionerById(consultationOrders.practitionerId);
  }, [open, consultationOrders?.practitionerId]);

  useEffect(() => {
    if (!open || !practitionerLoaded || !practitionerById) return;

    setPractitioner({
      ...newPractitioner,
      facilityId: practitionerById.facilityId
    });

    setPractitionerPage(0);

    setAllPractitioners([practitionerById]);

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
  }, [open, practitionerLoaded, practitionerById]);

  useEffect(() => {
    if (!practitionersResult?.data?.data) return;

    const newPractitioners = practitionersResult.data.data;

    if (practitionerPage === 0) {
      setAllPractitioners(prev => {
        if (prev.length > 0) {
          const existingIds = new Set(prev.map(p => p.id));
          const uniqueNew = newPractitioners.filter(p => !existingIds.has(p.id));
          return [...prev, ...uniqueNew];
        }
        return newPractitioners;
      });
    } else {
      setAllPractitioners(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = newPractitioners.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
    }
  }, [practitionersResult?.data?.data, practitionerPage]);

  const handleClear = () => {
    setFormData({
      ...newTelephonicConsultation,
      patientId: Number(patient.key),
      encounterId: Number(encounter?.key)
    });
    setPractitioner({ ...newPractitioner });
    setAllPractitioners([]);
    setPractitionerPage(0);
  };

  const handleSave = async () => {
    try {
      if ((formData as TelephonicConsultation).id) {
        const payload = {
          id: consultationOrders?.id,
          practitionerId: formData?.practitionerId,
          dateOfCall: formData?.dateOfCall,
          consultationContent: formData?.consultationContent,
          approvalNumber: formData?.approvalNumber,
          notes: formData?.notes,
          extraDocumentation: formData?.extraDocumentation
        };
        await updateConsultation(payload).unwrap();
        dispatch(notify({ msg: 'Telephonic consultation updated successfully', sev: 'success' }));
      } else {
        await createConsultation(formData).unwrap();
        dispatch(notify({ msg: 'Telephonic consultation created successfully', sev: 'success' }));
      }

      refetchCon?.();
      setOpen(false);
    } catch (err: any) {
      handleCrudError(err, dispatch, TELEPHONIC_CONSULTATION_ERROR_MAP);
    }
  };

  const handleOpenAttachmentModal = () => {
    if (!(formData as any)?.id) return;
    setShowAttachmentModal(true);
  };

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
        rightTitle="Telephonic Consultation"
        rightContent={
          <Form fluid className={clsx({ 'disabled-panel': edit })}>
            <div className="main-details-consultion-page-container">
              <MyInput
                width="100%"
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
                  setPractitionerPage(0);
                  setAllPractitioners([]);

                  if (rec?.facilityId) {
                    triggerGetPractitionersByFacility({
                      facilityId: rec.facilityId,
                      page: 0,
                      size: pageSize,
                      sort: 'id,asc'
                    });
                  }
                }}
                required
              />

              <MyInput
                width="12vw"
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
                  });
                }}
                required
              />

              <MyInput
                width="12vw"
                fieldName="dateOfCall"
                fieldLabel="Date Of Call"
                fieldType="datetime"
                record={formData}
                setRecord={setFormData}
                required
              />

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

              <MyInput
                width="12vw"
                fieldName="approvalNumber"
                fieldType="text"
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
    </>
  );
};

export default DetailsTele;
