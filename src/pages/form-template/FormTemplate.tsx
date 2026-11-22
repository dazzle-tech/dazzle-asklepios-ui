import Translate from '@/components/Translate';
import React, { useEffect, useState } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { useDispatch, useSelector } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { conjureValueBasedOnIDFromList } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { FormTemplate } from '@/types/model-types-new';
import { newFormTemplate } from '@/types/model-types-constructor-new';

import {
  useDeleteFormTemplateMutation,
  useGetFormTemplatesQuery
} from '@/services/setup/formTemplateService'; // adjust path

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetDepartmentsQuery } from '@/services/security/departmentService';

// Optional: your Add/Edit popup component (if you have it)
// import AddEditFormTemplate from './AddEditFormTemplate';

import './styles.less';
// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to the list endpoint and combined with AND.
const emptyHeaderFilters = { name: '', facilityId: '', departmentId: '', description: '' };
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const FormTemplates = () => {
  const dispatch = useDispatch();

  // if you have dark mode, keep it like your other screens
  const mode = useSelector((state: any) => state.ui.mode);
  const navigate = useNavigate();
  const [popupOpen, setPopupOpen] = useState(false);
  const [template, setTemplate] = useState<FormTemplate>({ ...newFormTemplate });

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

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
  // Empty filters are left out; the endpoint calls the name filter "q"
  const listParams = Object.fromEntries(
    Object.entries({
      q: appliedFilters.name.trim(),
      facilityId: appliedFilters.facilityId,
      departmentId: appliedFilters.departmentId,
      description: appliedFilters.description.trim()
    }).filter(([, v]) => v !== '')
  );
  const { data: listResponse, isFetching } = useGetFormTemplatesQuery({ ...paginationParams, params: listParams });

  const totalCount = listResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;


  // Facilities for filter (same as departments)
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});
  // Departments for filter (if you have a "get all departments" endpoint; otherwise filter by facility)
    const [paginationParam, setPaginationParam] = useState({
      page: 0,
      size: 1000,
      sort: 'id,asc'
    });
  
    const { data: departmentListResponse } = useGetDepartmentsQuery(paginationParam);

  // Delete
  const [deleteTemplate, deleteMutation] = useDeleteFormTemplateMutation();

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  const facilityOptions = (facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }));
  const departmentOptions = (departmentListResponse?.data ?? []).map((d: any) => ({ label: d.name, value: String(d.id) }));

  const handleNew = () => {
    setTemplate({ ...newFormTemplate });
    setPopupOpen(true);
    navigate('/form-template/new');
  };

  const handleDelete = (row: FormTemplate) => {
    if (!row?.id) return;

    deleteTemplate(row.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Template deleted successfully', sev: 'success' }));
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      })
      .catch(() => dispatch(notify({ msg: 'Failed to delete template', sev: 'error' })));
  };

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
          navigate(`/form-template/${rowData.id}`);
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
      width: 220,
      ...headerSearch('name')
    },
    {
      key: 'facilityId',
      title: <Translate key="FACILITY_NAME">Facility</Translate>,
      width: 200,
      ...headerSelect('facilityId', facilityOptions),
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
      width: 200,
      ...headerSelect('departmentId', departmentOptions),
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
      width: 260,
      ...headerSearch('description')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: FormTemplate) => iconsForActions(rowData)
    }
  ];

  const isSelected = (rowData: any) => (rowData?.id === template?.id ? 'selected-row' : '');

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);

    setPaginationParams({
      ...paginationParams,
      size: newSize,
      page: 0,
      timestamp: Date.now()
    });
  };

          // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel className={mode === 'dark' ? 'dashboard-dark' : ''} dir={dir}>
      <MyTable
        data={listResponse?.data ?? []}
        totalCount={totalCount}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(rowData: any) => setTemplate(rowData)}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
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
