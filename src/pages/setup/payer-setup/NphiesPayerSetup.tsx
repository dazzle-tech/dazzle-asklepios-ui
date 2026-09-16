import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel, Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdLink, MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { NphiesPayer } from '@/types/model-types-new';
import { newNphiesPayer } from '@/types/model-types-constructor-new';
import { approvalCoverageCompanyLabel } from '@/pages/setup/coverage-management/coverageHelpers';

import {
  useGetAllNphiesPayersQuery,
  useGetNphiesPayersByNphiesIdQuery,
  useGetNphiesPayersByNameEnQuery,
  useGetNphiesPayersByNameArQuery,
  useCreateNphiesPayerMutation,
  useUpdateNphiesPayerMutation,
  useToggleNphiesPayerActiveMutation
} from '@/services/setup/payer/NphiesPayerSetupService';
import NphiesPayerModal from './NphiesPayerModal';
import PayerLinkTpasModal from './PayerLinkTpasModal';
import TpaDefinitionSection from './TpaDefinitionSection';
import { TpaDefinitionService } from '@/services/setup/payer/TpaDefinitionSetupService';

type FilterCriteria = '' | 'nphiesId' | 'nameEn' | 'nameAr';

const filterCriteriaOptions = [
  { label: 'Payer Company Code', value: 'nphiesId' },
  { label: 'English Name', value: 'nameEn' },
  { label: 'Arabic Name', value: 'nameAr' }
];

