import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Input } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { NphiesPayer, TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';
import {
  TpaDefinitionService,
  normalizeLinkedInsuranceCompany,
  unwrapList,
  useGetLinkableInsuranceCompaniesQuery,
  useGetTpaDefinitionByIdQuery,
  useGetTpaLinkedInsuranceCompaniesQuery,
  useUpdateTpaDefinitionMutation
} from '@/services/setup/payer/TpaDefinitionSetupService';
import {
  NphiesPayerService,
  useGetActiveNphiesPayersQuery,
  useGetAllNphiesPayersQuery
} from '@/services/setup/payer/NphiesPayerSetupService';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import './styles.less';

type TpaLinkCompaniesModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition | null;
  insuranceCompanies?: NphiesPayer[];
};

const uniqueIds = (ids?: Array<number | null | undefined>) =>
  [...new Set((ids ?? []).filter((id): id is number => Number.isFinite(Number(id))))].map(Number);

const toId = (value: unknown): number | null => {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value === 'object') {
    const nested = Number(
      (value as { id?: unknown; value?: unknown }).id ?? (value as { value?: unknown }).value
    );
    return Number.isFinite(nested) ? nested : null;
  }
  const id = Number(value);
  return Number.isFinite(id) ? id : null;
};

const companyIdOf = (company: any): number | null =>
  normalizeLinkedInsuranceCompany(company)?.id ?? toId(company);

const mergeCompany = (
  existing: TpaLinkedInsuranceCompany | undefined,
  next: TpaLinkedInsuranceCompany
): TpaLinkedInsuranceCompany => {
  if (!existing) {
    return next;
  }
  const incomingIsStub = !next.nphiesId && !next.nameEn && !next.nameAr;
  return {
    id: next.id,
    nphiesId: next.nphiesId || existing.nphiesId,
    nameEn: next.nameEn || existing.nameEn,
    nameAr: next.nameAr || existing.nameAr,
    isActive: incomingIsStub ? existing.isActive : next.isActive
  };
};

