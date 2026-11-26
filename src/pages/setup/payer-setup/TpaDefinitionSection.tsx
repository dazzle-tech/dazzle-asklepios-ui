import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
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
  useToggleTpaDefinitionActiveMutation,
  useUpdateTpaDefinitionMutation
} from '@/services/setup/payer/TpaDefinitionSetupService';
import { NphiesPayerService } from '@/services/setup/payer/NphiesPayerSetupService';
import TpaDefinitionModal from './TpaDefinitionModal';
import TpaLinkedCompaniesModal from './TpaLinkedCompaniesModal';
import TpaAuditLogModal from './TpaAuditLogModal';
import TpaRuleModal, { TpaRuleKind } from './TpaRuleModal';

// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = { tpaCode: '', name: '', guarantorType: '' };
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const guarantorTypeOptions = [
  { label: 'Insurance', value: 'INSURANCE' },
  { label: 'TPA', value: 'TPA' }
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const TpaDefinitionSection = ({ hideTitle = false }: { hideTitle?: boolean }) => {
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

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const allTpasQuery = useGetAllTpaDefinitionsQuery(
    {
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
      ...appliedFilters,
      isActive: activeFilter
    },
    { refetchOnMountOrArgChange: true }
  );

  const [createTpa] = useCreateTpaDefinitionMutation();
  const [updateTpa] = useUpdateTpaDefinitionMutation();
  const [toggleTpaActive] = useToggleTpaDefinitionActiveMutation();

  const activeResponse = allTpasQuery.data;
  const isFetching = allTpasQuery.isFetching;

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

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

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
        nphiesId: selectedTpa.nphiesId?.trim() || null,
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
        fill="var(--primary-gray)"
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
        fill="var(--primary-gray)"
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
        fill="var(--primary-gray)"
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
        fill="var(--primary-gray)"
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
      width: 150,
      ...headerSearch('tpaCode', 'Search code')
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name')
    },
    {
      key: 'guarantorType',
      title: <Translate>Guarantor Type</Translate>,
      width: 150,
      ...headerSearch('guarantorType'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...guarantorTypeOptions]
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
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (rowData: TpaDefinition) => <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3.4,
      render: (rowData: TpaDefinition) => iconsForActions(rowData)
    }
  ];

  return (
    <div className="payer-setup-section">
      {hideTitle ? null : (
        <div className="payer-setup-section-title">
          <Translate>TPA Definition</Translate>
        </div>
      )}
      <MyTable
        data={activeResponse?.data ?? []}
        totalCount={activeResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        height={hideTitle ? 420 : 280}
        onRowClick={rowData =>
          setSelectedTpa({
            ...rowData,
            insuranceCompanyIds: rowData.insuranceCompanyIds ?? []
          })
        }
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
