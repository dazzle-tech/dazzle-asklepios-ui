import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetScreensQuery } from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdDelete } from 'react-icons/md';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyButton from '@/components/MyButton/MyButton';
import { newApDvmRule } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { useGetDvmRulesQuery, useGetScreenMetadataQuery, useSaveDvmRuleMutation } from '@/services/dvmService';
import { Tabs } from 'rsuite';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import './styles.less';
import MyTable from '@/components/MyTable';
import AddEditDVMRule from './AddEditDVMRule';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
const DVM = () => {
  const dispatch = useAppDispatch();
  const [dvmRule, setDvmRule] = useState({ ...newApDvmRule });
  const [popupOpen, setPopupOpen] = useState(false);
  const [recordOfScreen, setRecordOfScreen] = useState({ screenKey: '' });
  const [recordOfScreenMetaData, setRecordOfScreenMetaData] = useState({ screenMetadataKey: '' });
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [openConfirmDeleteDvm, setOpenConfirmDeleteDvm] = useState<boolean>(false);
  const [stateOfDeleteDvm, setStateOfDeleteDvm] = useState<string>('delete');

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
    pageSize: 15,
    ignore: true
  });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    ignore: true,
    pageSize: 15
  });

  // Fetch screens list response
  const { data: screenListResponse } = useGetScreensQuery(screensListRequest);
  // Fetch screenMetadata list response
  const { data: screenMetadataListResponse } = useGetScreenMetadataQuery(
    screensMetadataListRequest
  );
  // Fetch dvmRules list response
  const { data: dvmRulesListResponse, refetch, isFetching } = useGetDvmRulesQuery(listRequest);
  //save dvm
  const [saveDvm] = useSaveDvmRuleMutation();
  // Page header
  const divContent = (
    <div className="page-title">
      <h5><Translate>Data Validation Manager</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Data_Validation'));
  dispatch(setDivContent(divContent));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = dvmRulesListResponse?.extraNumeric ?? 0;
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
  // update list when filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

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
  const iconsForActions = rowData => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        className="icons-style"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPopupOpen(true);
        }}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteDvm('deactivate');
            setOpenConfirmDeleteDvm(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={21}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteDvm('reactivate');
            setOpenConfirmDeleteDvm(true);
          }}
        />
      )}
    </div>
  );

  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };

  //table columns
  const tableColumns = [
    {
      key: 'validationType',
      title: <Translate>Type</Translate>
    },
    {
      key: 'ruleDescription',
      title: <Translate>Description</Translate>
    },
    {
      key: 'fieldName',
      title: <Translate>Field Name</Translate>
    },
    {
      key: 'fieldDataType',
      title: <Translate>Data Type</Translate>
    },
    {
      key: 'ruleType',
      title: <Translate>Rule Type</Translate>
    },
    {
      key: 'ruleValue',
      title: <Translate>Rule Value</Translate>
    },
    {
      key: 'ruleValueTwo',
      title: <Translate>Secondary Rule Value</Translate>
    },
    {
      key: 'isDependant',
      title: <Translate>Is Dependant</Translate>,
      render: rowData => {
        return <p>{rowData?.isDependant ? 'Yes' : 'No'}</p>;
      }
    },
    {
      key: 'icons',
      title: <Translate>Rule Value</Translate>,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // handle deactivate DVM rule
  const handleDeactivate = () => {
    setOpenConfirmDeleteDvm(false);
     saveDvm({ ...dvmRule, isValid: false })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The DVM rule was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this DVM rule',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate DVM rule
  const handleReactivate = () => {
    setOpenConfirmDeleteDvm(false);
    saveDvm({ ...dvmRule, isValid: true })
      .unwrap()
      .then(() => {
        refetch();
        dispatch(
          notify({
            msg: 'The DVM rule was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this DVM rule',
            sev: 'error'
          })
        );
      });
  };

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid >
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        menuMaxHeight={300}
      />

      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
        menuMaxHeight={300}
      />
    </Form>
  );

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
            menuMaxHeight={300}
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
            menuMaxHeight={300}
          />
        </Form>
      </div>
      <hr />
      <Tabs defaultActiveKey="1" appearance="subtle" className="tabs">
        <Tabs.Tab active eventKey="1" title="Validation Rules">
          <div className="container-of-add-new-button">
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
            loading={isFetching}
            filters={filters()}
            onRowClick={rowData => {
              setDvmRule(rowData);
            }}
            sortColumn={listRequest.sortBy}
            sortType={listRequest.sortType}
            onSortChange={(sortBy, sortType) => {
              if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
            }}
            page={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
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
          <DeletionConfirmationModal
            open={openConfirmDeleteDvm}
            setOpen={setOpenConfirmDeleteDvm}
            itemToDelete="DVM rule"
            actionButtonFunction={
              stateOfDeleteDvm == 'deactivate' ? handleDeactivate : handleReactivate
            }
            actionType={stateOfDeleteDvm}
          />
        </Tabs.Tab>
        <Tabs.Tab eventKey="2" title="Rule Combinations"></Tabs.Tab>
      </Tabs>
    </Panel>
  );
};

export default DVM;
