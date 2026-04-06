import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import EditAvailabilityTemplateModalNew from './AddEditAvailabilityTemplate';
import AvailabilityIntervalCard from './AvailabilityIntervalCard';
import AvailabilityTemplateSummaryCard from './AvailabilityTemplateSummaryCard';
import SlotCard from './SlotCard';
import DateNavigator from './DateNavigator';
import WarningMessage from './WarningMessage';
import {
  useGetAvailabilityTemplatesByTemplateTypeQuery,
  useGetAvailabilityTemplatesQuery,
  useToggleAvailabilityTemplateActiveMutation
} from '@/services/appointment/availabilityTemplateService';
import { useGetActiveFacilitiesQuery, useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import { useGetAllDepartmentsWithoutPaginationQuery, useGetDepartmentByFacilityQuery } from '@/services/security/departmentService';
import { FaUndo } from "react-icons/fa";
import { useEnumOptions } from '@/services/enumsApi';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import AddEditAvailabilityTemplate from './AddEditAvailabilityTemplate';
import { MdPublish } from "react-icons/md";


const AvailabilityTemplatePageNew = () => {
 
  const dispatch = useAppDispatch();
   const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
 
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter?: string; value?: string }>({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5
  });
  const [openModal, setOpenModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateResponseVM>({ ...newAvailabilityTemplateResponseVM });
  const [openConfirmToggleTemplate, setOpenConfirmToggleTemplate] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

   const { data: templatesList, isFetching, refetch } = useGetAvailabilityTemplatesByTemplateTypeQuery({templateType: "DEPARTMENT"});
  const { data: facilitiesResponse } = useGetActiveFacilitiesQuery({});
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});
  const { data: departmentforLoggedInFacility, isFetching: deptFetching } =
    useGetDepartmentByFacilityQuery(
      { facilityId: selectedFacility?.id },
      { skip: !selectedFacility?.id }
    );
  const [toggleTemplateActive] = useToggleAvailabilityTemplateActiveMutation();
   const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');
  

  const handleFilterChange = (field?: string, value?: string) => {
    const list = templatesList ?? [];
    if (!field || value === undefined || value === null || value === '') {
      setIsFiltered(false);
      setFilteredList([]);
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      return;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    const filtered = list.filter(item => {
      if (!item) return false;
      if (field === 'templateName') {
        const name = item.templateName ?? item.name ?? '';
        return String(name).toLowerCase().includes(normalizedValue);
      }
      if (field === 'departmentId') {
        return String(item.departmentId ?? '') === String(value);
      }
      if (field === 'status') {
        return String(item.status ?? '').toLowerCase() === normalizedValue;
      }
      if (field === 'templateType') {
        return String(item.templateType ?? '').toLowerCase() === normalizedValue;
      }
      return false;
    });

    setFilteredList(filtered);
    setIsFiltered(true);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const currentList = useMemo(() => {
    return isFiltered ? filteredList : (templatesList ?? []);
  }, [filteredList, isFiltered, templatesList]);
  const totalCount = currentList.length;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const pagedList = useMemo(() => {
    const start = pageIndex * rowsPerPage;
    return currentList.slice(start, start + rowsPerPage);
  }, [currentList, pageIndex, rowsPerPage]);

  // Class name of selected row
  const isSelected = rowData => {
    if (rowData && selectedTemplate && rowData.id === selectedTemplate.id) {
      return 'selected-row';
    } else return '';
  };

  const handleToggleTemplateActive = async () => {
    if (!selectedTemplate?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleTemplateActive({ id: selectedTemplate.id }).unwrap();
      setOpenConfirmToggleTemplate(false);
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Template deactivated successfully'
              : 'Template reactivated successfully',
          sev: 'success'
        })
      );
      refetch();
    } catch (error) {
      dispatch(
        notify({
          msg: 'Action failed, please try again',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const columns = [
    {
      key: 'templateName',
      title: <Translate>Template Name</Translate>,
    },
    {
      key: 'departmentId',
      title: <Translate>Department ID</Translate>,
      render: (rowData) => {
        const department = allDepartments?.find(d => d?.id === rowData?.departmentId);
        return department ? department.name : 'Unknown';
      },
    },
    {
      key: 'facilityId',
      title: <Translate>Facility ID</Translate>,
      render: (rowData) => {
        const facility = facilitiesResponse?.find(f => f.id === rowData?.facilityId);
        return facility ? facility.name : 'Unknown';
      },
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.status)}</span>
      ),

    },
    {
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (rowData) => (
        <div className="container-of-icons">
           
          {rowData?.isActive ? (
            <MdDelete
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              className="icons-style"
              onClick={() => {
                setSelectedTemplate(rowData);
                setToggleActionType('deactivate');
                setOpenConfirmToggleTemplate(true);
              }}
            />
          ) : (
            <FaUndo
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              className="icons-style"
              onClick={() => {
                setSelectedTemplate(rowData);
                setToggleActionType('reactivate');
                setOpenConfirmToggleTemplate(true);
              }}
            />
          )}
          {rowData.status === "DRAFT" && (
          <MdModeEdit
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            style={{ cursor: rowData?.status === "DRAFT" ? 'pointer' : 'not-allowed' }}
            onClick={() => {
              if(rowData.status === "DRAFT"){
              setSelectedTemplate(rowData);
              setOpenModal(true);
              }
            }}
          />
           )}
          {rowData.status === "PUBLISHED" && (
            <MdPublish
              title="Publish"
              size={24}
              fill="var(--primary-gray)"
              className="icons-style"
             />
          )}
        </div>
      )
    }
  ];

  const filters = (
    <Form layout="inline">
      <MyInput
        fieldType="select"
        fieldName="filter"
        selectData={[
          { label: 'Template Name', value: 'templateName' },
          { label: 'Department', value: 'departmentId' },
          { label: 'Status', value: 'status' },
          { label: 'Template Type', value: 'templateType' },
        ]}
        selectDataLabel='label'
        selectDataValue='value'
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Filter By"
        searchable={false}
      />

      {recordOfFilter.filter === "templateName" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "departmentId" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={departmentforLoggedInFacility?.data ?? []}
          selectDataLabel='name'
          selectDataValue='id'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "status" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={statusEnum ?? []}
          selectDataLabel='label'
          selectDataValue='value'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === "templateType" && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          fieldType='select'
          selectData={templateTypeEnum ?? []}
          selectDataLabel='label'
          selectDataValue='value'
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {!recordOfFilter.filter && (
        <MyInput
          fieldType="text"
          fieldName="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Search"
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // Effects
  useEffect(() => {
    if (pageIndex > 0 && pageIndex * rowsPerPage >= totalCount) {
      setPaginationParams(prev => ({ ...prev, page: 0 }));
    }
  }, [pageIndex, rowsPerPage, totalCount]);


  return (
    <Panel>

      <MyTable
        columns={columns}
        data={pagedList}
        height={500}
        rowClassName={isSelected}
        onRowClick={rowdata => setSelectedTemplate(rowdata)}
        filters={filters}
        loading={isFetching}
        totalCount={totalCount}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={(_, newPage) => {
          setPaginationParams(prev => ({ ...prev, page: newPage }));
        }}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams({ page: 0, size: newSize });
        }}
        tableButtons={
          <>
            <MyButton
              icon="plus"
              appearance="primary"
              onClick={() => {
                setSelectedTemplate(
                  { ...newAvailabilityTemplateResponseVM }
                
                );
                setOpenModal(true);
              }}
            >
              Add Template
            </MyButton>
          
          </>
        }
      />

      <AddEditAvailabilityTemplate
       open={openModal}
        setOpen={setOpenModal}
        template={selectedTemplate}
        />
      <DeletionConfirmationModal
        open={openConfirmToggleTemplate}
        setOpen={setOpenConfirmToggleTemplate}
        itemToDelete="Availability Template"
        actionButtonFunction={handleToggleTemplateActive}
        actionType={toggleActionType}
      />

    </Panel>
  );
};

export default AvailabilityTemplatePageNew;
