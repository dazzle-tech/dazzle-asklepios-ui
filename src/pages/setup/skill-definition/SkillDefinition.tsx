import React, { useEffect, useState } from 'react';
import { Panel, Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { SkillDefinition } from '@/types/model-types-new';
import { newSkillDefinition } from '@/types/model-types-constructor-new';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import {
  useGetAllskillDefinitionsQuery,
  useLazyGetskillDefinitionsByFacilityQuery,
  useLazyGetskillDefinitionsByCodeQuery,
  useLazyGetskillDefinitionsByNameQuery,
  useToggleskillDefinitionActiveMutation
} from '@/services/setup/skillDefinition/skillDefinitionService';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import AddEditSkill from './AddEditSkill';

const SkillDefinitions = () => {
  const dispatch = useAppDispatch();

  const [skill, setSkill] = useState<SkillDefinition>({ ...newSkillDefinition });
  const [openAddEditSkillModal, setopenAddEditSkillModal] = useState(false);
  const [openConfirmToggleSkill, setOpenConfirmToggleSkill] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [link, setLink] = useState({});

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const [filteredList, setFilteredList] = useState<SkillDefinition[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);

  const {
    data: SkillDefinitionListResponse,
    isFetching,
    refetch
  } = useGetAllskillDefinitionsQuery(paginationParams);
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const [fetchByFacility] = useLazyGetskillDefinitionsByFacilityQuery();
  const [fetchByCode] = useLazyGetskillDefinitionsByCodeQuery();
  const [fetchByName] = useLazyGetskillDefinitionsByNameQuery();
  const [toggleSkillActive] = useToggleskillDefinitionActiveMutation();

  useEffect(() => {
    dispatch(setPageCode('Skill_Definition'));
    dispatch(setDivContent('Skill Definition'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    setLink(SkillDefinitionListResponse?.links ?? {});
  }, [SkillDefinitionListResponse?.links]);

  const isSelected = (rowData: SkillDefinition) =>
    rowData && skill && rowData.id === skill.id ? 'selected-row' : '';

  const handlePageChange = (event: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        link,
        setPaginationParams
      );
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
    } else {
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;

    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, sort: sortValue, page: 0 }));
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams(prev => ({
        ...prev,
        sort: sortValue,
        page: 0,
        timestamp: Date.now()
      }));
    }
  };

  const handleNew = () => {
    setSkill({ ...newSkillDefinition });
    setopenAddEditSkillModal(true);
  };

  const handleAfterSave = (_action: 'create' | 'update') => {
    setIsFiltered(false);
    setFilteredList([]);
    setFilteredTotal(0);
    setRecordOfFilter({ filter: '', value: '' });
    setFilterPagination(prev => ({ ...prev, page: 0 }));
    setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    refetch();
  };

  const handletoggleSkillActive = async () => {
    if (!skill?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleSkillActive(skill.id).unwrap();
      setOpenConfirmToggleSkill(false);
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Skill deactivated successfully'
              : 'Skill reactivated successfully',
          sev: 'success'
        })
      );
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

  const iconsForActions = (rowData: SkillDefinition) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setSkill(rowData);
          setopenAddEditSkillModal(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setSkill(rowData);
            setToggleActionType('deactivate');
            setOpenConfirmToggleSkill(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setSkill(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmToggleSkill(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'facilityName',
      title: <Translate>Facility</Translate>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: SkillDefinition) => (row.isActive ? 'Active' : 'Inactive')
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      render: (rowData: SkillDefinition) => iconsForActions(rowData)
    }
  ];

  const filterFields = [
    { label: 'Facility', value: 'facilityId' },
    { label: 'Code', value: 'code' },
    { label: 'Name', value: 'name' }
  ];

  const handleFilterChange = async (field: string, value: any, page = 0, size?: number) => {
    try {
      if (!field || value === '' || value == null) {
        setIsFiltered(false);
        setFilteredList([]);
        setFilteredTotal(0);
        return;
      }

      const currentSize = size ?? filterPagination.size;
      const params = {
        page,
        size: currentSize,
        sort: filterPagination.sort
      };

      let response: any;
      if (field === 'facilityId') {
        response = await fetchByFacility({ facilityId: value, ...params }).unwrap();
      } else if (field === 'code') {
        response = await fetchByCode({ code: value, ...params }).unwrap();
      } else if (field === 'name') {
        response = await fetchByName({ name: value, ...params }).unwrap();
      }

      setFilteredList(response?.data ?? []);
      setFilteredTotal(response?.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size: currentSize }));
    } catch (error) {
      dispatch(notify({ msg: 'Failed to filter skills', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord =>
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          })
        }
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      {recordOfFilter.filter === 'facilityId' ? (
        <MyInput
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          menuMaxHeight={150}
          showLabel={false}
          searchable={false}
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
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

  const totalCount = SkillDefinitionListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>
      <MyTable
        data={isFiltered ? filteredList : SkillDefinitionListResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setSkill(rowData)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        tableButtons={
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
        }
      />

      <DeletionConfirmationModal
        open={openConfirmToggleSkill}
        setOpen={setOpenConfirmToggleSkill}
        itemToDelete="Skill"
        actionButtonFunction={handletoggleSkillActive}
        actionType={toggleActionType}
      />

      <AddEditSkill
        open={openAddEditSkillModal}
        setOpen={setopenAddEditSkillModal}
        skill={skill}
        setSkill={setSkill}
        onSaved={handleAfterSave}
      />
    </Panel>
  );
};

export default SkillDefinitions;
