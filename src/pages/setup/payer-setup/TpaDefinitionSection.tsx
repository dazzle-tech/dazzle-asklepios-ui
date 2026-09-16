import React, { useState } from 'react';
import { Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdBlock, MdBusiness, MdDelete, MdFactCheck, MdHistory, MdModeEdit } from 'react-icons/md';
import { FaPercent, FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import { TpaDefinition } from '@/types/model-types-new';
import { newTpaDefinition } from '@/types/model-types-constructor-new';
import { approvalCoverageCompanyLabel } from '@/pages/setup/coverage-management/coverageHelpers';
import {
  TpaDefinitionService,
  useCreateTpaDefinitionMutation,
  useGetAllTpaDefinitionsQuery,
  useGetTpaDefinitionsByCodeQuery,
  useGetTpaDefinitionsByNameQuery,
  useToggleTpaDefinitionActiveMutation,
  useUpdateTpaDefinitionMutation
} from '@/services/setup/payer/TpaDefinitionSetupService';
import { NphiesPayerService } from '@/services/setup/payer/NphiesPayerSetupService';
import TpaDefinitionModal from './TpaDefinitionModal';
import TpaLinkedCompaniesModal from './TpaLinkedCompaniesModal';
import TpaAuditLogModal from './TpaAuditLogModal';
import TpaRuleModal, { TpaRuleKind } from './TpaRuleModal';

type FilterCriteria = '' | 'tpaCode' | 'name';

const filterCriteriaOptions = [
  { label: 'TPA Code', value: 'tpaCode' },
  { label: 'Name', value: 'name' }
];

const initialTpaFilter = {
  criteria: '' as FilterCriteria,
  tpaCode: '',
  name: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TpaDefinitionSection = () => {
  const dispatch = useAppDispatch();

  const [selectedTpa, setSelectedTpa] = useState<TpaDefinition>({ ...newTpaDefinition });
  const [openModal, setOpenModal] = useState(false);
  const [openLinkedCompanies, setOpenLinkedCompanies] = useState(false);
  const [openLog, setOpenLog] = useState(false);
  const [openRule, setOpenRule] = useState(false);
  const [ruleKind, setRuleKind] = useState<TpaRuleKind | null>(null);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [tpaFilter, setTpaFilter] = useState(initialTpaFilter);
  const [appliedTpaFilter, setAppliedTpaFilter] = useState(initialTpaFilter);

  const hasCodeFilter = appliedTpaFilter.criteria === 'tpaCode' && !!appliedTpaFilter.tpaCode.trim();
  const hasNameFilter = appliedTpaFilter.criteria === 'name' && !!appliedTpaFilter.name.trim();

  const allTpasQuery = useGetAllTpaDefinitionsQuery(
    {
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: hasCodeFilter || hasNameFilter, refetchOnMountOrArgChange: true }
  );

  const tpasByCodeQuery = useGetTpaDefinitionsByCodeQuery(
    {
      tpaCode: appliedTpaFilter.tpaCode.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: !hasCodeFilter }
  );

  const tpasByNameQuery = useGetTpaDefinitionsByNameQuery(
    {
      name: appliedTpaFilter.name.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    { skip: !hasNameFilter }
  );

  const [createTpa] = useCreateTpaDefinitionMutation();
  const [updateTpa] = useUpdateTpaDefinitionMutation();
  const [toggleTpaActive] = useToggleTpaDefinitionActiveMutation();

  const activeResponse = hasCodeFilter
    ? tpasByCodeQuery.data
    : hasNameFilter
      ? tpasByNameQuery.data
      : allTpasQuery.data;

  const isFetching =
    allTpasQuery.isFetching || tpasByCodeQuery.isFetching || tpasByNameQuery.isFetching;

  const handleResetFilter = () => {
    setTpaFilter({ ...initialTpaFilter });
    setAppliedTpaFilter({ ...initialTpaFilter });
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const handleSearch = (nextFilter = tpaFilter) => {
    if (
      !nextFilter.criteria ||
      (nextFilter.criteria === 'tpaCode' && !nextFilter.tpaCode.trim()) ||
      (nextFilter.criteria === 'name' && !nextFilter.name.trim())
    ) {
      handleResetFilter();
      return;
    }

    setAppliedTpaFilter({ ...nextFilter });
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const applyHeaderSearch = (criteria: FilterCriteria, value: string) => {
    const next = {
      criteria,
      tpaCode: criteria === 'tpaCode' ? value : '',
      name: criteria === 'name' ? value : ''
    };
    setTpaFilter(next);
    handleSearch(next);
  };

  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: Number(e.target.value),
      page: 0
    }));
  };

  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    setPaginationParams(prev => ({
      ...prev,
      sort: `${column},${type}`,
      page: 0
    }));
  };

  const handleNew = () => {
    setSelectedTpa({ ...newTpaDefinition });
    setOpenModal(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!selectedTpa.tpaCode?.trim()) errors.push('TPA Code is required');
    if (!selectedTpa.name?.trim()) errors.push('Name is required');
    if (!selectedTpa.guarantorType) errors.push('Guarantor Type is required');
    if (!selectedTpa.activationDate) errors.push('Activation Date is required');
    if (selectedTpa.isActive === undefined || selectedTpa.isActive === null) {
      errors.push('Status is required');
    }
    if (selectedTpa.email?.trim() && !EMAIL_PATTERN.test(selectedTpa.email.trim())) {
      errors.push('Email must be valid');
    }

    if (errors.length > 0) {
      dispatch(
        notify({
          msg: (
            <>
              {errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </>
          ),
          sev: 'warning'
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());

      const toId = (value: unknown): number | null => {
        if (value == null || value === '') {
          return null;
        }
        if (typeof value === 'object') {
          const nested = Number((value as { id?: unknown; value?: unknown }).id
            ?? (value as { value?: unknown }).value);
          return Number.isFinite(nested) ? nested : null;
        }
        const id = Number(value);
        return Number.isFinite(id) ? id : null;
      };

      const toIdList = (values?: unknown[]) =>
        [...new Set((values ?? []).map(toId).filter((id): id is number => id != null))];

      const payload = {
        tpaCode: selectedTpa.tpaCode.trim(),
        name: selectedTpa.name.trim(),
        guarantorType: selectedTpa.guarantorType,
        activationDate: selectedTpa.activationDate,
        isActive: selectedTpa.isActive,
        taxRegistrationNo: selectedTpa.taxRegistrationNo || null,
        countryId: toId(selectedTpa.countryId),
        cityId: toId(selectedTpa.cityId),
        address: selectedTpa.address || null,
        phone: selectedTpa.phone || null,
        email: selectedTpa.email || null,
        approvalCoverageCompany: selectedTpa.approvalCoverageCompany || null,
        insuranceCompanyIds: toIdList(selectedTpa.insuranceCompanyIds)
      };

      if (selectedTpa.id) {
        await updateTpa({ ...payload, id: selectedTpa.id }).unwrap();
        dispatch(notify({ msg: 'TPA updated successfully', sev: 'success' }));
      } else {
        await createTpa(payload).unwrap();
        dispatch(notify({ msg: 'TPA created successfully', sev: 'success' }));
      }

      dispatch(TpaDefinitionService.util.invalidateTags(['TpaDefinition']));
      dispatch(NphiesPayerService.util.invalidateTags(['NphiesPayer']));
      handleResetFilter();
      setOpenModal(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.title ||
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Failed to save TPA';

      serverMessage = String(serverMessage).replace(/^error\./i, '');
      dispatch(notify({ msg: serverMessage, sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggleActive = async () => {
    if (!selectedTpa?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleTpaActive(selectedTpa.id).unwrap();
      dispatch(NphiesPayerService.util.invalidateTags(['NphiesPayer']));
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'TPA deactivated successfully'
              : 'TPA reactivated successfully',
          sev: 'success'
        })
      );
      setOpenConfirmToggle(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.title ||
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Action failed, please try again';
      serverMessage = String(serverMessage).replace(/^error\./i, '');
      dispatch(notify({ msg: serverMessage, sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const iconsForActions = (rowData: TpaDefinition) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setSelectedTpa({
            ...rowData,
            insuranceCompanyIds: rowData.insuranceCompanyIds ?? []
          });
          setOpenModal(true);
        }}
      />
      <MdBusiness
        className="icons-style"
        title="Linked insurance companies"
        size={22}
        fill="var(--deep-blue)"
        onClick={() => {
          setSelectedTpa(rowData);
          setOpenLinkedCompanies(true);
        }}
      />
      <MdHistory
        className="icons-style"
        title="Log"
        size={22}
        fill="var(--primary-gray)"
        onClick={() => {
          setSelectedTpa(rowData);
          setOpenLog(true);
        }}
      />
      <MdFactCheck
        className="icons-style"
        title="Approval"
        size={22}
        fill="var(--deep-blue)"
        onClick={() => {
          setSelectedTpa(rowData);
          setRuleKind('approval');
          setOpenRule(true);
        }}
      />
      <MdBlock
        className="icons-style"
        title="Excluded"
        size={22}
        fill="var(--primary-pink)"
        onClick={() => {
          setSelectedTpa(rowData);
          setRuleKind('exclusion');
          setOpenRule(true);
        }}
      />
      <FaPercent
        className="icons-style"
        title="Discount"
        size={18}
        fill="var(--deep-blue)"
        onClick={() => {
          setSelectedTpa(rowData);
          setRuleKind('discount');
          setOpenRule(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setSelectedTpa(rowData);
            setToggleActionType('deactivate');
            setOpenConfirmToggle(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setSelectedTpa(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmToggle(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'tpaCode',
      title: <Translate>TPA Code</Translate>,
      flexGrow: 2,
      searchable: true,
      searchPlaceholder: 'Search code',
      searchValue: tpaFilter.tpaCode,
      onSearchChange: (value: string) =>
        setTpaFilter(prev => ({
          ...prev,
          criteria: 'tpaCode',
          tpaCode: value,
          name: ''
        })),
      onSearchSubmit: (value?: string) => applyHeaderSearch('tpaCode', value ?? tpaFilter.tpaCode)
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 3,
      searchable: true,
      searchPlaceholder: 'Search name',
      searchValue: tpaFilter.name,
      onSearchChange: (value: string) =>
        setTpaFilter(prev => ({
          ...prev,
          criteria: 'name',
          name: value,
          tpaCode: ''
        })),
      onSearchSubmit: (value?: string) => applyHeaderSearch('name', value ?? tpaFilter.name)
    },
    {
      key: 'guarantorType',
      title: <Translate>Guarantor Type</Translate>,
      flexGrow: 2
    },
    {
      key: 'approvalCoverageCompany',
      title: <Translate>Approval Coverage Co.</Translate>,
      flexGrow: 2,
      render: (rowData: TpaDefinition) => (
        <span>{approvalCoverageCompanyLabel(rowData.approvalCoverageCompany)}</span>
      )
    },
    {
      key: 'activationDate',
      title: <Translate>Activation Date</Translate>,
      flexGrow: 2
    },
    {
      key: 'linkedInsuranceCount',
      title: <Translate>Linked Companies</Translate>,
      flexGrow: 1,
      render: (rowData: TpaDefinition) => <span>{rowData.linkedInsuranceCount ?? 0}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: TpaDefinition) => <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3.4,
      render: (rowData: TpaDefinition) => iconsForActions(rowData)
    }
  ];

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        width="180px"
        fieldName="criteria"
        fieldType="select"
        selectData={filterCriteriaOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={tpaFilter}
        setRecord={(updated: any) => {
          const next = typeof updated === 'function' ? updated(tpaFilter) : updated;
          const nextCriteria = (next?.criteria ?? '') as FilterCriteria;
          if (!nextCriteria) {
            handleResetFilter();
            return;
          }
          setTpaFilter({
            criteria: nextCriteria,
            tpaCode: '',
            name: ''
          });
        }}
        showLabel={false}
        placeholder="Select Criteria"
        searchable={false}
      />

      {tpaFilter.criteria === 'tpaCode' && (
        <MyInput
          width="220px"
          fieldName="tpaCode"
          fieldType="text"
          record={tpaFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(tpaFilter) : updated;
            const nextCode = next?.tpaCode ?? '';
            if (!nextCode.trim()) {
              handleResetFilter();
              return;
            }
            setTpaFilter(prev => ({ ...prev, tpaCode: nextCode }));
          }}
          showLabel={false}
          placeholder="Search TPA Code"
        />
      )}

      {tpaFilter.criteria === 'name' && (
        <MyInput
          width="220px"
          fieldName="name"
          fieldType="text"
          record={tpaFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(tpaFilter) : updated;
            const nextName = next?.name ?? '';
            if (!nextName.trim()) {
              handleResetFilter();
              return;
            }
            setTpaFilter(prev => ({ ...prev, name: nextName }));
          }}
          showLabel={false}
          placeholder="Search Name"
        />
      )}

      <MyButton color="var(--deep-blue)" onClick={() => handleSearch()} width="80px">
        Search
      </MyButton>
      <MyButton color="var(--primary-gray)" onClick={handleResetFilter} width="80px">
        Clear
      </MyButton>
    </Form>
  );

  return (
    <div className="payer-setup-section">
      <div className="payer-setup-section-title">
        <Translate>TPA Definition</Translate>
      </div>
      <MyTable
        data={activeResponse?.data ?? []}
        totalCount={activeResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        height={280}
        onRowClick={rowData =>
          setSelectedTpa({
            ...rowData,
            insuranceCompanyIds: rowData.insuranceCompanyIds ?? []
          })
        }
        filters={filters()}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
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
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="TPA"
        actionButtonFunction={handleToggleActive}
        actionType={toggleActionType}
      />

      <TpaDefinitionModal
        open={openModal}
        setOpen={setOpenModal}
        tpa={selectedTpa}
        setTpa={setSelectedTpa}
        onSave={handleSave}
      />

      <TpaLinkedCompaniesModal
        open={openLinkedCompanies}
        setOpen={setOpenLinkedCompanies}
        tpa={selectedTpa}
      />

      <TpaAuditLogModal open={openLog} setOpen={setOpenLog} tpa={selectedTpa} />

      <TpaRuleModal
        open={openRule}
        setOpen={setOpenRule}
        tpa={selectedTpa}
        kind={ruleKind}
      />
    </div>
  );
};

export default TpaDefinitionSection;
