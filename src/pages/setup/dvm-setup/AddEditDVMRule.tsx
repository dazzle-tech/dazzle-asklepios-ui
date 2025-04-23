import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { useSaveDvmRuleMutation } from '@/services/dvmService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';

const AddEditDVMRule = ({
  open,
  setOpen,
  operationState,
  width,
  dvmRule,
  setDvmRule,
  refetch, 
 
}) => {
  
  //save module
  const [saveDvm] = useSaveDvmRuleMutation();

  const hasSecondRuleValue = () => {
    if (dvmRule.ruleType) {
      switch (dvmRule.ruleType) {
        case 'RANGE':
          return true;
        default:
          return false;
      }
    }
  };

  //handle save module
  const handleSave = async () => {
    setOpen(false);
    await saveDvm({
      ...dvmRule,
      screenMetadataKey: recordOfScreenMetaData['screenMetadataKey']
    }).unwrap();
    if (refetch != null) {
        refetch();
      }
  };
  
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
            <Form fluid>
            {/* <div
            className='header-of-modal'
            >
              <FaClipboardCheck color="#415BE7"
               size={30} />
              <label>DVM Rule info</label>
            </div> */}
            <MyInput
              fieldName="ruleDescription"
              record={dvmRule}
              setRecord={setDvmRule}
              width={520}
            />
            <MyInput
              fieldLabel="Validation Type"
              fieldType="select"
              fieldName="validationType"
              selectData={[
                { l: 'Reject', v: 'REJECT' },
                { l: 'Warning', v: 'WARN' },
                { l: 'Check', v: 'CHECK' }
              ]}
              selectDataLabel="l"
              selectDataValue="v"
              record={dvmRule}
              setRecord={setDvmRule}
              width={520}
            />
            <div
             className='container-of-two-fields'
            >
              <MyInput
                fieldLabel="Field"
                fieldType="select"
                fieldName="fieldKey"
                selectData={metaDataFieldsListResponse?.object ?? []}
                selectDataLabel="fieldName"
                selectDataValue="key"
                record={dvmRule}
                setRecord={setDvmRule}
                width={250}
              />
              <MyInput
                fieldLabel="Rule Type"
                fieldType="select"
                fieldName="ruleType"
                selectData={ruleTypes}
                selectDataLabel="label"
                selectDataValue="value"
                record={dvmRule}
                setRecord={setDvmRule}
                width={250}
              />
            </div>
            <div
            className='container-of-rule-values'
            >
              <div
              //This inline style cannot be removed because it uses dynamic variables
                style={{  
                  visibility:
                    dvmRule.ruleType && dvmRule.ruleType !== 'REQUIRED' ? 'visible' : 'hidden'
                }}
              >
                <MyInput
                  fieldName="ruleValue"
                  record={dvmRule}
                  setRecord={setDvmRule}
                  width={250}
                />
              </div>
              <div
               //This inline style cannot be removed because it uses dynamic variables
                style={{
                  visibility: hasSecondRuleValue() ? 'visible' : 'hidden'
                }}
              >
                <MyInput
                  fieldType="Secondary Rule Value"
                  fieldName="ruleValueTwo"
                  record={dvmRule}
                  setRecord={setDvmRule}
                  width={250}
                />
              </div>
            </div>
            <MyInput
              fieldType="checkbox"
              fieldName="isDependant"
              record={dvmRule}
              setRecord={setDvmRule}
            />
            <div
             //This inline style cannot be removed because it uses dynamic variables
              style={{
                visibility: dvmRule.isDependant ? 'visible' : 'hidden',
                display: 'flex',
                gap: '20px'
              }}
            >
              <MyInput
                fieldLabel="Dependant Rule"
                fieldType="select"
                fieldName="dependantRuleKey"
                selectData={dvmRulesListResponse?.object ?? []}
                selectDataLabel="ruleDescription"
                selectDataValue="key"
                record={dvmRule}
                setRecord={setDvmRule}
                width={250}
              />

              <MyInput
                fieldLabel="Dependant Rule Check"
                fieldType="select"
                fieldName="dependantRuleCheck"
                selectData={[
                  { l: 'Pass', v: 'PASS' },
                  { l: 'Fail', v: 'FAIL' }
                ]}
                selectDataLabel="l"
                selectDataValue="v"
                record={dvmRule}
                setRecord={setDvmRule}
                width={250}
              />
            </div>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={operationState + ' DVM Rule'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'DVM Rule info', icon: faClipboardCheck }]}
      size={width > 600 ? '570px' : '300px'}
    />
  );
};
export default AddEditDVMRule;