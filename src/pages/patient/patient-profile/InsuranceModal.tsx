import React, { useEffect, useState } from 'react';
import { Modal, Button, Placeholder, Form, InputGroup, Input, Toggle } from 'rsuite';
import './styles.less';

import { useAppDispatch, useAppSelector } from '@/hooks';
import { setEncounter, setPatient } from '@/reducers/patientSlice';
import {
  useGetLovValuesByCodeAndParentQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
// import { ApPatient } from '@/types/model-types';
import { ApPatientInsurance } from '@/types/model-types';

import { useSavePatientInsuranceMutation } from '@/services/patientService';
import { notify } from '@/utils/uiReducerActions';
import { newApPatientInsurance } from '@/types/model-types-constructor';
const InsuranceModal = ({ open, onClose, patientKey, refetchInsurance, editing, insuranceBrowsing, relations }) => {
  const [isUnknown, setIsUnknown] = useState(false);
  const [validationResult, setValidationResult] = useState({});
  const { data: docTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
  const { data: relationsLovQueryResponse } = useGetLovValuesByCodeQuery('RELATION');

  const dispatch = useAppDispatch();
  const [patientInsurance, setPatientInsurance] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
  const [savePatientInsurance, savePatientInsuranceMutation] = useSavePatientInsuranceMutation();
  const [relationsList, setRelationsList] = useState()

  useEffect(() => {
    if (editing) {
      setPatientInsurance(editing);
    }
  }, [editing]);

  console.log(patientKey.key)

  const handleSave = async () => {
    console.log({ ...patientInsurance, patientKey: patientKey.key })
    savePatientInsurance({ ...patientInsurance, patientKey: patientKey.key }).unwrap().then(() => {
      refetchInsurance()
      handleClearModal()
    }).catch((error) => {
      console.log(error)
      setPatientInsurance({ ...patientInsurance, primaryInsurance: false })
    });

  };

  useEffect(() => {
    console.log(patientInsurance)
    console.log(relations)
  }, [patientInsurance])

  const handleClearModal = () => {
    onClose();
    setPatientInsurance(newApPatientInsurance)
  };

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



  return (
    <div>
      <Modal size={'lg'} open={open} onClose={handleClearModal} >
        <Modal.Header>
          <Modal.Title>Patient Insurance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div style={{ padding: 15 }}>
            <Form layout="inline" fluid>


              <MyInput
                width={165}
                vr={validationResult}
                column
                fieldLabel="Insurance Provider"
                fieldType="select"
                fieldName="insuranceProviderLkey"
                selectData={docTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}
              />




              <MyInput
                vr={validationResult}
                column
                fieldLabel="Insurance Policy Number"
                fieldName="insurancePolicyNumber"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />

              <MyInput
                vr={validationResult}
                column
                fieldLabel="Group Number"
                fieldName="groupNumber"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />




              <MyInput
                width={165}
                vr={validationResult}
                column
                fieldLabel="Insurance Plan Type"
                fieldType="select"
                fieldName="insurancePlanTypeLkey"
                selectData={docTypeLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />

              <MyInput
                vr={validationResult}
                column
                fieldLabel="Authorization Numbers"
                fieldName="authorizationNumbers"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />


              <MyInput
                vr={validationResult}
                column
                fieldType="date"
                fieldLabel="Expiration Date"
                fieldName="expirationDate"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />


              <MyInput
                vr={validationResult}
                column
                fieldLabel="Remaining Benefits"
                fieldName="remainingBenefits"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />

              <MyInput
                vr={validationResult}
                column
                fieldLabel="Remailing Deductibles"
                fieldName="remailingDeductibles"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                disabled={insuranceBrowsing}

              />

              <MyInput
                width={165}
                vr={validationResult}
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
              />

              <MyInput

                vr={validationResult}
                column
                fieldLabel="Primary Insurance"
                fieldName="primaryInsurance"
                record={patientInsurance}
                setRecord={setPatientInsurance}
                fieldType="checkbox"
                disabled={insuranceBrowsing}

              />
            </Form>

            <br />
            <div className='clickedInputs'>
              <Form
                layout="inline"
                fluid
              >
                <MyInput
                  vr={validationResult}
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
                    vr={validationResult}
                    column
                    fieldLabel="Co Payment Value"
                    fieldName="coPaymentValue"
                    record={patientInsurance}
                    setRecord={setPatientInsurance}
                    disabled={insuranceBrowsing}

                  />


                </div>

              </Form>

              <Form
                layout="inline"
                fluid
              >
                <MyInput
                  vr={validationResult}
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
                    vr={validationResult}
                    column
                    fieldLabel="Co Insurance Value"
                    fieldName="coInsuranceValue"
                    record={patientInsurance}
                    setRecord={setPatientInsurance}
                    disabled={insuranceBrowsing}

                  />
                </div>
              </Form>


              <Form
                layout="inline"
                fluid
              >
                <MyInput
                  vr={validationResult}
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
                    vr={validationResult}
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
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleClearModal} appearance="subtle">
            Cancel
          </Button>
          <Button onClick={handleSave} appearance="primary">
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default InsuranceModal;
