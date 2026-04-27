import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import { useAppDispatch } from '@/hooks';
import { faUser, faIdCard, faPhone, faShieldHalved } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import './styles.less';
import {
  newApEncounter,
  newApPatientInsurance,
  newApPatient
} from '@/types/model-types-constructor';
import { ApPatientInsurance, ApPatient } from '@/types/model-types';
import MyModal from '@/components/MyModal/MyModal';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { useSavePatientMutation, useSavePatientInsuranceMutation } from '@/services/patientService';
import { useNavigate } from 'react-router-dom';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import { calculateAgeFormat } from '@/utils';
import { useCompleteEncounterRegistrationMutation } from '@/services/encounterService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { setRefetchEncounter } from '@/reducers/refetchEncounterState';

// NEW IMPORTS for Payors / Plans
import { useGetAllPayorsQuery } from '@/services/setup/payer/PayorService';
import { useGetPlansByPayorQuery } from '@/services/setup/payer/PayorPlanService';

const CreateNewPatient = ({ open, setOpen }) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [localPatient, setLocalPatient] = useState<ApPatient>({ ...newApPatient });
  const [savePatientInsurance] = useSavePatientInsuranceMutation();
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({
    ...newApPatientInsurance
  });
  const [savePatient, savePatientMutation] = useSavePatientMutation();
  const [openNextDocument, setOpenNextDocument] = useState(false);
  const [localEncounter, setLocalEncounter] = useState({
    ...newApEncounter,
    visitTypeLkey: '2041082245699228',
    patientKey: localPatient.key,
    plannedStartDate: new Date(),
    patientAge: calculateAgeFormat(localPatient.dob),
    discharge: false
  });
  const [saveEncounter] = useCompleteEncounterRegistrationMutation();
  const pageCode = useSelector((state: RootState) => state.div?.pageCode);

  // LOVs
  const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: countryLovQueryResponse } = useGetLovValuesByCodeQuery('CNTRY');
  const { data: preferredWayOfContactLovQueryResponse } =
    useGetLovValuesByCodeQuery('PREF_WAY_OF_CONTACT');
  const { data: cityLovQueryResponse } = useGetLovValuesByCodeAndParentQuery({
    code: 'CITY',
    parentValueKey: localPatient.countryLkey
  });

  const [prevPayorId, setPrevPayorId] = useState<number | undefined>(undefined);

  const [payorPage, setPayorPage] = useState(0);
  const [payorSearchKeyword, setPayorSearchKeyword] = useState('');

  const [planPage, setPlanPage] = useState(0);

  // Fetch Payors with pagination
  const {
    data: payorResponse,
    isLoading: payorLoading,
    isFetching: payorFetching
  } = useGetAllPayorsQuery({
    page: payorPage,
    size: 20,
    sort: 'name,asc',
    ...(payorSearchKeyword && { name: payorSearchKeyword })
  });

  // Fetch Payor Plans based on selected Payor
  const {
    data: plansResponse,
    isLoading: plansLoading,
    isFetching: plansFetching
  } = useGetPlansByPayorQuery(
    {
      payorId: Number(patientInsurance?.insuranceProviderLkey) || 0,
      page: planPage,
      size: 20,
      sort: 'name,asc'
    },
    {
      skip: !patientInsurance?.insuranceProviderLkey
    }
  );

  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  const handleSave = () => {
    savePatient({ ...localPatient, incompletePatient: false, unknownPatient: false })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Patient Saved Successfully', sev: 'success' }));
      });
  };

  const handleSavePatientAndQuick = async () => {
    try {
      const savedPatient = await savePatient({
        ...localPatient,
        incompletePatient: false,
        unknownPatient: false
      }).unwrap();

      if (pageCode === 'ER_Triage') {
        await saveEncounter({
          ...localEncounter,
          patientKey: savedPatient.key,
          plannedStartDate: new Date(),
          encounterStatusLkey: '8890456518264959',
          patientAge: calculateAgeFormat(savedPatient.dob),
          visitTypeLkey: '2041082245699228',
          resourceTypeLkey: 'EMERGENCY',
          facilityKey: selectedFacility?.id,
          resourceKey: '5006'
        });
        dispatch(setRefetchEncounter(true));
      }

      setLocalPatient(savedPatient);
      {
        pageCode !== 'ER_Triage' &&
          navigate('/patient-profile', { state: { patient: savedPatient } });
      }

      dispatch(notify({ msg: 'Patient added successfully', sev: 'success' }));
    } catch (error) {}
  };

  const goToPatientProfile = () => {
    setOpen(false);
    const privatePatientPath = '/patient-profile';
    navigate(privatePatientPath, { state: { patient: localPatient } });
    setLocalPatient({ ...newApPatient });
    setPatientInsurance({ ...newApPatientInsurance });
  };

  const handleSaveInsurance = async () => {
    savePatientInsurance({ ...patientInsurance, patientKey: localPatient.key })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Patient Insurance Added Successfully', sev: 'success' }));
        const privatePatientPath = '/patient-profile';
        navigate(privatePatientPath, { state: { patient: localPatient } });
        setOpen(false);
        setLocalPatient({ ...newApPatient });
        setPatientInsurance({ ...newApPatientInsurance });
      })
      .catch(error => {
        setPatientInsurance({ ...patientInsurance, primaryInsurance: false });
      });
  };

  const hasMorePayors = payorResponse?.links?.next != null;
  const hasMorePlans = plansResponse?.links?.next != null;

  const handleLoadMorePayors = () => {
    if (hasMorePayors && !payorFetching) {
      setPayorPage(prev => prev + 1);
    }
  };

  const handleLoadMorePlans = () => {
    if (hasMorePlans && !plansFetching) {
      setPlanPage(prev => prev + 1);
    }
  };

  // Reset payors page when search changes
  useEffect(() => {
    setPayorPage(0);
  }, [payorSearchKeyword]);

  useEffect(() => {
    const currentPayorId = patientInsurance?.insuranceProviderLkey
      ? Number(patientInsurance.insuranceProviderLkey)
      : undefined;

    if (currentPayorId === prevPayorId) return;

    setPlanPage(0);

    if (prevPayorId !== undefined) {
      setPatientInsurance(prev => ({
        ...prev,
        insurancePlanTypeLkey: undefined
      }));
    }

    setPrevPayorId(currentPayorId);
  }, [patientInsurance?.insuranceProviderLkey, prevPayorId]);

  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid layout="inline">
            <span className="custom-text">Basic Information</span>
            <MyInput
              width={200}
              required
              column
              fieldName="firstName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              required
              column
              fieldName="secondName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="thirdName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              required
              column
              fieldName="lastName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldType="date"
              fieldLabel="DOB"
              fieldName="dob"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              required
              column
              fieldLabel="Gender"
              fieldType="select"
              fieldName="genderLkey"
              selectData={genderLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <br />
            <MyInput
              column
              width={200}
              required
              fieldType='textnumber'
              fieldName="phoneNumber"
              fieldLabel="Primary Mobile Number"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              column
              width={200}
              fieldLabel="Private Patient"
              fieldType="checkbox"
              fieldName="privatePatient"
              record={localPatient}
              setRecord={setLocalPatient}
            />
          </Form>
        );
      case 1:
        return (
          <Form fluid layout="inline">
            <span className="custom-text">Document Information</span>
            <MyInput
              width={200}
              required
              column
              fieldLabel="Document Type"
              fieldType="select"
              fieldName="documentTypeLkey"
              selectData={docTypeLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              required
              width={200}
              column
              fieldLabel="Document Country"
              fieldType="select"
              fieldName="documentCountryLkey"
              selectData={countryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={localPatient.documentTypeLkey === 'NO_DOC'}
            />
            <MyInput
              width={200}
              required
              column
              fieldLabel="Document Number"
              fieldName="documentNo"
              record={localPatient}
              setRecord={setLocalPatient}
              disabled={localPatient.documentTypeLkey === 'NO_DOC'}
            />
          </Form>
        );
      case 2:
        return (
          <Form fluid layout="inline">
            <span className="custom-text">Contact Information</span>
            <MyInput
              width={200}
              column
              fieldLabel="Secondary Number"
              fieldName="secondaryMobileNumber"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="homePhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="email"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldLabel="Preferred Way of Contact"
              fieldType="select"
              fieldName="preferredContactLkey"
              selectData={preferredWayOfContactLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="emergencyContactName"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldName="emergencyContactPhone"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <span className="custom-text">Address Information</span>
            <MyInput
              width={200}
              column
              fieldLabel="Country"
              fieldType="select"
              fieldName="countryLkey"
              selectData={countryLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldLabel="State/Province"
              fieldType="select"
              fieldName="stateProvinceRegionLkey"
              selectData={cityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldLabel="City"
              fieldType="select"
              fieldName="cityLkey"
              selectData={cityLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              record={localPatient}
              setRecord={setLocalPatient}
            />
            <MyInput
              width={200}
              column
              fieldLabel="Postal/ZIP code"
              fieldName="postalCode"
              record={localPatient}
              setRecord={setLocalPatient}
            />
          </Form>
        );
      case 3:
        return (
          <Form fluid layout="inline">
            <span className="custom-text">Insurance Information</span>
            <MyInput
              column
              width={200}
              fieldLabel="Payor"
              fieldType="selectPagination"
              fieldName="insuranceProviderLkey"
              selectData={payorResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
              searchable={true}
              loading={payorLoading || payorFetching}
              hasMore={hasMorePayors}
              onFetchMore={handleLoadMorePayors}
              searchKeyWard={payorSearchKeyword}
              setSearchKeyWard={setPayorSearchKeyword}
              placeholder="Select Payor..."
            />
            <MyInput
              width={200}
              column
              fieldLabel="Insurance Policy Number"
              fieldName="insurancePolicyNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={200}
              column
              fieldLabel="Group Number"
              fieldName="groupNumber"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
            <MyInput
              width={200}
              column
              fieldLabel="Insurance Plan Type"
              fieldType="selectPagination"
              fieldName="insurancePlanTypeLkey"
              selectData={plansResponse?.data ?? []}
              selectDataLabel="name"
              selectDataValue="id"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key || !patientInsurance?.insuranceProviderLkey}
              searchable={true}
              loading={plansLoading || plansFetching}
              hasMore={hasMorePlans}
              onFetchMore={handleLoadMorePlans}
              placeholder={
                !patientInsurance?.insuranceProviderLkey
                  ? 'Select Payor first...'
                  : 'Select Plan...'
              }
            />
            <MyInput
              width={200}
              column
              fieldType="date"
              fieldLabel="Expiration Date"
              fieldName="expirationDate"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={!localPatient.key}
            />
          </Form>
        );
      default:
        return null;
    }
  };

  useEffect(() => {
    if (savePatientMutation && savePatientMutation.status === 'fulfilled') {
      setLocalPatient(savePatientMutation.data);
      if (localPatient.documentTypeLkey) {
        setOpenNextDocument(true);
      }
    }
  }, [savePatientMutation]);

  useEffect(() => {
    if (!open) {
      setLocalPatient({ ...newApPatient });
      setPatientInsurance({ ...newApPatientInsurance });
      setOpenNextDocument(false);
      setLocalEncounter({
        ...newApEncounter,
        visitTypeLkey: '2041082245699228',
        patientKey: localPatient.key,
        plannedStartDate: new Date(),
        patientAge: calculateAgeFormat(localPatient.dob),
        discharge: false
      });

      setPrevPayorId(undefined);
      setPayorPage(0);
      setPayorSearchKeyword('');
      setPlanPage(0);
    }
  }, [open]);

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Registration"
      steps={[
        {
          title: 'Basic Info',
          icon: <FontAwesomeIcon icon={faUser} />,
          disabledNext: !localPatient?.key,
          footer: (
            <MyButton onClick={pageCode === 'ER_Triage' ? handleSavePatientAndQuick : handleSave}>
              {pageCode === 'ER_Triage' ? 'Save & Create Quick Appointment' : 'Save'}
            </MyButton>
          )
        },
        {
          title: 'Document',
          icon: <FontAwesomeIcon icon={faIdCard} />,
          disabledNext: !openNextDocument,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Contact',
          icon: <FontAwesomeIcon icon={faPhone} />,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Insurance',
          icon: <FontAwesomeIcon icon={faShieldHalved} />,
          footer: <MyButton onClick={handleSaveInsurance}>Save Insurance</MyButton>
        }
      ]}
      size="33vw"
      position="right"
      actionButtonLabel="Create"
      actionButtonFunction={() => {
        handleSave();
        goToPatientProfile();
      }}
      content={(stepNumber) => <div dir={dir}>{conjureFormContent(stepNumber)}</div>}
    />
  );
};

export default CreateNewPatient;
