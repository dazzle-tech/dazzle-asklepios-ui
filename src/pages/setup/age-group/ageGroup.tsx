import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import { Form, Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useSaveAgeGroupMutation, useGetAgeGroupQuery } from '@/services/setupService';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import { ApAgeGroup } from '@/types/model-types';
import { newApAgeGroup } from '@/types/model-types-constructor';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAgeGroup from './AddEditAgeGroup';
import MyInput from '@/components/MyInput';
import './styles.less';
const AgeGroup = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [agegroups, setAgeGroups] = useState<ApAgeGroup>({ ...newApAgeGroup });
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest });
  // Fetch age groups list response
  const { data: ageGroupsListResponse, isFetching } = useGetAgeGroupQuery(listRequest);
  // save age group
  const [saveAgeGroups, saveAgeGroupsMutation] = useSaveAgeGroupMutation();
  // Header page setUp
  const divContent = (
    <div className='page-title'>
      <h5>Age Group</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Age_Group'));
  dispatch(setDivContent(divContentHTML));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = ageGroupsListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Age Group', value: 'ageGroupLkey' },
    { label: 'From Age', value: 'fromAge' },
    { label: 'To Age', value: 'toAge' }
  ];
  // class name for selected row
  const isSelected = rowData => {
    if (rowData && agegroups && rowData.key === agegroups.key) {
      return 'selected-row';
    } else return '';
  };

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid>
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
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );
  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = (rowData: ApAgeGroup) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />

      {rowData?.isValid ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
        />
      ) : (
        <FaUndo className="icons-style" title="Activate" size={24} fill="var(--primary-gray)" />
      )}
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'ageGroupLkey',
      title: <Translate>Age Group</Translate>,
      flexGrow: 4,
      render: rowData =>
        ` ${rowData.ageGroupLvalue ? rowData.ageGroupLvalue.lovDisplayVale : rowData.ageGroupLkey}`
    },
    {
      key: 'fromAge',
      title: <Translate>Age From Unit</Translate>,
      flexGrow: 4,
      render: rowData =>
        `${rowData.fromAge} ${
          rowData.fromAgeUnitLvalue
            ? rowData.fromAgeUnitLvalue.lovDisplayVale
            : rowData.fromAgeUnitLkey
        }`
    },
    {
      key: 'toAge',
      title: <Translate>Age To Unit</Translate>,
      flexGrow: 4,
      render: rowData =>
        `${rowData.toAge} ${
          rowData.toAgeUnitLvalue ? rowData.toAgeUnitLvalue.lovDisplayVale : rowData.toAgeUnitLkey
        }`
    },
    {
      key: 'isValid',
      title: <Translate>status</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.isValid ? 'active' : 'deactive')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];
  // handle change filter in table
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'containsIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

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
  // handle click on add new button
  const handleNew = () => {
    setAgeGroups({ ...newApAgeGroup, fromAge: null, toAge: null });
    setPopupOpen(true);
  };
  // handle save age group
  const handleSave = async () => {
    setPopupOpen(false);
    //if you want to use response object write response.object
    try {
      await saveAgeGroups(agegroups).unwrap();
      dispatch(notify({ msg: 'The Age Group has been saved successfully', sev: 'success' }));
    } catch (error) {
      if (error.data && error.data.message) {
        // Display error message from server
        dispatch(notify(error.data.message));
      } else {
        // Generic error notification
        dispatch(notify('An unexpected error occurred'));
      }
    }
  };

  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
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
  // update list when  the age group
  useEffect(() => {
    if (saveAgeGroupsMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveAgeGroupsMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
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
        data={ageGroupsListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setAgeGroups(rowData);
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
      <AddEditAgeGroup
        open={popupOpen}
        setOpen={setPopupOpen}
        agegroups={agegroups}
        setAgeGroups={setAgeGroups}
        handleSave={handleSave}
        width={width}
      />
    </Panel>
  );
};
export default AgeGroup;
