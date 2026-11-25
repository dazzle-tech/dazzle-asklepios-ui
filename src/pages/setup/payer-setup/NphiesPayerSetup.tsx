import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import './styles.less';
import { Panel } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyTab from '@/components/MyTab';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdAssignment, MdLink, MdModeEdit, MdDelete, MdTune } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import DeactivationReasonModal from '@/components/DeactivationReasonModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { NphiesPayer, Payor } from '@/types/model-types-new';
import { newNphiesPayer, newPayor } from '@/types/model-types-constructor-new';
import { approvalCoverageCompanyLabel } from '@/pages/setup/coverage-management/coverageHelpers';

import {
  useGetAllNphiesPayersQuery,
  useCreateNphiesPayerMutation,
  useUpdateNphiesPayerMutation,
  useToggleNphiesPayerActiveMutation
} from '@/services/setup/payer/NphiesPayerSetupService';
import {
  useCreatePayorMutation,
  useEnsurePayorFromNphiesMutation,
  useLazyGetAllPayorsQuery,
  useUpdatePayorMutation
} from '@/services/setup/payer/PayorService';
import NphiesPayerModal from './NphiesPayerModal';
import PayorModal from './PayorModal';
import PayerLinkTpasModal from './PayerLinkTpasModal';
import TpaDefinitionSection from './TpaDefinitionSection';
import PayerRelationshipDashboard from './PayerRelationshipDashboard';
import CoverageManagement from '@/pages/setup/coverage-management/CoverageManagement';
import InsuranceCompanyPolicyModal from './InsuranceCompanyPolicyModal';
import InsuranceCompanyPoliciesPanel from './InsuranceCompanyPoliciesPanel';
import { TpaDefinitionService } from '@/services/setup/payer/TpaDefinitionSetupService';

// Header filters: draft values typed in the inputs, applied on Enter.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = { nphiesId: '', nameEn: '', nameAr: '' };
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_PATTERN = /^https?:\/\/.+$/i;

