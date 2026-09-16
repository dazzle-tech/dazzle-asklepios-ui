import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete, MdContentCopy, MdPublish, MdOutlineCalendarMonth } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { RiFolderHistoryLine } from 'react-icons/ri';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetAvailabilityTemplatesByTemplateTypeQuery,
  useCloneAvailabilityTemplateMutation,
  useToggleAvailabilityTemplateActiveMutation,
  useUpdateAvailabilityTemplateMutation,
} from '@/services/appointment/availabilityTemplateService';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
import {
  useGetAllDepartmentsWithoutPaginationQuery,
  useGetDepartmentByFacilityQuery,
} from '@/services/security/departmentService';
import { useEnumOptions } from '@/services/enumsApi';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { formatEnumString } from '@/utils';
import { AvailabilityTemplateResponseVM } from '@/types/model-types-new';
import { newAvailabilityTemplateResponseVM } from '@/types/model-types-constructor-new';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { extractErrorMessage } from './utils';
import AddEditAvailabilityTemplate from './AddEditAvailabilityTemplate';
import AvailabilityTemplateDetailsSection from './AvailabilityTemplateDetailsSection';
import AvailabilityTemplateLogModal from './AvailabilityTemplateLogModal';
import TemplateScheduleModal from './TemplateScheduleModal';
import './styles.less';

