import React, { useEffect, useState } from 'react';
import { Form, Toggle } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useAppDispatch } from '@/hooks';
import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { newApEncounter } from '@/types/model-types-constructor';
import { faBoltLightning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { calculateAgeFormat } from '@/utils';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';
import { notify } from '@/utils/uiReducerActions';

// ✅ استيراد Patient من الـ types الجديدة
import type { Patient } from '@/types/model-types-new';

// ✅ استيراد الـ mutation الجديدة
import { useAddPatientMutation } from '@/services/patient/patientService';

// دالة ترجع مريض فاضي حسب الـ interface الجديد
const getEmptyPatient = (): Patient => ({
  id: undefined,
  mrn: null,
  firstName: '',
  secondName: null,
  thirdName: null,
  lastName: '',
  sexAtBirth: null,
  dateOfBirth: null,
  patientClasses: null,
  isPrivatePatient: null,
  firstNameSecondaryLang: null,
  secondNameSecondaryLang: null,
  thirdNameSecondaryLang: null,
  lastNameSecondaryLang: null,
  primaryMobileNumber: null,
  receiveSms: null,
  secondMobileNumber: null,
  homePhone: null,
  workPhone: null,
  email: null,
  receiveEmail: null,
  preferredWayOfContact: null,
  nativeLanguage: null,
  emergencyContactName: null,
  emergencyContactRelation: null,
  emergencyContactPhone: null,
  role: null,
  maritalStatus: null,
  nationality: null,
  religion: null,
  ethnicity: null,
  occupation: null,
  responsibleParty: null,
  educationalLevel: null,
  previousId: null,
  archivingNumber: null,
  details: null,
  isUnknown: null,
  isVerified: null,
  isCompletedPatient: null,
  securityAccessLevel: null,
  createdBy: null,
  createdDate: null,
  lastModifiedBy: null,
  lastModifiedDate: null
});

const QuickPatient = ({ open, setOpen, setPatient = null }) => {
  const dispatch = useAppDispatch();

  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState<any>({});
  const [localPatient, setLocalPatient] = useState<Patient>(getEmptyPatient());

  // ✅ mutation الجديدة
  const [addPatient /* , addPatientMutation */] = useAddPatientMutation();

  const [saveEncounter /* , saveEncounterMutation */] = useCompleteEncounterRegistrationMutation();

  const [localEncounter, setLocalEncounter] = useState({
    ...newApEncounter,
    visitTypeLkey: '2041082245699228',
    plannedStartDate: new Date(),
    patientAge: null,
    discharge: false,
    patientKey: undefined
  });

  const pageCode = useSelector((state: RootState) => state.div?.pageCode);

  // LOV للنوع (الجندر)
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');

  // حفظ المريض + encounter
  const handleSave = async () => {
    try {
      // تجهيز payload حسب Patient interface
      const payload: Patient = {
        ...localPatient,
        // تأكد إن في lastName عالأقل نقطة لو فاضي
        lastName: localPatient.lastName || '.',
        isUnknown: isUnknown,
        // quick registration غالباً مش مكتمل
        isCompletedPatient: isUnknown ? false : false,
        // خليها null لاني مش عارف القيمة من عندكم
        securityAccessLevel:
          localPatient.securityAccessLevel !== undefined ? localPatient.securityAccessLevel : null
      };

      // 1. إضافة المريض
      const savedPatient = await addPatient(payload).unwrap();

      // 2. إضافة encounter لو إحنا في ER_Triage
      if (pageCode === 'ER_Triage') {
        await saveEncounter({
          ...localEncounter,
          // نفترض إن الـ encounter يتعامل مع الـ id كمفتاح
          patientKey: savedPatient.id?.toString(),
          plannedStartDate: new Date(),
          encounterStatusLkey: '8890456518264959',
          patientAge: calculateAgeFormat(savedPatient.dateOfBirth),
          visitTypeLkey: '2041082245699228',
          resourceTypeLkey: '6743167799449277',
          resourceKey: '7101086042442391'
        });

        dispatch(setRefetchEncounter(true));
      }

      // 3. تحديث الحالة وتمرير المريض للفوق إن لزم
      setLocalPatient(savedPatient);
      if (setPatient != null) {
        setPatient(savedPatient);
      }

      setOpen(false);

      // 4. تنظيف الفورم
      handleClearModal();
      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
      setValidationResult(undefined);
    } catch (error: any) {
      console.log('rejected', error);
      if (error?.data?.validationResult) {
        setValidationResult(error.data.validationResult);
      }
    }
  };

  // تنظيف الحقول
  const handleClearModal = () => {
    setIsUnknown(false);
    setLocalPatient(getEmptyPatient());
    setLocalEncounter({
      ...newApEncounter,
      visitTypeLkey: '2041082245699228',
      plannedStartDate: new Date(),
      patientAge: null,
      discharge: false,
      patientKey: undefined
    });
  };

  // محتوى المودال
  const quickPatientContent = (
    <Form layout="inline" fluid>
      {/* First Name */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldName="firstName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />

      {/* Last Name (مطلوب في الـ interface) */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldName="lastName"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />

      {/* Gender → sexAtBirth */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldLabel="Gender"
        fieldType="select"
        fieldName="sexAtBirth"
        selectData={genderLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
        searchable={false}
      />

      {/* Mobile → primaryMobileNumber */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldName="primaryMobileNumber"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
      />

      {/* DOB → dateOfBirth */}
      <MyInput
        width={350}
        vr={validationResult}
        column
        fieldType="date"
        fieldLabel="DOB"
        fieldName="dateOfBirth"
        record={localPatient}
        setRecord={setLocalPatient}
        disabled={isUnknown}
        allowNull
      />

      {/* Unknown toggle */}
      <div style={{ marginTop: 8 }}>
        Unknown Patient: <Toggle onChange={setIsUnknown} checked={isUnknown} />
      </div>
    </Form>
  );

  // لما المودال يتسكر، نظف البيانات
  useEffect(() => {
    if (!open) {
      handleClearModal();
    }
  }, [open]);

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Quick Patient"
      steps={[
        {
          title: 'Basic Information',
          icon: <FontAwesomeIcon icon={faBoltLightning} />
        }
      ]}
      size="xs"
      position="right"
      actionButtonLabel="Create"
      actionButtonFunction={handleSave}
      content={quickPatientContent}
    />
  );
};

export default QuickPatient;