const NphiesPayerSetup = () => {
  const dispatch = useAppDispatch();

  const [selectedPayer, setSelectedPayer] = useState<NphiesPayer>({ ...newNphiesPayer });
  const [openModal, setOpenModal] = useState(false);
  const [openLinkTpas, setOpenLinkTpas] = useState(false);
  const [openPolicyModal, setOpenPolicyModal] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );
  const [searchParams] = useSearchParams();
  const tabFromQuery = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    tabFromQuery === 'coverage' ? '3' : tabFromQuery === 'insurance' ? '2' : '1'
  );

  useEffect(() => {
    if (tabFromQuery === 'coverage') {
      setActiveTab('3');
    } else if (tabFromQuery === 'insurance') {
      setActiveTab('2');
    }
  }, [tabFromQuery]);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const allPayersQuery = useGetAllNphiesPayersQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    ...appliedFilters,
    isActive: activeFilter
  });

  const [createNphiesPayer] = useCreateNphiesPayerMutation();
  const [updateNphiesPayer] = useUpdateNphiesPayerMutation();
  const [toggleNphiesPayerActive] = useToggleNphiesPayerActiveMutation();
  const [fetchPayors] = useLazyGetAllPayorsQuery();
  const [createPayor] = useCreatePayorMutation();
  const [updatePayor] = useUpdatePayorMutation();
  const [ensurePayorFromNphies] = useEnsurePayorFromNphiesMutation();

  // Payor settings of the selected company (Waseel enabled, Waseel / TPA ids).
  // The payor row is the one Waseel flows create automatically; it is created here if missing.
  const [linkedPayor, setLinkedPayor] = useState<Payor>({ ...newPayor });
  const [openPayorModal, setOpenPayorModal] = useState(false);

  const openPayorSettings = async (company: NphiesPayer) => {
    const nphiesId = company.nphiesId?.trim();
    if (!nphiesId) {
      dispatch(notify({ msg: 'The insurance company has no NPHIES ID', sev: 'warning' }));
      return;
    }
    try {
      dispatch(showSystemLoader());
      const payor = await ensurePayorFromNphies(nphiesId).unwrap();
      setLinkedPayor({ ...newPayor, ...payor });
      setOpenPayorModal(true);
    } catch (err: any) {
      dispatch(
        notify({
          msg: String(
            err?.data?.message || err?.data?.detail || 'Could not load the payor settings'
          ).replace(/^error\./i, ''),
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleSavePayorSettings = async () => {
    try {
      dispatch(showSystemLoader());
      const payload: Partial<Payor> = { ...linkedPayor };
      delete payload.createdDate;
      delete payload.lastModifiedDate;
      await updatePayor(payload).unwrap();
      dispatch(notify({ msg: 'Payor settings saved successfully', sev: 'success' }));
      setOpenPayorModal(false);
    } catch (err: any) {
      dispatch(
        notify({
          msg: String(
            err?.data?.properties?.message ||
              err?.data?.message ||
              err?.data?.detail ||
              'Failed to save payor settings'
          ).replace(/^error\./i, ''),
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const syncLinkedPayor = async (company: NphiesPayer) => {
    const code = company.nphiesId?.trim();
    const name = company.nameEn?.trim();
    if (!code || !name) {
      return;
    }

    const payors = await fetchPayors({
      page: 0,
      size: 500,
      sort: 'id,asc'
    }).unwrap();

    const linked = (payors.data ?? []).find((payor: { nphiesId?: string; code?: string }) => {
      const nphiesId = String(payor.nphiesId ?? '').trim().toLowerCase();
      const payorCode = String(payor.code ?? '').trim().toLowerCase();
      return nphiesId === code.toLowerCase() || payorCode === code.toLowerCase();
    });

    const { createdDate, lastModifiedDate, ...base } = {
      ...newPayor,
      ...(linked ?? {}),
      code: linked?.code || code,
      name,
      category: linked?.category || 'INSURANCE',
      phone: company.phone?.trim() || linked?.phone || 'N/A',
      email: company.email?.trim() || linked?.email || '',
      address: company.headOfficeAddress?.trim() || linked?.address || '',
      contractManagerContact:
        company.contactPerson?.trim() || linked?.contractManagerContact || 'N/A',
      nphiesId: code,
      isActive: company.isActive !== false
    };

    if (linked?.id) {
      await updatePayor({ ...base, id: linked.id }).unwrap();
      return;
    }

    await createPayor(base).unwrap();
  };

  const activePayersResponse = allPayersQuery.data;
  const isFetching = allPayersQuery.isFetching;

  useEffect(() => {
    dispatch(setPageCode('NPHIES_PAYER'));
    dispatch(setDivContent('TPA & Insurance Companies'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const isSelected = (rowData: NphiesPayer) => {
    if (rowData && selectedPayer && rowData.id === selectedPayer.id) {
      return 'selected-row';
    }

    return '';
  };

  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);

    setPaginationParams(prev => ({
      ...prev,
      size: newSize,
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

  const handleNew = () => {
    setSelectedPayer({ ...newNphiesPayer, tpaIds: [] });
    setOpenModal(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!selectedPayer.nphiesId?.trim()) errors.push('Payer Company Code is required');
    if (!selectedPayer.nameEn?.trim()) errors.push('Payer Company Name is required');
    if (!selectedPayer.facilityId) errors.push('Facility Name is required');
    if (selectedPayer.isActive === undefined || selectedPayer.isActive === null) {
      errors.push('Status is required');
    }
    if (!selectedPayer.insuranceAuthorityLicenseNo?.trim()) {
      errors.push('Insurance Authority License No. is required');
    }
    if (!selectedPayer.commercialRegistrationNo?.trim()) {
      errors.push('Commercial Registration No. is required');
    }
    if (!selectedPayer.vatRegistrationNo?.trim()) {
      errors.push('VAT Registration No. is required');
    }
    if (!selectedPayer.phone?.trim()) errors.push('Phone is required');
    if (!selectedPayer.email?.trim()) {
      errors.push('Email is required');
    } else if (!EMAIL_PATTERN.test(selectedPayer.email.trim())) {
      errors.push('Email must be valid');
    }
    if (selectedPayer.website?.trim() && !WEBSITE_PATTERN.test(selectedPayer.website.trim())) {
      errors.push('Website must be a valid URL');
    }
    if (selectedPayer.validFrom && selectedPayer.validTo && selectedPayer.validTo < selectedPayer.validFrom) {
      errors.push('Valid To must be on or after Valid From');
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
          const nested = Number(
            (value as { id?: unknown; value?: unknown }).id ??
              (value as { value?: unknown }).value
          );
          return Number.isFinite(nested) ? nested : null;
        }
        const id = Number(value);
        return Number.isFinite(id) ? id : null;
      };

      const toIdList = (values?: unknown[]) =>
        [...new Set((values ?? []).map(toId).filter((id): id is number => id != null))];

      const blankToNull = (value?: string | null) => {
        const text = value?.trim();
        return text ? text : null;
      };

      const tpaIds = toIdList(
        selectedPayer.tpaIds?.length
          ? selectedPayer.tpaIds
          : selectedPayer.tpas?.map(tpa => tpa.id)
      );

      const payload = {
        nphiesId: selectedPayer.nphiesId.trim(),
        nameEn: selectedPayer.nameEn.trim(),
        nameAr: blankToNull(selectedPayer.nameAr),
        shortName: blankToNull(selectedPayer.shortName),
        facilityId: toId(selectedPayer.facilityId),
        insuranceAuthorityLicenseNo: selectedPayer.insuranceAuthorityLicenseNo?.trim(),
        commercialRegistrationNo: selectedPayer.commercialRegistrationNo?.trim(),
        vatRegistrationNo: selectedPayer.vatRegistrationNo?.trim(),
        unifiedNationalNo: blankToNull(selectedPayer.unifiedNationalNo),
        headOfficeAddress: blankToNull(selectedPayer.headOfficeAddress),
        countryId: toId(selectedPayer.countryId),
        cityId: toId(selectedPayer.cityId),
        postalCode: blankToNull(selectedPayer.postalCode),
        contactPerson: blankToNull(selectedPayer.contactPerson),
        phone: selectedPayer.phone.trim(),
        mobile: blankToNull(selectedPayer.mobile),
        email: selectedPayer.email.trim(),
        website: blankToNull(selectedPayer.website),
        isActive: selectedPayer.isActive,
        approvalCoverageCompany: blankToNull(selectedPayer.approvalCoverageCompany),
        validFrom: blankToNull(selectedPayer.validFrom),
        validTo: blankToNull(selectedPayer.validTo),
        tpaIds
      };

      if (selectedPayer.id) {
        await updateNphiesPayer({
          ...payload,
          id: selectedPayer.id
        }).unwrap();
        dispatch(notify({ msg: 'Insurance company updated successfully', sev: 'success' }));
      } else {
        await createNphiesPayer(payload).unwrap();
        dispatch(notify({ msg: 'Insurance company created successfully', sev: 'success' }));
      }

      try {
        await syncLinkedPayor(selectedPayer);
      } catch {
        dispatch(
          notify({
            msg: 'Insurance company saved, but the linked payor record could not be updated.',
            sev: 'warning'
          })
        );
      }

      dispatch(TpaDefinitionService.util.invalidateTags(['TpaDefinition']));
      setOpenModal(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        err?.data?.title ||
        'Failed to save payer company';

      serverMessage = String(serverMessage).replace(/^error\./i, '');

      dispatch(
        notify({
          msg: serverMessage,
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleToggleActive = async (reason?: string) => {
    if (!selectedPayer?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleNphiesPayerActive({ id: selectedPayer.id, reason }).unwrap();
      dispatch(TpaDefinitionService.util.invalidateTags(['TpaDefinition']));
      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Payer company deactivated successfully'
              : 'Payer company reactivated successfully',
          sev: 'success'
        })
      );
      setOpenConfirmToggle(false);
    } catch {
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

  const iconsForActions = (rowData: NphiesPayer) => (
    <div className="container-of-icons nphies-payer-row-actions">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={event => {
          event.stopPropagation();
          setSelectedPayer({
            ...rowData,
            tpaIds: [...new Set(rowData.tpaIds ?? [])]
          });
          setOpenModal(true);
        }}
      />
      <MdAssignment
        className="icons-style"
        title="Define Policy"
        size={24}
        fill="var(--primary-gray)"
        onClick={event => {
          event.stopPropagation();
          setSelectedPayer({
            ...rowData,
            tpaIds: [...new Set(rowData.tpaIds ?? [])]
          });
          setOpenPolicyModal(true);
        }}
      />
      <MdTune
        className="icons-style"
        title="Payor Settings (Waseel)"
        size={24}
        fill="var(--primary-gray)"
        onClick={event => {
          event.stopPropagation();
          openPayorSettings(rowData);
        }}
      />
      <MdLink
        className="icons-style"
        title="Link TPAs"
        size={24}
        fill="var(--primary-gray)"
        onClick={event => {
          event.stopPropagation();
          setSelectedPayer({
            ...rowData,
            tpaIds: [...new Set(rowData.tpaIds ?? rowData.tpas?.map(tpa => tpa.id) ?? [])]
          });
          setOpenLinkTpas(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={event => {
            event.stopPropagation();
            setSelectedPayer(rowData);
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
          onClick={event => {
            event.stopPropagation();
            setSelectedPayer(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmToggle(true);
          }}
        />
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'nphiesId',
      title: <Translate>Payer Company Code</Translate>,
      width: 170,
      ...headerSearch('nphiesId', 'Search code')
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      width: 220,
      ...headerSearch('nameEn', 'Search English name')
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      width: 220,
      ...headerSearch('nameAr', 'Search Arabic name')
    },
    {
      key: 'facilityName',
      title: <Translate>Facility</Translate>,
      flexGrow: 2
    },
    {
      key: 'approvalCoverageCompany',
      title: <Translate>Approval Coverage Co.</Translate>,
      flexGrow: 2,
      render: (rowData: NphiesPayer) => (
        <span>{approvalCoverageCompanyLabel(rowData.approvalCoverageCompany)}</span>
      )
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 140,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (rowData: NphiesPayer) =>
        rowData.isActive ? (
          <span>Active</span>
        ) : (
          <span title={rowData.inactiveReason ?? undefined}>
            Inactive{rowData.inactiveReason ? ` — ${rowData.inactiveReason}` : ''}
          </span>
        )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      width: 190,
      flexGrow: 3.4,
      render: (rowData: NphiesPayer) => iconsForActions(rowData)
    }
  ];

  const totalCount = activePayersResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>
      <MyTab
        className="payer-setup-tabs"
        activeTab={activeTab}
        setActiveTab={key => setActiveTab(String(key))}
        data={[
          {
            title: 'TPA Definitions',
            content: <TpaDefinitionSection hideTitle />
          },
          {
            title: 'Insurance Companies',
            content: (
              <div className="payer-setup-section">
                <MyTable
                  data={activePayersResponse?.data ?? []}
                  totalCount={totalCount}
                  loading={isFetching}
                  columns={tableColumns}
                  height={420}
                  rowClassName={isSelected}
                  onRowClick={rowData =>
                    setSelectedPayer({
                      ...rowData,
                      tpaIds: rowData.tpaIds ?? []
                    })
                  }
                  page={pageIndex}
                  rowsPerPage={rowsPerPage}
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
                <InsuranceCompanyPoliciesPanel
                  insuranceCompany={selectedPayer?.id ? selectedPayer : null}
                />
              </div>
            )
          },
          {
            title: 'Coverage Management',
            content: activeTab === '3' ? <CoverageManagement embedded /> : null
          },
          {
            title: 'Relationships Dashboard',
            content: <PayerRelationshipDashboard active={activeTab === '4'} />
          }
        ]}
      />

      <DeactivationReasonModal
        open={openConfirmToggle && toggleActionType === 'deactivate'}
        setOpen={setOpenConfirmToggle}
        itemLabel="Payer Company"
        itemName={selectedPayer?.nameEn}
        onConfirm={handleToggleActive}
      />

      <DeletionConfirmationModal
        open={openConfirmToggle && toggleActionType === 'reactivate'}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Payer Company"
        actionButtonFunction={() => handleToggleActive()}
        actionType={toggleActionType}
      />

      <NphiesPayerModal
        open={openModal}
        setOpen={setOpenModal}
        payer={selectedPayer}
        setPayer={setSelectedPayer}
        onSave={handleSave}
      />

      <PayorModal
        open={openPayorModal}
        setOpen={setOpenPayorModal}
        payor={linkedPayor}
        setPayor={setLinkedPayor}
        onSave={handleSavePayorSettings}
        linkedToCompany
      />

      <PayerLinkTpasModal
        open={openLinkTpas}
        setOpen={setOpenLinkTpas}
        payer={selectedPayer}
      />

      <InsuranceCompanyPolicyModal
        open={openPolicyModal}
        setOpen={setOpenPolicyModal}
        insuranceCompany={selectedPayer?.id ? selectedPayer : null}
      />
    </Panel>
  );
};

export default NphiesPayerSetup;
