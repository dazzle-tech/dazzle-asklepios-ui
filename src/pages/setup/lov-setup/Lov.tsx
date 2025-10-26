import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { useGetLovsQuery, useSaveLovMutation } from '@/services/setupService';
import { Carousel } from 'rsuite';
import { IoSettingsSharp } from 'react-icons/io5';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApLov } from '@/types/model-types';
import { newApLov } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import LovValues from './LovValues';
import {
  addFilterToListRequest,
  conjureValueBasedOnKeyFromList,
  fromCamelCaseToDBName
} from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditLov from './AddEditLOV';
import MyButton from '@/components/MyButton/MyButton';
import { notify } from '@/utils/uiReducerActions';
import './styles.less';
const Lov = () => {
  const dispatch = useAppDispatch();

  const [lov, setLov] = useState<ApLov>({ ...newApLov });
  const [lovPopupOpen, setLovPopupOpen] = useState(false);
  const [carouselActiveIndex, setCarouselActiveIndex] = useState(0);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
  });
  // Fetch lov list response
  const { data: lovListResponse, isFetching } = useGetLovsQuery(listRequest);
  // Save lov
  const [saveLov, saveLovMutation] = useSaveLovMutation();
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = lovListResponse?.extraNumeric ?? 0;
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'lovCode' },
    { label: 'Name', value: 'lovName' },
    { label: 'Description', value: 'lovDescription' }
  ];
  const divContent = (
    <div className='page-title'>
      <h5><Translate>LOVs</Translate></h5>
    </div>
  );
  dispatch(setPageCode('Lovs'));
  dispatch(setDivContent(divContent));
  const isSelected = rowData => {
    if (rowData && lov && rowData.key === lov.key) {
      return 'selected-row';
    } else return '';
  };

  // Effects
  useEffect(() => {
          const handleResize = () => setWidth(window.innerWidth);
          window.addEventListener('resize', handleResize);
          return () => window.removeEventListener('resize', handleResize);
        }, []);

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
    if (saveLovMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveLovMutation.data]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  // handle click on Add New button 
  const handleLovNew = () => {
    setLovPopupOpen(true);
    setLov({ ...newApLov });
  };
  // handle save lov
  const handleLovSave = () => {
    setLovPopupOpen(false);
    saveLov(lov)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The LOV has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this LOV', sev: 'error' }));
      });
  };
  // handle filter table
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
  // Icons column (Setup Lov Values ,Edite, reactive/Deactivate)
  const iconsForActions = (rowData: ApLov) => (
    <div className="container-of-icons">
      {/* display lov values when click on this icon */}
      <IoSettingsSharp
        className="icons-style"
        title="Setup Lov Values"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setCarouselActiveIndex(1)}
      />
      {/* open edit lov when click on this icon */}
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setLovPopupOpen(true)}
      />
      {/* deactivate/activate  when click on one of these icon */}
      {!rowData?.deletedAt ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
        />
      )}
    </div>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'lovCode',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'lovName',
      title: <Translate>Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'lovDescription',
      title: <Translate>Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'autoSelectDefault',
      title: <Translate>Auto Select Default</Translate>,
      flexGrow: 4,
      render: rowData => <span>{rowData.autoSelectDefault ? 'Yes' : 'No'}</span>
    },
    {
      key: 'defaultValueId',
      title: <Translate>Default Value Key</Translate>,
      flexGrow: 4
    },
    {
      key: 'parentLOV',
      title: <Translate>Parent LOV</Translate>,
      flexGrow: 4,
      render: rowData => (
        <span>
          {conjureValueBasedOnKeyFromList(
            lovListResponse?.object ?? [],
            rowData.parentLov,
            'lovName'
          )}
        </span>
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  return (
    <Carousel
    className='container-of-lov'
      autoplay={false}
      activeIndex={carouselActiveIndex}
    >
      <Panel>
        <div className="container-of-add-new-button">
          <MyButton
            prefixIcon={() => <AddOutlineIcon />}
            color="var(--deep-blue)"
            onClick={handleLovNew}
            width="109px"
          >
            Add New
          </MyButton>
        </div>
        <MyTable
          height={450}
          data={lovListResponse?.object ?? []}
          loading={isFetching}
          columns={tableColumns}
          rowClassName={isSelected}
          filters={filters()}
          onRowClick={rowData => {
            setLov(rowData);
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
        <AddEditLov
          open={lovPopupOpen}
          setOpen={setLovPopupOpen}
          lov={lov}
          setLov={setLov}
          handleSave={handleLovSave}
          width={width}
          lovListResponse={lovListResponse}
        />
      </Panel>
      <LovValues
        lov={lov}
        goBack={() => {
          setCarouselActiveIndex(0);
          setLov({ ...newApLov });
        }}
        width={width}
      />
    </Carousel>
  );
};

export default Lov;