const AvailabilityTemplatePageNew = () => {
  const dispatch = useAppDispatch();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;

  // ─── State ───────────────────────────────────────────────────────────────────
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter?: string; value?: string }>({});
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<any[]>([]);
  const [showInactiveTemplates, setShowInactiveTemplates] = useState(false);
  const [paginationParams, setPaginationParams] = useState({ page: 0, size: 20 });
  const [selectedTemplate, setSelectedTemplate] = useState<AvailabilityTemplateResponseVM>({ ...newAvailabilityTemplateResponseVM });
  const [openAddEditModal, setOpenAddEditModal] = useState(false);
  const [openScheduleModal, setOpenScheduleModal] = useState(false);
  const [openLogModal, setOpenLogModal] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

  // ─── Queries ─────────────────────────────────────────────────────────────────
  const { data: templatesList, isFetching, refetch } = useGetAvailabilityTemplatesByTemplateTypeQuery({ templateType: 'DEPARTMENT' });
  const { data: facilitiesResponse } = useGetActiveFacilitiesQuery({});
  const { data: allDepartments } = useGetAllDepartmentsWithoutPaginationQuery({});
  const { data: departmentByFacility } = useGetDepartmentByFacilityQuery(
    { facilityId: selectedFacility?.id },
    { skip: !selectedFacility?.id }
  );

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const [toggleTemplateActive] = useToggleAvailabilityTemplateActiveMutation();
  const [cloneTemplate] = useCloneAvailabilityTemplateMutation();
  const [updateTemplate] = useUpdateAvailabilityTemplateMutation();

  // ─── Enums ───────────────────────────────────────────────────────────────────
  const statusEnum = useEnumOptions('TemplateStatus');
  const templateTypeEnum = useEnumOptions('TemplateType');

  // ─── Computed (useMemo) ──────────────────────────────────────────────────────
  const currentList = useMemo(() => {
    const sourceList = isFiltered ? filteredList : (templatesList ?? []);

    if (showInactiveTemplates) {
      return sourceList;
    }

    return sourceList.filter(item => item?.isActive === true);
  }, [filteredList, isFiltered, templatesList, showInactiveTemplates]);

  const pagedList = useMemo(() => {
    const { page, size } = paginationParams;
    return currentList.slice(page * size, (page + 1) * size);
  }, [currentList, paginationParams]);

  // ─── Handlers ────────────────────────────────────────────────────────────────
  const handleFilterChange = (field?: string, value?: string) => {
    if (!field || !value) {
      setIsFiltered(false);
      setFilteredList([]);
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      return;
    }

    const normalizedValue = String(value).trim().toLowerCase();
    const filtered = (templatesList ?? []).filter(item => {
      if (!item) return false;
      if (field === 'templateName') return String(item.templateName ?? item.name ?? '').toLowerCase().includes(normalizedValue);
      if (field === 'departmentId') return String(item.departmentId ?? '') === String(value);
      if (field === 'status') return String(item.status ?? '').toLowerCase() === normalizedValue;
      if (field === 'templateType') return String(item.templateType ?? '').toLowerCase() === normalizedValue;
      return false;
    });

    setFilteredList(filtered);
    setIsFiltered(true);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
    if (!filtered.some(item => item.id === selectedTemplate?.id)) {
      setSelectedTemplate({ ...newAvailabilityTemplateResponseVM });
    }
  };

  const handleToggleTemplateActive = async () => {
    if (!selectedTemplate?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleTemplateActive({ id: selectedTemplate.id }).unwrap();
      setOpenConfirmToggle(false);
      dispatch(notify({
        msg: toggleActionType === 'deactivate' ? 'Template deactivated successfully' : 'Template reactivated successfully',
        sev: 'success',
      }));
      refetch();
    } catch {
      dispatch(notify({ msg: 'Action failed, please try again', sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handlePublishTemplate = async (rowData: AvailabilityTemplateResponseVM) => {
    if (!rowData?.id) return;
    try {
      dispatch(showSystemLoader());
      await updateTemplate({
        ...rowData,
        status: 'PUBLISHED',
        defaultBufferBeforeMinutes: rowData.defaultBufferBeforeMinutes ?? 0,
        defaultBufferAfterMinutes: rowData.defaultBufferAfterMinutes ?? 0,
        parallelCapacityValue: rowData.parallelCapacityValue ?? 0,
      }).unwrap();
      dispatch(notify({ msg: 'Template published successfully', sev: 'success' }));
      refetch();
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'Save Failed', sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleCloneTemplate = async (rowData: AvailabilityTemplateResponseVM) => {
    if (!rowData?.id) return;
    try {
      dispatch(showSystemLoader());
      const cloned = await cloneTemplate({ id: rowData.id }).unwrap();
      dispatch(notify({ msg: 'Template cloned successfully', sev: 'success' }));
      setSelectedTemplate(cloned);
      refetch();
    } catch (error) {
      dispatch(notify({ msg: extractErrorMessage(error) || 'Clone failed', sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  // ─── Effects ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    dispatch(setPageCode('AvailabilityTemplate'));
    dispatch(setDivContent('Availability Template'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const { page, size } = paginationParams;
    if (page > 0 && page * size >= currentList.length) {
      setPaginationParams(prev => ({ ...prev, page: 0 }));
    }
  }, [currentList.length, paginationParams]);

  // ─── Table Config ─────────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'templateName',
      title: <Translate>Template Name</Translate>,
    },
    {
      key: 'departmentId',
      title: <Translate>Department</Translate>,
      render: (rowData: any) => allDepartments?.find(d => d?.id === rowData?.departmentId)?.name ?? 'Unknown',
    },
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      render: (rowData: any) => facilitiesResponse?.find(f => f.id === rowData?.facilityId)?.name ?? 'Unknown',
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      render: (rowData: any) => <span>{formatEnumString(rowData.status)}</span>,
    },
    {
      key: 'actions',
      title: '',
      flexGrow: 2,
      render: (rowData: any) => (
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
                setOpenConfirmToggle(true);
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
                setOpenConfirmToggle(true);
              }}
            />
          )}
          {rowData.status === 'DRAFT' && (
            <>
              <MdModeEdit
                title="Edit"
                size={24}
                fill="var(--primary-gray)"
                className="icons-style"
                onClick={() => {
                  setSelectedTemplate(rowData);
                  setOpenAddEditModal(true);
                }}
              />
              <MdPublish
                title="Publish"
                size={24}
                fill="var(--primary-gray)"
                className="icons-style"
                onClick={() => handlePublishTemplate(rowData)}
              />
              <MdOutlineCalendarMonth
                title="Schedule"
                size={24}
                fill="var(--primary-gray)"
                className="icons-style"
                onClick={() => {
                  setSelectedTemplate(rowData);
                  setOpenScheduleModal(true);
                }}
              />
            </>
          )}
          <MdContentCopy
            title="Clone"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => handleCloneTemplate(rowData)}
          />
          <RiFolderHistoryLine
            title="Log"
            size={24}
            fill="var(--primary-gray)"
            className="icons-style"
            onClick={() => {
              setSelectedTemplate(rowData);
              setOpenLogModal(true);
            }}
          />
        </div>
      ),
    },
  ];

  const filters = (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        fieldType="select"
        fieldName="filter"
        selectData={[
          { label: 'Template Name', value: 'templateName' },
          { label: 'Department', value: 'departmentId' },
          { label: 'Status', value: 'status' },
          { label: 'Template Type', value: 'templateType' },
        ]}
        selectDataLabel="label"
        selectDataValue="value"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Filter By"
        searchable={false}
      />

      {recordOfFilter.filter === 'templateName' && (
        <MyInput
          fieldName="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === 'departmentId' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={departmentByFacility?.data ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === 'status' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={statusEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={u => setRecordOfFilter({ ...recordOfFilter, value: u.value })}
          showLabel={false}
        />
      )}
      {recordOfFilter.filter === 'templateType' && (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={templateTypeEnum ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
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

      <Checkbox
        checked={showInactiveTemplates}
        onChange={(_, checked) => {
          setShowInactiveTemplates(checked);
          setPaginationParams(prev => ({ ...prev, page: 0 }));
        }}
      >
        <Translate>Show Inactive Templates</Translate>
      </Checkbox>
    </Form>
  );

  return (
    <Panel>
      <div className="container-of-table-and-section-availability-template">
        <MyTable
          columns={columns}
          data={pagedList}
          height={500}
          rowClassName={row => (row?.id === selectedTemplate?.id ? 'selected-row' : '')}
          onRowClick={rowdata => setSelectedTemplate(rowdata)}
          filters={filters}
          loading={isFetching}
          totalCount={currentList.length}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={(_, newPage) => setPaginationParams(prev => ({ ...prev, page: newPage }))}
          onRowsPerPageChange={e => setPaginationParams({ page: 0, size: Number(e.target.value) })}
          tableButtons={
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              appearance="primary"
              onClick={() => {
                setSelectedTemplate({ ...newAvailabilityTemplateResponseVM });
                setOpenAddEditModal(true);
              }}
            >
              Add Template
            </MyButton>
          }
        />
        {selectedTemplate?.id && (
          <AvailabilityTemplateDetailsSection template={selectedTemplate} />
        )}
      </div>

      <AddEditAvailabilityTemplate
        open={openAddEditModal}
        setOpen={setOpenAddEditModal}
        template={selectedTemplate}
        setTemplate={setSelectedTemplate}
      />

      <TemplateScheduleModal
        open={openScheduleModal}
        setOpen={setOpenScheduleModal}
        template={selectedTemplate}
      />

      <DeletionConfirmationModal
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Availability Template"
        actionButtonFunction={handleToggleTemplateActive}
        actionType={toggleActionType}
      />

      <AvailabilityTemplateLogModal
        open={openLogModal}
        setOpen={setOpenLogModal}
        template={selectedTemplate}
      />
    </Panel>
  );
};

export default AvailabilityTemplatePageNew;
