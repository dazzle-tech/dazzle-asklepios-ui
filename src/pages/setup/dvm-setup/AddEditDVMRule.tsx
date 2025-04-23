import MyModal from '@/components/MyModal/MyModal';
import React, { useState, useEffect } from 'react';
import { useSaveDvmRuleMutation } from '@/services/dvmService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { useGetMetadataFieldsQuery } from '@/services/setupService';
const AddEditDVMRule = ({
  open,
  setOpen,
  width,
  dvmRule,
  setDvmRule,
  refetch,
  recordOfScreenMetaData,
  dvmRulesListResponse,
  metaDataFieldsListRequest,
  listRequest,
  setListRequest
}) => {
  const [ruleTypes, setRuleTypes] = useState([]);
  const [metadataFieldMap, setMetadataFieldMap] = useState({});
  //save dvm
  const [saveDvm, saveDvmMutation] = useSaveDvmRuleMutation();
  // Fetch metaDataFields list response
  const { data: metaDataFieldsListResponse } = useGetMetadataFieldsQuery(metaDataFieldsListRequest);

  // Effects
  useEffect(() => {
    if (saveDvmMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDvmMutation.data]);

  useEffect(() => {
    let map = {};
    (metaDataFieldsListResponse?.object ?? []).map(mdf => {
      map[mdf.key] = mdf;
    });
    setMetadataFieldMap(map);
  }, [metaDataFieldsListResponse]);

  useEffect(() => {
    if (dvmRule.fieldKey) {
      const mdf = metadataFieldMap[dvmRule.fieldKey];
      if (mdf) {
        const _ruleTypes = [{ label: 'Required', value: 'REQUIRED' }];
        switch (mdf.dataType) {
          case 'numeric':
            _ruleTypes.push({ label: 'Min Value', value: 'MIN_VALUE' });
            _ruleTypes.push({ label: 'Max Value', value: 'MAX_VALUE' });
            _ruleTypes.push({ label: 'Range', value: 'RANGE' });
            break;
          case 'text':
            _ruleTypes.push({ label: 'Min Length', value: 'MIN_LENGTH' });
            _ruleTypes.push({ label: 'Max Length', value: 'MAX_LENGTH' });
            _ruleTypes.push({ label: 'Regular Expression', value: 'REGEX' });
            break;
        }
        setRuleTypes(_ruleTypes);
      }
    }
  }, [dvmRule.fieldKey]);

  // Does the dvmRule have a second rule
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
  // Handle save dvmRule
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
  // modal content
  const conjureFormContent = (stepNumber = 0) => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
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
            <div className="container-of-two-fields-dvm">
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
            <div className="container-of-rule-values">
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
      title={dvmRule?.key ? 'Edit DVM Rule' : 'New DVM Rule'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={dvmRule?.key ? 'Save' : 'Create'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'DVM Rule info', icon: faClipboardCheck }]}
      size={width > 600 ? '570px' : '300px'}
    />
  );
};
export default AddEditDVMRule;
