import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import { useDispatch, useSelector } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { conjureValueBasedOnIDFromList } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { FormTemplate } from '@/types/model-types-new';
import { newFormTemplate } from '@/types/model-types-constructor-new';

import {
  useGetFormTemplateQuery,
  useLazyGetFormTemplatesByFacilityQuery,
  useLazyGetFormTemplatesByDepartmentQuery,
  useLazyGetFormTemplatesByNameQuery,
  useDeleteFormTemplateMutation,
  useGetFormTemplatesQuery
} from '@/services/setup/formTemplateService'; // adjust path

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';

// Optional: your Add/Edit popup component (if you have it)
// import AddEditFormTemplate from './AddEditFormTemplate';

import './styles.less';
const FormTemplates = () => {
  const dispatch = useDispatch();

  // if you have dark mode, keep it like your other screens
  const mode = useSelector((state: any) => state.ui.mode);
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [template, setTemplate] = useState<FormTemplate>({ ...newFormTemplate });

  const [record, setRecord] = useState<{ filter: string; value: any }>({ filter: '', value: '' });

  const [templateList, setTemplateList] = useState<FormTemplate[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [isFiltered, setIsFiltered] = useState(false);

  const [linksState, setLinksState] = useState<{
    next?: string | null;
    prev?: string | null;
    first?: string | null;
    last?: string | null;
  }>({});

  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  // Header setup
  useEffect(() => {
    dispatch(setPageCode('FormTemplates'));
    dispatch(setDivContent('Form Templates'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Main list
  const { data: listResponse, isFetching } = useGetFormTemplatesQuery(paginationParams);

  const totalCount = listResponse?.totalCount ?? 0;
  const links = listResponse?.links || {};
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  useEffect(() => {
    if (listResponse?.links) setLinksState(listResponse.links);
  }, [listResponse?.links]);

  // Facilities for filter (same as departments)
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  // Departments for filter (if you have a "get all departments" endpoint; otherwise filter by facility)
    const [paginationParam, setPaginationParam] = useState({
      page: 0,
      size: 1000,
      sort: 'id,asc'
    });
  
    const { data: departmentListResponse } = useGetDepartmentsQuery(paginationParam);

  // Filter hooks (lazy)
  const [getByFacility] = useLazyGetFormTemplatesByFacilityQuery();
  const [getByDepartment] = useLazyGetFormTemplatesByDepartmentQuery();
  const [getByName] = useLazyGetFormTemplatesByNameQuery();

  // Delete
  const [deleteTemplate, deleteMutation] = useDeleteFormTemplateMutation();

  const filterFields = [
    { label: 'Facility', value: 'facilityId' },
    { label: 'Department', value: 'departmentId' },
    { label: 'Template Name', value: 'name' }
  ];

  const handleNew = () => {
    setTemplate({ ...newFormTemplate });
    setPopupOpen(true);
    navigate('../new');  
  };

  const handleDelete = (row: FormTemplate) => {
    if (!row?.id) return;

    deleteTemplate(row.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Template deleted successfully', sev: 'success' }));
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
        // if you were filtered, refresh filter results too:
        if (isFiltered) {
          handleFilterChange(record.filter, record.value, filterPagination.page, filterPagination.size);
        }
      })
      .catch(() => dispatch(notify({ msg: 'Failed to delete template', sev: 'error' })));
  };

  const handleFilterChange = async (fieldName: string, value: any, page = 0, size = filterPagination.size) => {
    if (!value) {
      setTemplateList(listResponse?.data ?? []);
      setIsFiltered(false);
      setFilteredTotal(0);
      setFilterPagination(prev => ({ ...prev, page: 0 }));
      setLinksState(links ?? {});
      return;
    }

    try {
      let response: any;

      if (fieldName === 'facilityId') {
        response = await getByFacility({ facilityId: value, page, size, sort: filterPagination.sort }).unwrap();
      } else if (fieldName === 'departmentId') {
        response = await getByDepartment({ departmentId: value, page, size, sort: filterPagination.sort }).unwrap();
      } else if (fieldName === 'name') {
        response = await getByName({ name: value, page, size, sort: filterPagination.sort }).unwrap();
      }

      setTemplateList(response?.data ?? []);
      setIsFiltered(true);
      setFilteredTotal(response?.totalCount ?? 0);
      setFilterPagination(prev => ({ ...prev, page, size }));
      setLinksState(response?.links ?? {});
    } catch (e) {
      console.error(e);
      setTemplateList([]);
      setIsFiltered(false);
      setFilteredTotal(0);
    }
  };

  // const filters = () => {
  //   const selectedFilter = record.filter;
  //   let dynamicInput: any = null;

  //   if (selectedFilter === 'facilityId') {
  //     dynamicInput = (
  //       <MyInput
  //         width={220}
  //         fieldLabel=""
  //         fieldName="value"
  //         fieldType="select"
  //         selectData={facilityListResponse ?? []}
  //         selectDataLabel="name"
  //         selectDataValue="id"
  //         record={record}
  //         setRecord={setRecord}
  //         showLabel={false}
  //         searchable
  //       />
  //     );
  //   } else if (selectedFilter === 'departmentId') {
  //     dynamicInput = (
  //       <MyInput
  //         width={220}
  //         fieldLabel=""
  //         fieldName="value"
  //         fieldType="select"
  //         selectData={departmentListResponse?.data ?? []}
  //         selectDataLabel="name"
  //         selectDataValue="id"
  //         record={record}
  //         setRecord={setRecord}
  //         showLabel={false}
  //         searchable
  //       />
  //     );
  //   } else {
  //     dynamicInput = (
  //       <MyInput
  //         width={220}
  //         fieldName="value"
  //         fieldLabel=""
  //         fieldType="text"
  //         record={record}
  //         setRecord={setRecord}
  //         showLabel={false}
  //         placeholder="Enter Value"
  //       />
  //     );
  //   }

  //   return (
  //     <Form layout="inline" fluid style={{ display: 'flex', gap: '10px' }}>
  //       <MyInput
  //         selectDataValue="value"
  //         selectDataLabel="label"
  //         selectData={filterFields}
  //         fieldName="filter"
  //         fieldType="select"
  //         record={record}
  //         setRecord={(updatedRecord: any) =>
  //           setRecord({
  //             filter: updatedRecord.filter,
  //             value: ''
  //           })
  //         }
  //         showLabel={false}
  //         placeholder="Select Filter"
  //         searchable={false}
  //         width={200}
  //       />

  //       {dynamicInput}

  //       <MyButton
  //         color="var(--deep-blue)"
  //         onClick={() => handleFilterChange(record.filter, record.value)}
  //         width="80px"
  //       >
  //         Search
  //       </MyButton>
  //     </Form>
  //   );
  // };

  const iconsForActions = (rowData: FormTemplate) => (
    <div className="container-of-icons">
      <MdModeEdit
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        className="icons-style"
        onClick={() => {
          setTemplate(rowData);
          setPopupOpen(true);
          navigate(`../${rowData.id}`);
        }}
      />

      <MdDelete
        title="Delete"
        size={24}
        fill="var(--primary-pink)"
        className="icons-style"
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  const tableColumns = [
    {
      key: 'name',
      title: <Translate key="TEMPLATE_NAME">Template Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'facilityId',
      title: <Translate key="FACILITY_NAME">Facility</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            facilityListResponse ?? [],
            rowData.facilityId,
            'name'
          )}
        </span>
      )
    },
    {
      key: 'departmentId',
      title: <Translate key="DEPARTMENT_NAME">Department</Translate>,
      flexGrow: 4,
      render: (rowData: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            departmentListResponse?.data ?? [],
            rowData.departmentId,
            'name'
          )}
        </span>
      )
    },
       {
      key: 'description',
      title: <Translate key="TEMPLATE_DESCRIPTION">Description</Translate>,
      flexGrow: 4
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: FormTemplate) => iconsForActions(rowData)
    }
  ];

  const isSelected = (rowData: any) => (rowData?.id === template?.id ? 'selected-row' : '');

  const handlePageChange = (event: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(record.filter, record.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(event, newPage, paginationParams, linksState, setPaginationParams);
    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(record.filter, record.value, 0, newSize);
    } else {
      setPaginationParams({
        ...paginationParams,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      });
    }
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''} dir={dir}>
      <MyTable
        data={isFiltered ? templateList ?? [] : listResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => setTemplate(rowData)}
        // filters={filters()}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        loading={deleteMutation.isLoading || isFetching}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="120px"
            >
              <Translate key="ADD_NEW">Add New</Translate>
            </MyButton>
          </div>
        }
      />

      {/* If you already have Add/Edit popup, plug it here */}
      {/*
      <AddEditFormTemplate
        open={popupOpen}
        setOpen={setPopupOpen}
        template={template}
        setTemplate={setTemplate}
      />
      */}
    </Panel>
  );
};

export default FormTemplates;