const initialNphiesPayerFilter = {
  criteria: '' as FilterCriteria,
  nphiesId: '',
  nameEn: '',
  nameAr: ''
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WEBSITE_PATTERN = /^https?:\/\/.+$/i;

const NphiesPayerSetup = () => {
  const dispatch = useAppDispatch();

  const [selectedPayer, setSelectedPayer] = useState<NphiesPayer>({ ...newNphiesPayer });
  const [openModal, setOpenModal] = useState(false);
  const [openLinkTpas, setOpenLinkTpas] = useState(false);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [payerFilter, setPayerFilter] = useState<{
    criteria: FilterCriteria;
    nphiesId: string;
    nameEn: string;
    nameAr: string;
  }>(initialNphiesPayerFilter);

  const [appliedPayerFilter, setAppliedPayerFilter] = useState<{
    criteria: FilterCriteria;
    nphiesId: string;
    nameEn: string;
    nameAr: string;
  }>(initialNphiesPayerFilter);

  const hasNphiesIdFilter =
    appliedPayerFilter.criteria === 'nphiesId' && !!appliedPayerFilter.nphiesId?.trim();

  const hasNameEnFilter =
    appliedPayerFilter.criteria === 'nameEn' && !!appliedPayerFilter.nameEn?.trim();

  const hasNameArFilter =
    appliedPayerFilter.criteria === 'nameAr' && !!appliedPayerFilter.nameAr?.trim();

  const allPayersQuery = useGetAllNphiesPayersQuery(
    {
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: hasNphiesIdFilter || hasNameEnFilter || hasNameArFilter
    }
  );

  const payersByNphiesIdQuery = useGetNphiesPayersByNphiesIdQuery(
    {
      nphiesId: appliedPayerFilter.nphiesId.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNphiesIdFilter
    }
  );

  const payersByNameEnQuery = useGetNphiesPayersByNameEnQuery(
    {
      nameEn: appliedPayerFilter.nameEn.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNameEnFilter
    }
  );

  const payersByNameArQuery = useGetNphiesPayersByNameArQuery(
    {
      nameAr: appliedPayerFilter.nameAr.trim(),
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort
    },
    {
      skip: !hasNameArFilter
    }
  );

  const [createNphiesPayer] = useCreateNphiesPayerMutation();
  const [updateNphiesPayer] = useUpdateNphiesPayerMutation();
  const [toggleNphiesPayerActive] = useToggleNphiesPayerActiveMutation();

  const activePayersResponse = hasNphiesIdFilter
    ? payersByNphiesIdQuery.data
    : hasNameEnFilter
      ? payersByNameEnQuery.data
      : hasNameArFilter
        ? payersByNameArQuery.data
        : allPayersQuery.data;

  const isFetching =
    allPayersQuery.isFetching ||
    payersByNphiesIdQuery.isFetching ||
    payersByNameEnQuery.isFetching ||
    payersByNameArQuery.isFetching;

  useEffect(() => {
    dispatch(setPageCode('NPHIES_PAYER'));
    dispatch(setDivContent('TPA & Insurance Companies'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const handleResetFilter = () => {
    setPayerFilter({ ...initialNphiesPayerFilter });
    setAppliedPayerFilter({ ...initialNphiesPayerFilter });
    setPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
  };

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

  const handleSearch = (nextFilter = payerFilter) => {
    if (
      !nextFilter.criteria ||
      (nextFilter.criteria === 'nphiesId' && !nextFilter.nphiesId.trim()) ||
      (nextFilter.criteria === 'nameEn' && !nextFilter.nameEn.trim()) ||
      (nextFilter.criteria === 'nameAr' && !nextFilter.nameAr.trim())
    ) {
      handleResetFilter();
      return;
    }

    setAppliedPayerFilter({
      criteria: nextFilter.criteria,
      nphiesId: nextFilter.nphiesId,
      nameEn: nextFilter.nameEn,
      nameAr: nextFilter.nameAr
    });

    setPaginationParams(prev => ({
      ...prev,
      page: 0
    }));
  };

  const applyHeaderSearch = (criteria: FilterCriteria, value: string) => {
    const next = {
      criteria,
      nphiesId: criteria === 'nphiesId' ? value : '',
      nameEn: criteria === 'nameEn' ? value : '',
      nameAr: criteria === 'nameAr' ? value : ''
    };
    setPayerFilter(next);
    handleSearch(next);
  };

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

  const handleToggleActive = async () => {
    if (!selectedPayer?.id) return;
    try {
      dispatch(showSystemLoader());
      await toggleNphiesPayerActive(selectedPayer.id).unwrap();
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
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setSelectedPayer({
            ...rowData,
            tpaIds: [...new Set(rowData.tpaIds ?? [])]
          });
          setOpenModal(true);
        }}
      />
      <MdLink
        className="icons-style"
        title="Link TPAs"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
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
          onClick={() => {
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
          onClick={() => {
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
      title: <Translate>>Payer Company Code</Translate>,
      flexGrow: 2,
      searchable: true,
      searchPlaceholder: 'Search code',
      searchValue: payerFilter.nphiesId,
      onSearchChange: (value: string) =>
        setPayerFilter(prev => ({
          ...prev,
          criteria: 'nphiesId',
          nphiesId: value,
          nameEn: '',
          nameAr: ''
        })),
      onSearchSubmit: (value?: string) => applyHeaderSearch('nphiesId', value ?? payerFilter.nphiesId)
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3,
      searchable: true,
      searchPlaceholder: 'Search English name',
      searchValue: payerFilter.nameEn,
      onSearchChange: (value: string) =>
        setPayerFilter(prev => ({
          ...prev,
          criteria: 'nameEn',
          nameEn: value,
          nphiesId: '',
          nameAr: ''
        })),
      onSearchSubmit: (value?: string) => applyHeaderSearch('nameEn', value ?? payerFilter.nameEn)
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3,
      searchable: true,
      searchPlaceholder: 'Search Arabic name',
      searchValue: payerFilter.nameAr,
      onSearchChange: (value: string) =>
        setPayerFilter(prev => ({
          ...prev,
          criteria: 'nameAr',
          nameAr: value,
          nphiesId: '',
          nameEn: ''
        })),
      onSearchSubmit: (value?: string) => applyHeaderSearch('nameAr', value ?? payerFilter.nameAr)
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
      flexGrow: 1,
      render: (rowData: NphiesPayer) => <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 1.4,
      render: (rowData: NphiesPayer) => iconsForActions(rowData)
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
        record={payerFilter}
        setRecord={(updated: any) => {
          const next = typeof updated === 'function' ? updated(payerFilter) : updated;
          const nextCriteria = (next?.criteria ?? '') as FilterCriteria;

          if (!nextCriteria) {
            handleResetFilter();
            return;
          }

          setPayerFilter({
            criteria: nextCriteria,
            nphiesId: '',
            nameEn: '',
            nameAr: ''
          });
        }}
        showLabel={false}
        placeholder="Select Criteria"
        searchable={false}
      />

      {payerFilter.criteria === 'nphiesId' && (
        <MyInput
          width="220px"
          fieldName="nphiesId"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNphiesId = next?.nphiesId ?? '';

            if (!nextNphiesId.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nphiesId: nextNphiesId
            }));
          }}
          showLabel={false}
          placeholder="Search Payer Company Code"
        />
      )}

      {payerFilter.criteria === 'nameEn' && (
        <MyInput
          width="220px"
          fieldName="nameEn"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNameEn = next?.nameEn ?? '';

            if (!nextNameEn.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nameEn: nextNameEn
            }));
          }}
          showLabel={false}
          placeholder="Search English Name"
        />
      )}

      {payerFilter.criteria === 'nameAr' && (
        <MyInput
          width="220px"
          fieldName="nameAr"
          fieldType="text"
          record={payerFilter}
          setRecord={(updated: any) => {
            const next = typeof updated === 'function' ? updated(payerFilter) : updated;
            const nextNameAr = next?.nameAr ?? '';

            if (!nextNameAr.trim()) {
              handleResetFilter();
              return;
            }

            setPayerFilter(prev => ({
              ...prev,
              nameAr: nextNameAr
            }));
          }}
          showLabel={false}
          placeholder="Search Arabic Name"
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

  const totalCount = activePayersResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  return (
    <Panel>
      <div className="payer-tpa-setup-stack">
        <TpaDefinitionSection />

        <div className="payer-setup-section">
          <div className="payer-setup-section-title">
            <Translate>Insurance Companies</Translate>
          </div>
          <MyTable
            data={activePayersResponse?.data ?? []}
            totalCount={totalCount}
            loading={isFetching}
            columns={tableColumns}
            height={280}
            rowClassName={isSelected}
            onRowClick={rowData =>
              setSelectedPayer({
                ...rowData,
                tpaIds: rowData.tpaIds ?? []
              })
            }
            filters={filters()}
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
        </div>
      </div>

      <DeletionConfirmationModal
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Payer Company"
        actionButtonFunction={handleToggleActive}
        actionType={toggleActionType}
      />

      <NphiesPayerModal
        open={openModal}
        setOpen={setOpenModal}
        payer={selectedPayer}
        setPayer={setSelectedPayer}
        onSave={handleSave}
      />

      <PayerLinkTpasModal
        open={openLinkTpas}
        setOpen={setOpenLinkTpas}
        payer={selectedPayer}
      />
    </Panel>
  );
};

export default NphiesPayerSetup;
