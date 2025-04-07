import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, InputPicker, Modal, Pagination, Panel, Table, InputGroup } from 'rsuite';
import SearchIcon from '@rsuite/icons/Search';
const { Column, HeaderCell, Cell } = Table;
import { useGetMetadataFieldsQuery, useGetScreensQuery } from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { MdDelete } from 'react-icons/md';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { ApFacility } from '@/types/model-types';
import { FaClipboardCheck } from 'react-icons/fa6';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckDouble } from '@fortawesome/free-solid-svg-icons';
import MyButton from '@/components/MyButton/MyButton';
import {
  newApDvmRule,
  newApFacility,
  newApScreen,
  newApScreenMetadata
} from '@/types/model-types-constructor';
import { Form, Stack, Divider } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import {
  useGetDvmRulesQuery,
  useGetScreenMetadataQuery,
  useSaveDvmRuleMutation
} from '@/services/dvmService';
// import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { Nav, VStack } from 'rsuite';
import { Tabs } from 'rsuite';
import { Tab } from 'rsuite';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import './styles.less';
const DVM = () => {
  const dispatch = useAppDispatch();

  const [ruleTypes, setRuleTypes] = useState([]);
  // const [screenKey, setScreenKey] = useState('');
  const [recordOfScreen, setRecordOfScreen] = useState({ screenKey: '' });
  // const [screenMetadataKey, setScreenMetadataKey] = useState('');
  const [recordOfScreenMetaData, setRecordOfScreenMetaData] = useState({ screenMetadataKey: '' });

  const [screensListRequest, setScreensListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const { data: screenListResponse } = useGetScreensQuery(screensListRequest);

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
  const { data: dvmRulesListResponse } = useGetDvmRulesQuery(listRequest);

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

  return (
    <Panel>
      <small className='metadata-selection-title'>
        <Translate>Specify screen metadata to configure validation rules</Translate>
      </small>
      <Form>
        <div className='container-of-selects'>
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

          <Divider vertical />
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
        </div>
      </Form>

      <hr />

      <Tabs defaultActiveKey="1" appearance="subtle">
        <Tab active eventKey="1" title="Validation Rules">
          <Form
          className='form-of-header-actions'
          >
            <div className='container-of-header-actions'>
              <div className='container-of-search'>
                <div>
                  <MyInput
                    selectDataValue="value"
                    selectDataLabel="label"
                    selectData={filterFields}
                    fieldName={'filter'}
                    fieldType="select"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                    placeholder="select filter"
                    width="150px"
                  />
                </div>
                <div>
                  <MyInput
                    fieldName="value"
                    fieldType="text"
                    record={record}
                    setRecord={setRecord}
                    showLabel={false}
                    placeholder="Search"
                    width={'220px'}
                  />
                </div>
              </div>
                <MyButton
                   disabled={!recordOfScreenMetaData["screenMetadataKey"]}
                  prefixIcon={() => <AddOutlineIcon />}
                  color="var(--deep-blue)"
                  onClick={handleNew}
                  width='109px'
                  height='32px'
                >
                  Add New
                </MyButton>
            </div>
          </Form>

          <Table
            height={400}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortColumn={(sortBy, sortType) => {
              if (sortBy)
                setListRequest({
                  ...listRequest,
                  sortBy,
                  sortType
                });
            }}
            data={dvmRulesListResponse?.object ?? []}
            onRowClick={rowData => {
              setDvmRule(rowData);
            }}
            rowClassName={isSelected}
          >
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>Type</Translate>
              </HeaderCell>
              <Cell dataKey="validationType" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell dataKey="ruleDescription" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Translate>Field Name</Translate>
              </HeaderCell>
              <Cell dataKey="fieldName" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Translate>Data Type</Translate>
              </HeaderCell>
              <Cell dataKey="fieldDataType" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Translate>Rule Type</Translate>
              </HeaderCell>
              <Cell dataKey="ruleType" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Rule Value</Translate>
              </HeaderCell>
              <Cell dataKey="ruleValue" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Translate>Secondary Rule Value</Translate>
              </HeaderCell>
              <Cell dataKey="ruleValueTwo" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Translate>Is Dependant</Translate>
              </HeaderCell>
              <Cell dataKey="isDependant" />
            </Column>

            <Column flexGrow={2}>
              <HeaderCell></HeaderCell>
              <Cell>{rowData => iconsForActions(rowData)}</Cell>
            </Column>
          </Table>

          <Modal open={popupOpen} className="left-modal" size="xsm">
            <Modal.Title>
              <Translate>{operationState} DVM Rule</Translate>
            </Modal.Title>
            <Modal.Body style={{ marginBottom: '50px' }}>
              <Form
                fluid
                style={{
                  padding: '1px'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignContent: 'center',
                    alignItems: 'center',
                    marginBottom: '40px'
                  }}
                >
                  <FaClipboardCheck color="#415BE7" style={{ marginBottom: '10px' }} size={30} />
                  <label style={{ fontWeight: 'bold', fontSize: '14px' }}>DVM Rule info</label>
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
                  style={{
                    display: 'flex',
                    gap: '20px'
                  }}
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
                  style={{
                    display: 'flex',
                    gap: '20px',
                    marginBottom: '20px'
                  }}
                >
                  <div
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
            <Modal.Footer>
              <Stack
                style={{ display: 'flex', justifyContent: 'flex-end' }}
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
          </Modal>
        </Tab>
        <Tab eventKey="2" title="Rule Combinations"></Tab>
      </Tabs>
    </Panel>
  );
};

export default DVM;