const TpaLinkCompaniesModal: React.FC<TpaLinkCompaniesModalProps> = ({
  open,
  setOpen,
  tpa,
  insuranceCompanies = []
}) => {
  const dispatch = useAppDispatch();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [updateTpa] = useUpdateTpaDefinitionMutation();

  const { data: tpaDetails, isFetching: isTpaLoading } = useGetTpaDefinitionByIdQuery(
    tpa?.id as number,
    { skip: !open || !tpa?.id }
  );

  const { data: linkedCompanies = [], isFetching: isLinkedLoading } =
    useGetTpaLinkedInsuranceCompaniesQuery(tpa?.id as number, {
      skip: !open || !tpa?.id
    });

  const { data: linkableCompanies = [], isFetching: isLinkableLoading } =
    useGetLinkableInsuranceCompaniesQuery(undefined, { skip: !open });

  const { data: payersResponse, isFetching: isPayersLoading } = useGetAllNphiesPayersQuery(
    { page: 0, size: 200, sort: 'id,asc' },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const { data: activePayers = [], isFetching: isActivePayersLoading } =
    useGetActiveNphiesPayersQuery(undefined, { skip: !open });

  const currentTpa = tpaDetails ?? tpa;
  const initializedTpaIdRef = React.useRef<number | null>(null);

  const linkedCompanyList = useMemo(() => unwrapList(linkedCompanies), [linkedCompanies]);
  const linkableCompanyList = useMemo(() => unwrapList(linkableCompanies), [linkableCompanies]);

  useEffect(() => {
    if (!open) {
      initializedTpaIdRef.current = null;
      setSearch('');
      return;
    }

    if (!tpa?.id || initializedTpaIdRef.current === tpa.id) {
      return;
    }

    const fallbackIds = uniqueIds([
      ...(currentTpa?.insuranceCompanyIds ?? []).map(toId),
      ...(currentTpa?.insuranceCompanies ?? []).map(companyIdOf)
    ]);

    if (isLinkedLoading) {
      setSelectedIds(fallbackIds);
      return;
    }

    const linkedIds = uniqueIds(linkedCompanyList.map(companyIdOf));
    setSelectedIds(linkedIds.length ? linkedIds : fallbackIds);
    initializedTpaIdRef.current = tpa.id;
  }, [open, tpa?.id, tpaDetails, isLinkedLoading, linkedCompanyList, currentTpa]);

  const companies = useMemo(() => {
    const byId = new Map<number, TpaLinkedInsuranceCompany>();
    [
      ...unwrapList(payersResponse),
      ...unwrapList(activePayers),
      ...unwrapList(insuranceCompanies),
      ...linkableCompanyList,
      ...linkedCompanyList,
      ...unwrapList(currentTpa?.insuranceCompanies)
    ].forEach(item => {
      const company = normalizeLinkedInsuranceCompany(item);
      if (!company) {
        return;
      }
      byId.set(company.id, mergeCompany(byId.get(company.id), company));
    });
    return [...byId.values()];
  }, [
    payersResponse,
    activePayers,
    insuranceCompanies,
    linkableCompanyList,
    linkedCompanyList,
    currentTpa
  ]);

  const originallyLinkedIdSet = useMemo(
    () =>
      new Set(
        uniqueIds([
          ...(currentTpa?.insuranceCompanyIds ?? []).map(toId),
          ...(currentTpa?.insuranceCompanies ?? []).map(companyIdOf),
          ...linkedCompanyList.map(companyIdOf)
        ])
      ),
    [currentTpa, linkedCompanyList]
  );

  const isCompanySelectable = (company: TpaLinkedInsuranceCompany) =>
    company.isActive !== false || originallyLinkedIdSet.has(company.id);

  const filteredCompanies = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return companies;
    }
    return companies.filter(company =>
      [company.nphiesId, company.nameEn, company.nameAr]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [companies, search]);

  const selectableFiltered = filteredCompanies.filter(isCompanySelectable);
  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every(company => selectedIds.includes(company.id));
  const someFilteredSelected =
    !allFilteredSelected && selectableFiltered.some(company => selectedIds.includes(company.id));

  const toggleCompany = (companyId: number, nextChecked: boolean) => {
    setSelectedIds(prev => {
      if (nextChecked) {
        return uniqueIds([...prev, companyId]);
      }
      return prev.filter(id => id !== companyId);
    });
  };

  const toggleAllFiltered = (nextChecked: boolean) => {
    const ids = selectableFiltered.map(company => company.id);
    setSelectedIds(prev => {
      if (nextChecked) {
        return uniqueIds([...prev, ...ids]);
      }
      return prev.filter(id => !ids.includes(id));
    });
  };

  const handleSave = async () => {
    if (!currentTpa?.id) {
      return;
    }
    if (currentTpa.isActive === false) {
      dispatch(
        notify({
          msg: 'Activate TPA before linking insurance companies',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      dispatch(showSystemLoader());
      await updateTpa({
        id: currentTpa.id,
        tpaCode: currentTpa.tpaCode,
        name: currentTpa.name,
        guarantorType: currentTpa.guarantorType,
        activationDate: currentTpa.activationDate,
        isActive: currentTpa.isActive,
        taxRegistrationNo: currentTpa.taxRegistrationNo || null,
        countryId: toId(currentTpa.countryId),
        cityId: toId(currentTpa.cityId),
        address: currentTpa.address || null,
        phone: currentTpa.phone || null,
        email: currentTpa.email || null,
        insuranceCompanyIds: uniqueIds(selectedIds)
      }).unwrap();
      dispatch(TpaDefinitionService.util.invalidateTags(['TpaDefinition']));
      dispatch(NphiesPayerService.util.invalidateTags(['NphiesPayer']));
      dispatch(notify({ msg: 'Insurance companies linked successfully', sev: 'success' }));
      setOpen(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.title ||
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Failed to link insurance companies';
      serverMessage = String(serverMessage).replace(/^error\./i, '');
      dispatch(notify({ msg: serverMessage, sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isLoading =
    isTpaLoading || isLinkedLoading || isLinkableLoading || isPayersLoading || isActivePayersLoading;

  const columns = [
    {
      key: 'select',
      title: (
        <span onClick={event => event.stopPropagation()}>
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            disabled={!currentTpa?.isActive || selectableFiltered.length === 0}
            onChange={() => toggleAllFiltered(!allFilteredSelected)}
          />
        </span>
      ),
      flexGrow: 0.6,
      render: (rowData: TpaLinkedInsuranceCompany) => {
        const selectable = isCompanySelectable(rowData);
        return (
          <span onClick={event => event.stopPropagation()}>
            <Checkbox
              checked={selectedIds.includes(rowData.id)}
              disabled={!currentTpa?.isActive || !selectable}
              title={selectable ? undefined : 'Inactive company cannot be linked'}
              onChange={() => toggleCompany(rowData.id, !selectedIds.includes(rowData.id))}
            />
          </span>
        );
      }
    },
    {
      key: 'nphiesId',
      title: <Translate>Payer Company Code</Translate>,
      flexGrow: 2,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nphiesId || '-'}</span>
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nameEn || '-'}</span>
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3,
      render: (rowData: TpaLinkedInsuranceCompany) => <span>{rowData.nameAr || '-'}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: TpaLinkedInsuranceCompany) => (
        <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
      )
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        currentTpa
          ? `Link Insurance Companies - ${currentTpa.name || currentTpa.tpaCode}`
          : 'Link Insurance Companies'
      }
      size="72vw"
      bodyheight="68vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!currentTpa?.id || isTpaLoading || currentTpa?.isActive === false}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <p className="payer-link-tpas-hint">
            Select insurance companies from the list below to link them with this TPA. A company
            can be linked to more than one TPA.
          </p>
          <div className="tpa-link-companies-toolbar">
            <Input
              value={search}
              onChange={value => setSearch(String(value ?? ''))}
              placeholder="Search company code or name"
            />
            <span className="tpa-link-companies-count">{selectedIds.length} selected</span>
          </div>
          <MyTable
            data={filteredCompanies}
            columns={columns}
            loading={isLoading}
            height={380}
            dontTranslateData
            onRowClick={(rowData: TpaLinkedInsuranceCompany) => {
              if (!currentTpa?.isActive || !isCompanySelectable(rowData)) {
                return;
              }
              toggleCompany(rowData.id, !selectedIds.includes(rowData.id));
            }}
            rowClassName={(rowData: TpaLinkedInsuranceCompany) =>
              selectedIds.includes(rowData.id) ? 'selected-row' : ''
            }
          />
        </Form>
      }
    />
  );
};

export default TpaLinkCompaniesModal;
