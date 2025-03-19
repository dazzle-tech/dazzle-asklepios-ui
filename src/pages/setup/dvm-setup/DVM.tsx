import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Input, InputPicker, Modal, Pagination, Panel, Table } from 'rsuite';
const { Column, HeaderCell, Cell } = Table;
import { useGetMetadataFieldsQuery, useGetScreensQuery } from '@/services/setupService';
import { Button, ButtonToolbar, IconButton } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApFacility } from '@/types/model-types';
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
import { Tab, TabList, TabPanel, Tabs } from 'react-tabs';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
const DVM = () => {
  const dispatch = useAppDispatch();

  const [ruleTypes, setRuleTypes] = useState([]);
  const [screenKey, setScreenKey] = useState('');
  const [screenMetadataKey, setScreenMetadataKey] = useState('');

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
    <div style={{ display: 'flex' }}>
      <h5>Data Validation Manager</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Data_Validation'));
  dispatch(setDivContent(divContentHTML));
  const handleNew = () => {
    setPopupOpen(true);
    setDvmRule({ ...newApDvmRule });
  };

  const handleSave = () => {
    setPopupOpen(false);
    saveDvm({ ...dvmRule, screenMetadataKey: screenMetadataKey }).unwrap();
  };

  useEffect(() => {
    if (screenKey) {
      setScreensMetadataListRequest(
        addFilterToListRequest('screen_key', 'match', screenKey, screensMetadataListRequest)
      );
    }
  }, [screenKey]);

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
    if (screenMetadataKey) {
      (screenMetadataListResponse?.object ?? []).map(smd => {
        if (smd.key === screenMetadataKey) {
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
  }, [screenMetadataKey]);
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
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <Panel style={{background: 'white'}}
    >
      <small style={{ display: 'block', marginBottom: '10px' }}>
        <Translate>Specify screen metadata to configure validation rules</Translate>
      </small>
      <InputPicker
        placeholder="Select Screen"
        value={screenKey}
        data={screenListResponse?.object ?? []}
        labelKey="name"
        valueKey="key"
        onChange={v => setScreenKey(v)}
      />

      <Divider vertical />

      <InputPicker
        placeholder="Select Metadata"
        value={screenMetadataKey}
        data={screenMetadataListResponse?.object ?? []}
        labelKey="metadataObjectName"
        valueKey="key"
        onChange={v => setScreenMetadataKey(v)}
      />
      <hr />

      <Tabs>
        <TabList>
          <Tab>Validation Rules</Tab>
          <Tab>Rule Combinations</Tab>
        </TabList>

        <TabPanel>
          <ButtonToolbar>
            <IconButton
              disabled={!screenMetadataKey}
              appearance="primary"
              icon={<AddOutlineIcon />}
              onClick={handleNew}
            >
              Add New
            </IconButton>
            <IconButton
              disabled={!dvmRule.key}
              appearance="primary"
              onClick={() => setPopupOpen(true)}
              color="green"
              icon={<EditIcon />}
            >
              Edit Selected
            </IconButton>
            <IconButton
              disabled={true || !dvmRule.key}
              appearance="primary"
              color="red"
              icon={<TrashIcon />}
            >
              Delete Selected
            </IconButton>
          </ButtonToolbar>
          <hr />
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
            headerHeight={80}
            rowHeight={60}
            bordered
            cellBordered
            data={dvmRulesListResponse?.object ?? []}
            onRowClick={rowData => {
              setDvmRule(rowData);
            }}
            rowClassName={isSelected}
          >
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('validationType', e)} />
                <Translate>Type</Translate>
              </HeaderCell>
              <Cell dataKey="validationType" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('ruleDescription', e)} />
                <Translate>Description</Translate>
              </HeaderCell>
              <Cell dataKey="ruleDescription" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('fieldName', e)} />
                <Translate>Field Name</Translate>
              </HeaderCell>
              <Cell dataKey="fieldName" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('fieldDataType', e)} />
                <Translate>Data Type</Translate>
              </HeaderCell>
              <Cell dataKey="fieldDataType" />
            </Column>
            <Column sortable flexGrow={3}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('ruleType', e)} />
                <Translate>Rule Type</Translate>
              </HeaderCell>
              <Cell dataKey="ruleType" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('ruleValue', e)} />
                <Translate>Rule Value</Translate>
              </HeaderCell>
              <Cell dataKey="ruleValue" />
            </Column>
            <Column sortable flexGrow={4}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('ruleValueTwo', e)} />
                <Translate>Secondary Rule Value</Translate>
              </HeaderCell>
              <Cell dataKey="ruleValueTwo" />
            </Column>
            <Column sortable flexGrow={2}>
              <HeaderCell>
                <Input onChange={e => handleFilterChange('isDependant', e)} />
                <Translate>Is Dependant</Translate>
              </HeaderCell>
              <Cell dataKey="isDependant" />
            </Column>
          </Table>

          <Modal open={popupOpen} overflow>
            <Modal.Title>
              <Translate>New/Edit DVM Rule</Translate>
            </Modal.Title>
            <Modal.Body>
              <Form fluid>
                <MyInput fieldName="ruleDescription" record={dvmRule} setRecord={setDvmRule} />
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
                />
                <MyInput
                  fieldLabel="Field"
                  fieldType="select"
                  fieldName="fieldKey"
                  selectData={metaDataFieldsListResponse?.object ?? []}
                  selectDataLabel="fieldName"
                  selectDataValue="key"
                  record={dvmRule}
                  setRecord={setDvmRule}
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
                />
                {dvmRule.ruleType && dvmRule.ruleType !== 'REQUIRED' && (
                  <MyInput fieldName="ruleValue" record={dvmRule} setRecord={setDvmRule} />
                )}
                {hasSecondRuleValue() && (
                  <MyInput
                    fieldType="Secondary Rule Value"
                    fieldName="ruleValueTwo"
                    record={dvmRule}
                    setRecord={setDvmRule}
                  />
                )}
                <MyInput
                  fieldType="checkbox"
                  fieldName="isDependant"
                  record={dvmRule}
                  setRecord={setDvmRule}
                />
                {dvmRule.isDependant && (
                  <MyInput
                    fieldLabel="Dependant Rule"
                    fieldType="select"
                    fieldName="dependantRuleKey"
                    selectData={dvmRulesListResponse?.object ?? []}
                    selectDataLabel="ruleDescription"
                    selectDataValue="key"
                    record={dvmRule}
                    setRecord={setDvmRule}
                  />
                )}
                {dvmRule.isDependant && (
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
                  />
                )}
              </Form>
            </Modal.Body>
            <Modal.Footer>
              <Stack spacing={2} divider={<Divider vertical />}>
                <Button appearance="primary" onClick={handleSave}>
                  Save
                </Button>
                <Button appearance="primary" color="red" onClick={() => setPopupOpen(false)}>
                  Cancel
                </Button>
              </Stack>
            </Modal.Footer>
          </Modal>
        </TabPanel>
      </Tabs>
    </Panel>
  );
};

export default DVM;
