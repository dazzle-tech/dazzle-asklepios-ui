import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetScreensQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import MyButton from '@/components/MyButton/MyButton';
import { newApDvmRule } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetDvmRulesQuery, useGetScreenMetadataQuery } from '@/services/dvmService';
import { Tabs, Tab } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import './styles.less';
import MyTable from '@/components/MyTable';
import AddEditDVMRule from './AddEditDVMRule';
const DVM = () => {
  const dispatch = useAppDispatch();
  const [dvmRule, setDvmRule] = useState({ ...newApDvmRule });
  const [popupOpen, setPopupOpen] = useState(false);
  const [record, setRecord] = useState({ filter: '', value: '' });
  const [recordOfScreen, setRecordOfScreen] = useState({ screenKey: '' });
  const [recordOfScreenMetaData, setRecordOfScreenMetaData] = useState({ screenMetadataKey: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);

// Initialize list request with default filters
  const [screensListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  const [screensMetadataListRequest, setScreensMetadataListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  const [metaDataFieldsListRequest, setMetaDataFieldsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000,
    ignore: true
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true
  });
  

  // Fetch screens list response
  const { data: screenListResponse } = useGetScreensQuery(screensListRequest);
  // Fetch screenMetadata list response
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(
    screensMetadataListRequest
  );
  // Fetch dvmRules list response
  const { data: dvmRulesListResponse, refetch, isLoading } = useGetDvmRulesQuery(listRequest);

  // Page header
  const divContent = (
    <div className="title-dvm">
      <h5>Data Validation Manager</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Data_Validation'));
  dispatch(setDivContent(divContentHTML));
  // Fields that can be used for filtering
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

  // Effects
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
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  useEffect(() => {
    handleFilterChange(record['filter'], record['value']);
  }, [record]);

  // Handle click on Add New button
  const handleNew = () => {
    setPopupOpen(true);
    setDvmRule({ ...newApDvmRule });
  };
  // ClassName for selected row
  const isSelected = rowData => {
    if (rowData && dvmRule && rowData.key === dvmRule.key) {
      return 'selected-row';
    } else return '';
  };
  // Filter table
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
  //icons column (edit, deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons-dvm">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
      <MdDelete title="Deactivate" size={24} fill="var(--primary-pink)" />
    </div>
  );

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
      <small className="metadata-selection-title">
        <Translate>Specify screen metadata to configure validation rules</Translate>
      </small>
      <div className="container-of-selects-dvm">
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
      <hr />
      <Tabs defaultActiveKey="1" appearance="subtle" className="tabs">
        <Tab active eventKey="1" title="Validation Rules">
          <div className="container-of-header-actions-dvm">
            <div className="container-of-search-dvm">
              <Form layout='inline'>
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
              <Form layout='inline'>
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
            </div>
            <MyButton
              disabled={!recordOfScreenMetaData['screenMetadataKey']}
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
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
          <AddEditDVMRule
            open={popupOpen}
            setOpen={setPopupOpen}
            width={width}
            dvmRule={dvmRule}
            setDvmRule={setDvmRule}
            refetch={refetch}
            recordOfScreenMetaData={recordOfScreenMetaData}
            dvmRulesListResponse={dvmRulesListResponse}
            metaDataFieldsListRequest={metaDataFieldsListRequest}
            listRequest={listRequest}
            setListRequest={setListRequest}
          />
        </Tab>
        <Tab eventKey="2" title="Rule Combinations"></Tab>
      </Tabs>
    </Panel>
  );
};

export default DVM;
