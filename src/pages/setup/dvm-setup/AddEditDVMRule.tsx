import MyModal from '@/components/MyModal/MyModal';
import React, { useState, useEffect } from 'react';
import { useSaveDvmRuleMutation } from '@/services/dvmService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import { useGetMetadataFieldsQuery } from '@/services/setupService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
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
  const dispatch = useAppDispatch();
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
    try {
      setOpen(false);
      await saveDvm({
        ...dvmRule,
        screenMetadataKey: recordOfScreenMetaData['screenMetadataKey']
      }).unwrap();
      if (refetch != null) {
        refetch();
      }
      dispatch(notify({ msg: 'Saved Successfully', sev: 'success' }));
    } catch (error) {
      dispatch(notify({ msg: 'Error while saving DVM', sev: 'error' }));

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
              width="100%"
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
              width="100%"
            />
            <div className="container-of-two-fields-dvm">
              <div className='container-of-field-dvm '>
              <MyInput
                fieldLabel="Field"
                fieldType="select"
                fieldName="fieldKey"
                selectData={metaDataFieldsListResponse?.object ?? []}
                selectDataLabel="fieldName"
                selectDataValue="key"
                record={dvmRule}
                setRecord={setDvmRule}
               width="100%"
                menuMaxHeight={200}
              />
              </div>
              <div className='container-of-field-dvm '>
              <MyInput
                fieldLabel="Rule Type"
                fieldType="select"
                fieldName="ruleType"
                selectData={ruleTypes}
                selectDataLabel="label"
                selectDataValue="value"
                record={dvmRule}
                setRecord={setDvmRule}
                width="100%"
                menuMaxHeight={200}
              />
              </div>
            </div>
            <br/>
            <div className="container-of-two-fields-dvm">
              <div
              className='container-of-field-dvm '
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
              className='container-of-field-dvm '
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
               className='container-of-two-fields-dvm'
              //This inline style cannot be removed because it uses dynamic variables
              style={{
                visibility: dvmRule.isDependant ? 'visible' : 'hidden',
                display: 'flex',
                gap: '20px'
              }}
            >
              <div className='container-of-field-dvm '>
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
              </div>
              <div className='container-of-field-dvm '>
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
      steps={[{ title: 'DVM Rule info', icon: <FontAwesomeIcon icon={faClipboardCheck} /> }]}
      size={width > 600 ? '36vw' : '70vw'}
    />
  );
};
export default AddEditDVMRule;
