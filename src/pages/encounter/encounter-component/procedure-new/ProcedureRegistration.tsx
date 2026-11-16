import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useAppDispatch } from '@/hooks';
import { useSaveProcedureRegistrationMutation } from '@/services/patients/patientProcedureService';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';
import { useGetAllPractitionersQuery } from '@/services/setup/practitioner/PractitionerService';
import { useSortedLovQuery } from './useSortedLovQuery';
import { notify } from '@/utils/uiReducerActions';
import React, { forwardRef, useImperativeHandle, useMemo } from 'react';
import { Form, Text } from 'rsuite';
import ProcedureStaff from './ProcedureStaff';
import { isRegistrationComplete } from './procedureHelpers';
import { ProcedureStepHandle, useStepForm } from './useStepForm';

const ProcedureRegistration = forwardRef<ProcedureStepHandle, any>(
  ({ procedure, setProcedure, onDirtyChange }, ref) => {
    const dispatch = useAppDispatch();
    const { data: consentLovQueryResponse } = useSortedLovQuery('CONSENT_FORM');
    const { data: departments } = useGetAllDepartmentsWithoutPaginationQuery(undefined);
    const { data: practitionerListResponse } = useGetAllPractitionersQuery({ page: 0, size: 1000 });
    const [saveRegistration] = useSaveProcedureRegistrationMutation();

    const practitioners = (practitionerListResponse?.data ?? []).map((practitioner: any) => ({
      ...practitioner,
      fullName: [practitioner.firstName, practitioner.lastName].filter(Boolean).join(' ')
    }));

    const loaded = useMemo(
      () => ({
        consentForm: procedure?.consentForm ?? null,
        registrationDateTime: procedure?.registrationDateTime
          ? new Date(procedure.registrationDateTime)
          : null,
        performingDepartmentId: procedure?.performingDepartmentId ?? null,
        performingPractitionerId: procedure?.performingPractitionerId ?? null
      }),
      [
        procedure?.consentForm,
        procedure?.registrationDateTime,
        procedure?.performingDepartmentId,
        procedure?.performingPractitionerId
      ]
    );
    const { form, setForm, markSaved } = useStepForm(loaded, onDirtyChange);

    useImperativeHandle(ref, () => ({
      save: async () => {
        if (!isRegistrationComplete(form)) {
          dispatch(notify({ msg: 'Please fill all required fields', sev: 'warning' }));
          return false;
        }
        try {
          const saved = await saveRegistration({
            id: procedure.id,
            body: {
              ...form,
              registrationDateTime: form?.registrationDateTime
                ? new Date(form.registrationDateTime).toISOString()
                : null
            }
          }).unwrap();
          markSaved();
          setProcedure({ ...procedure, ...saved });
          dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
          return true;
        } catch {
          dispatch(notify({ msg: 'Save failed', sev: 'error' }));
          return false;
        }
      }
    }));

    return (
      <div className="perform-step-body">
        <SectionContainer
          title={<Text>Registration Details</Text>}
          content={
            <Form fluid>
              <div className="procedure-field-grid">
                <MyInput
                  width="100%"
                  fieldType="select"
                  selectData={consentLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  disableByField="isValid"
                  selectDataValue="lovDisplayVale"
                  fieldName="consentForm"
                  required
                  record={form}
                  setRecord={setForm}
                  searchable={false}
                />
                <MyInput
                  width="100%"
                  fieldType="datetime"
                  fieldName="registrationDateTime"
                  required
                  fieldLabel="Date & Time"
                  record={form}
                  setRecord={setForm}
                />
                <MyInput
                  width="100%"
                  fieldLabel="Procedure Location"
                  fieldName="performingDepartmentId"
                  required
                  fieldType="select"
                  selectData={departments ?? []}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={form}
                  setRecord={setForm}
                />
                <MyInput
                  menuMaxHeight="20vh"
                  width="100%"
                  fieldName="performingPractitionerId"
                  required
                  fieldLabel="Practitioner"
                  fieldType="select"
                  selectData={practitioners}
                  selectDataLabel="fullName"
                  selectDataValue="id"
                  record={form}
                  setRecord={setForm}
                />
              </div>
              <div className="procedure-hint">Requested by {procedure?.createdBy ?? '-'}</div>
            </Form>
          }
        />
        <ProcedureStaff procedureId={procedure?.id} />
      </div>
    );
  }
);
export default ProcedureRegistration;
