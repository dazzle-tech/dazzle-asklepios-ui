import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import { useAppDispatch} from '@/hooks';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { ApPatientInsurance } from '@/types/model-types';
import { faShieldHeart } from '@fortawesome/free-solid-svg-icons';
import { useSavePatientInsuranceMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatientInsurance } from '@/types/model-types-constructor';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
const InsuranceModal = ({ 
  open, 
  setOpen, 
  onClose, 
  patientKey, 
  refetchInsurance, 
  editing, 
  insuranceBrowsing, 
  relations, 
  hideSaveBtn = false
}) => {
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
  const [savePatientInsurance] = useSavePatientInsuranceMutation();
  const [relationsList, setRelationsList] = useState()
  const dispatch = useAppDispatch();

  // Fetch LOV data for various fields
  const { data: isnurancePlanTypeResponse } = useGetLovValuesByCodeQuery('INS_PLAN_TYPS');
  const { data: isnuranceProviderTypeResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');

  // MyModal content
  const renderContent = () => (
    <div>
      <Form layout="inline" fluid>
        <MyInput
          column
          fieldLabel="Insurance Provider"
          fieldType="select"
          fieldName="insuranceProviderLkey"
          selectData={isnuranceProviderTypeResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          searchable={false}
        />
        <MyInput
          column
          fieldLabel="Insurance Policy Number"
          fieldName="insurancePolicyNumber"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Group Number"
          fieldName="groupNumber"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Insurance Plan Type"
          fieldType="select"
          fieldName="insurancePlanTypeLkey"
          selectData={isnurancePlanTypeResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          searchable={false}
        />
        <MyInput
          column
          fieldLabel="Authorization Numbers"
          fieldName="authorizationNumbers"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldType="date"
          fieldLabel="Expiration Date"
          fieldName="expirationDate"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Remaining Benefits"
          fieldName="remainingBenefits"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />

        <MyInput
          column
          fieldLabel="Remailing Deductibles"
          fieldName="remailingDeductibles"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
        />
        <MyInput
          column
          fieldLabel="Policy Holder"
          fieldType="select"
          fieldName="policyHolder"
          selectData={relationsList}
          selectDataLabel="name"
          selectDataValue="id"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          disabled={insuranceBrowsing}
          searchable={false}        />
        <MyInput
          column
          fieldLabel="Primary Insurance"
          fieldName="primaryInsurance"
          record={patientInsurance}
          setRecord={setPatientInsurance}
          fieldType="checkbox"
          disabled={insuranceBrowsing}
        />
      </Form>
      <div className='clickedInputs'>
        <Form layout="inline" fluid >
          <MyInput
            column
            fieldLabel="Co Payment"
            fieldName="coPayment"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.coPayment ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Co Payment Value"
              fieldName="coPaymentValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
        <Form layout="inline" fluid >
          <MyInput
            column
            fieldLabel="Co Insurance"
            fieldName="coInsurance"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.coInsurance ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Co Insurance Value"
              fieldName="coInsuranceValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
        <Form layout="inline" fluid>
          <MyInput
            column
            fieldLabel="Deductibles"
            fieldName="deductibles"
            record={patientInsurance}
            setRecord={setPatientInsurance}
            fieldType="checkbox"
            disabled={insuranceBrowsing}
          />
          <div className={`input-container ${patientInsurance?.deductibles ? 'show' : 'hide'}`}>
            <MyInput
              column
              fieldLabel="Deductibles Value"
              fieldName="deductiblesValue"
              record={patientInsurance}
              setRecord={setPatientInsurance}
              disabled={insuranceBrowsing}
            />
          </div>
        </Form>
      </div>
    </div>
  );

  //handle save insurance
  const handleSave = async () => {
    savePatientInsurance({ ...patientInsurance, patientKey: patientKey.key }).unwrap().then(() => {
      refetchInsurance()
      handleClearModal()
      dispatch(notify('Insurance Saved Successfully'))
    }).catch((error) => {
      console.log(error)
      setPatientInsurance({ ...patientInsurance, primaryInsurance: false })
    });

  };

  //handle Clear Modal
  const handleClearModal = () => {
    setPatientInsurance(newApPatientInsurance);
    onClose();
  };

  //Effects
  useEffect(() => {
    const namesAndIds = relations.map(relation => {
      const relativePatient = relation.relativePatientObject;
      return {
        name: `${relativePatient.firstName} ${relativePatient.lastName}`,
        id: relation.key
      };
    });
    setRelationsList(namesAndIds);
    console.log(namesAndIds)
  }, [relations]);
 
  useEffect(() => {
    console.log(patientInsurance)
    console.log(relations)
  }, [patientInsurance])

  useEffect(() => {
    if (open === false) {
      handleClearModal();
    }
  }, [open])
 
  useEffect(() => {
    if (editing) {
      setPatientInsurance(editing);
    }
  }, [editing]);
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Patient Insurance"
      bodyheight={410}
      content={renderContent}
      size="lg"
      steps={[
        {
          title: "Insurance", icon: <FontAwesomeIcon icon={faShieldHeart}/>,
        },
      ]}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      hideActionBtn={hideSaveBtn}
    />
  );
};
export default InsuranceModal;
