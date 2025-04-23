import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel} from 'rsuite';
import { useGetMetadataFieldsQuery, useGetScreensQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';
import {
  newApDvmRule
} from '@/types/model-types-constructor';
import { Form} from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetDvmRulesQuery,
  useGetScreenMetadataQuery,
  useSaveDvmRuleMutation
} from '@/services/dvmService';
import { Tabs, Tab } from 'rsuite';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import './styles.less';
import MyTable from '@/components/MyTable';
import MyModal from '@/components/MyModal/MyModal';
const DVM = () => {
  const dispatch = useAppDispatch();

  const [ruleTypes, setRuleTypes] = useState([]);
  const [recordOfScreen, setRecordOfScreen] = useState({ screenKey: '' });
  const [recordOfScreenMetaData, setRecordOfScreenMetaData] = useState({ screenMetadataKey: '' });

  const [screensListRequest, setScreensListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: screenListResponse } = useGetScreensQuery(screensListRequest);

  const [width, setWidth] = useState<number>(window.innerWidth);
  const [screensMetadataListRequest, setScreensMetadataListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(
    screensMetadataListRequest
  );

  const [metaDataFieldsListRequest, setMetaDataFieldsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000,
    ignore: true
  });
  const { data: metaDataFieldsListResponse } = useGetMetadataFieldsQuery(metaDataFieldsListRequest);
  const [metadataFieldMap, setMetadataFieldMap] = useState({});

  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const { data: dvmRulesListResponse, refetch ,isLoading } = useGetDvmRulesQuery(listRequest);

  const [dvmRule, setDvmRule] = useState({ ...newApDvmRule });
  const [saveDvm, saveDvmMutation] = useSaveDvmRuleMutation();
  const [popupOpen, setPopupOpen] = useState(false);
  const divElement = useSelector((state: RootState) => state.div?.divElement);
  const divContent = (
    <div className='title'>
      <h5>Data Validation Manager</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

  const [operationState, setOperationState] = useState('New');

  const filterFields = [
    { label: 'Type', value: 'validationType' },
    { label: 'Description', value: 'ruleDescription' },
    { label: 'Field Name', value: 'fieldName' },
    { label: 'Data Type', value: 'fieldDataType' },
    { label: 'Rule Type', value: 'ruleType' },
    { label: 'Rule Value', value: 'ruleValue' },
    { label: 'Secondary Rule Value', value: 'ruleValueTwo' },
    { label: 'Is Dependant', value: 'isDependant' }
  ];

  const [record, setRecord] = useState({ filter: '', value: '' });

  dispatch(setPageCode('Data_Validation'));
  dispatch(setDivContent(divContentHTML));
  const handleNew = () => {
    setOperationState('New');
    setPopupOpen(true);
    setDvmRule({ ...newApDvmRule });
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDvm({
      ...dvmRule,
      screenMetadataKey: recordOfScreenMetaData['screenMetadataKey']
    }).unwrap();
  };

  useEffect(() => {
    if (recordOfScreen['screenKey']) {
      setScreensMetadataListRequest(
        addFilterToListRequest(
          'screen_key',
          'match',
          recordOfScreen['screenKey'],
          screensMetadataListRequest
        )
      );
    }
  }, [recordOfScreen]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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

  useEffect(() => {
    if (recordOfScreenMetaData['screenMetadataKey']) {
      (screenMetadataListResponse?.object ?? []).map(smd => {
        if (smd.key === recordOfScreenMetaData['screenMetadataKey']) {
          setMetaDataFieldsListRequest(
            addFilterToListRequest(
              'metadata_key',
              'match',
              smd.metadataKey,
              metaDataFieldsListRequest
            )
          );

          setListRequest(
            addFilterToListRequest('screen_metadata_key', 'match', smd.key, listRequest)
          );
        }
      });
    }
  }, [recordOfScreenMetaData['screenMetadataKey']]);
  useEffect(() => {
    let map = {};
    (metaDataFieldsListResponse?.object ?? []).map(mdf => {
      map[mdf.key] = mdf;
    });
    setMetadataFieldMap(map);
  }, [metaDataFieldsListResponse]);

  useEffect(() => {
    if (saveDvmMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveDvmMutation.data]);

  const isSelected = rowData => {
    if (rowData && dvmRule && rowData.key === dvmRule.key) {
      return 'selected-row';
    } else return '';
  };

  const handleFilterChange = (fieldName, value) => {
    if (fieldName) {
      if (value) {
        setListRequest(
          addFilterToListRequest(
            fromCamelCaseToDBName(fieldName),
            'startsWithIgnoreCase',
            value,
            listRequest
          )
        );
      } else {
        setListRequest({ ...listRequest, filters: [] });
      }
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

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

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    handleFilterChange(record['filter'], record['value']);
  }, [record]);

  const iconsForActions = () => (
    <div className='container-of-icons'>
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
          setOperationState('Edit');
        }}
      />
      <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
    </div>
  );

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

  //table columns
  const tableColumns = [
    {
      key: 'validationType',
      title: <Translate>Type</Translate>,
      flexGrow: 2,
      dataKey: 'validationType'
    },
    {
      key: 'ruleDescription',
      title: <Translate>Description</Translate>,
      flexGrow: 4,
      dataKey: 'ruleDescription'
    },
    {
      key: 'fieldName',
      title: <Translate>Field Name</Translate>,
      flexGrow: 3,
      dataKey: 'fieldName'
    },
    {
      key: 'fieldDataType',
      title: <Translate>Data Type</Translate>,
      flexGrow: 3,
      dataKey: 'fieldDataType'
    },
    {
      key: 'ruleType',
      title: <Translate>Rule Type</Translate>,
      flexGrow: 3,
      dataKey: 'ruleType'
    },
    {
      key: 'ruleValue',
      title: <Translate>Rule Value</Translate>,
      flexGrow: 3,
      dataKey: 'ruleValue'
    },
    {
      key: 'ruleValueTwo',
      title: <Translate>Secondary Rule Value</Translate>,
      flexGrow: 3,
      dataKey: 'ruleValueTwo'
    },
    {
      key: 'isDependant',
      title: <Translate>Is Dependant</Translate>,
      flexGrow: 3,
      dataKey: 'isDependant'
    },
    {
      key: 'icons',
      title: <Translate>Rule Value</Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  return (
    <Panel>
      <small className='metadata-selection-title'>
        <Translate>Specify screen metadata to configure validation rules</Translate>
      </small>
      {/* <Form> */}
        <div className='container-of-selects'>
          <Form>
          <MyInput
            fieldName="screenKey"
            fieldType="select"
            placeholder="Select Screen"
            selectData={screenListResponse?.object ?? []}
            selectDataLabel="name"
            selectDataValue="key"
            record={recordOfScreen}
            setRecord={setRecordOfScreen}
            showLabel={false}
          />
          </Form>
          <Form>
          <MyInput
            fieldName="screenMetadataKey"
            fieldType="select"
            placeholder="Select Metadata"
            selectData={screenMetadataListResponse?.object ?? []}
            selectDataLabel="metadataObjectName"
            selectDataValue="key"
            record={recordOfScreenMetaData}
            setRecord={setRecordOfScreenMetaData}
            showLabel={false}
          />
          </Form>
        </div>
      {/* </Form> */}

      <hr />

      <Tabs defaultActiveKey="1" appearance="subtle" className="my-tabs">
        <Tab active eventKey="1" title="Validation Rules">
          {/* <Form
          layout='inline'
          className='form-of-header-actions'
          > */}
            <div className='container-of-header-actions'>
              <div className='container-of-search'>
                {/* <div> */}
                <Form>
                  <MyInput
                    selectDataValue="value"
                    selectDataLabel="label"
                    selectData={filterFields}
                    fieldName={'filter'}
                    fieldType="select"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                    placeholder="Select Filter"
                    width="150px"
                  />
                  </Form>
                {/* </div> */}
                {/* <div> */}
                <Form>
                  <MyInput
                    fieldName="value"
                    fieldType="text"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                    placeholder="Search"
                    width={'220px'}
                  />
                  </Form>
                {/* </div> */}
              </div>
                <MyButton
                   disabled={!recordOfScreenMetaData["screenMetadataKey"]}
                  prefixIcon={() => <AddOutlineIcon />}
                  color="var(--deep-blue)"
                  onClick={handleNew}
                  width='109px'
                >
                  Add New
                </MyButton>
            </div>
          {/* </Form> */}

          <MyTable 
              height={450}
              data={dvmRulesListResponse?.object ?? []}
              columns={tableColumns}
              rowClassName={isSelected}
              loading={isLoading}
              onRowClick={rowData => {
                setDvmRule(rowData);
              }}
              sortColumn={listRequest.sortBy}
              sortType={listRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
              }}
          />
          {/* <Modal open={popupOpen} className="left-modal" size="xsm">
            <Modal.Title>
              <Translate>{operationState} DVM Rule</Translate>
            </Modal.Title>
            <Modal.Body className='modal-body'>
              <Form
                fluid
              >
                <div
                className='header-of-modal'
                >
                  <FaClipboardCheck color="#415BE7"
                   size={30} />
                  <label>DVM Rule info</label>
                </div>
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
            </Modal.Body>
            <Modal.Footer className='modal-footer'>
              <Stack
               className='stack'
                spacing={2}
                divider={<Divider vertical />}
              >
                <MyButton ghost color="var(--deep-blue)" onClick={() => setPopupOpen(false)}>
                  Cancel
                </MyButton>
                <MyButton
                  prefixIcon={() => <FontAwesomeIcon icon={faCheckDouble} />}
                  color="var(--deep-blue)"
                  onClick={handleSave}
                >
                  {operationState === 'New' ? 'Create' : 'Save'}
                </MyButton>
              </Stack>
            </Modal.Footer>
          </Modal> */}


    <MyModal
      open={popupOpen}
      setOpen={setPopupOpen}
      title={operationState + ' DVM Rule'}
      position="right"
      content={conjureFormContent}
      actionButtonLabel={operationState === 'New' ? 'Create' : 'Save'}
      actionButtonFunction={handleSave}
      steps={[{ title: 'DVM Rule info', icon: faClipboardCheck }]}
      size={width > 600 ? '570px' : '300px'}
    />
          {/* <AddEditDVMRule
          open={popupOpen}
          setOpen={setPopupOpen}
          operationState={operationState}
          width={width}
          dvmRule={dvmRule}
          setDvmRule={setDvmRule}
          refetch={refetch} 
          /> */}
        </Tab>
        <Tab eventKey="2" title="Rule Combinations"></Tab>
      </Tabs>
    </Panel>
  );
};

export default DVM;
