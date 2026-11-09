import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Input } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { TpaDefinition, TpaLinkedInsuranceCompany } from '@/types/model-types-new';
import {
  TpaDefinitionService,
  useGetLinkableInsuranceCompaniesQuery,
  useGetTpaDefinitionByIdQuery,
  useGetTpaLinkedInsuranceCompaniesQuery,
  useUpdateTpaDefinitionMutation
} from '@/services/setup/payer/TpaDefinitionSetupService';
import {
  NphiesPayerService,
  useGetAllNphiesPayersQuery
} from '@/services/setup/payer/NphiesPayerSetupService';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import './styles.less';

type TpaLinkCompaniesModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  tpa: TpaDefinition | null;
};

const uniqueIds = (ids?: Array<number | null | undefined>) =>
  [...new Set((ids ?? []).filter((id): id is number => Number.isFinite(Number(id))))].map(Number);

const toList = (value: unknown): any[] => {
  if (Array.isArray(value)) {
    return value;
  }
  if (Array.isArray((value as any)?.data)) {
    return (value as any).data;
  }
  if (Array.isArray((value as any)?.content)) {
    return (value as any).content;
  }
  return [];
};

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

const normalizeCompany = (company: any): TpaLinkedInsuranceCompany | null => {
  const id = toId(company?.id ?? company?.nphiesPayerId ?? company?.value);
  if (id == null) {
    return null;
  }

  return {
    id,
    nphiesId: String(company?.nphiesId ?? company?.code ?? '').trim(),
    nameEn: String(company?.nameEn ?? company?.name ?? company?.shortName ?? '').trim(),
    nameAr: String(company?.nameAr ?? '').trim() || null,
    isActive: company?.isActive !== false
  };
};

const TpaLinkCompaniesModal: React.FC<TpaLinkCompaniesModalProps> = ({ open, setOpen, tpa }) => {
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
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const currentTpa = tpaDetails ?? tpa;
  const initializedTpaIdRef = React.useRef<number | null>(null);

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
      ...(currentTpa?.insuranceCompanyIds ?? []),
      ...(currentTpa?.insuranceCompanies?.map(company => company.id) ?? [])
    ]);

    if (isLinkedLoading) {
      setSelectedIds(fallbackIds);
      return;
    }

    setSelectedIds(uniqueIds(linkedCompanies.map(company => company.id)));
    initializedTpaIdRef.current = tpa.id;
  }, [open, tpa?.id, tpaDetails, isLinkedLoading, linkedCompanies, currentTpa]);

  const companies = useMemo(() => {
    const byId = new Map<number, TpaLinkedInsuranceCompany>();
    [
      ...toList(payersResponse),
      ...toList(linkableCompanies),
      ...toList(linkedCompanies),
      ...toList(currentTpa?.insuranceCompanies)
    ].forEach(item => {
      const company = normalizeCompany(item);
      if (!company || byId.has(company.id)) {
        return;
      }
      byId.set(company.id, company);
    });
    return [...byId.values()];
  }, [payersResponse, linkableCompanies, linkedCompanies, currentTpa]);

  const linkableIdSet = useMemo(
    () =>
      new Set(
        toList(linkableCompanies)
          .map(item => toId(item?.id))
          .filter((id): id is number => id != null)
      ),
    [linkableCompanies]
  );

  const originallyLinkedIdSet = useMemo(
    () =>
      new Set(
        uniqueIds([
          ...(currentTpa?.insuranceCompanyIds ?? []),
          ...(currentTpa?.insuranceCompanies?.map(company => company.id) ?? []),
          ...linkedCompanies.map(company => company.id)
        ])
      ),
    [currentTpa, linkedCompanies]
  );

  const isCompanySelectable = (company: TpaLinkedInsuranceCompany) => {
    const allowedByLink =
      originallyLinkedIdSet.has(company.id) || isLinkableLoading || linkableIdSet.has(company.id);
    if (!allowedByLink) {
      return false;
    }
    if (company.isActive === false && !originallyLinkedIdSet.has(company.id)) {
      return false;
    }
    return true;
  };

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
    selectableFiltered.length > 0 && selectableFiltered.every(company => selectedIds.includes(company.id));
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

  const isLoading = isTpaLoading || isLinkedLoading || isLinkableLoading || isPayersLoading;

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
              title={selectable ? undefined : 'Already linked to another TPA'}
              onChange={() => toggleCompany(rowData.id, !selectedIds.includes(rowData.id))}
            />
          </span>
        );
      }
    },
    {
      key: 'nphiesId',
      title: <Translate>Payer Company Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'nameEn',
      title: <Translate>Name English</Translate>,
      flexGrow: 3
    },
    {
      key: 'nameAr',
      title: <Translate>Name Arabic</Translate>,
      flexGrow: 3
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
            already linked to another TPA cannot be selected again.
          </p>
          <div className="tpa-link-companies-toolbar">
            <Input
              value={search}
              onChange={value => setSearch(String(value ?? ''))}
              placeholder="Search company code or name"
            />
            <span className="tpa-link-companies-count">
              {selectedIds.length} selected
            </span>
          </div>
          <MyTable
            data={filteredCompanies}
            columns={columns}
            loading={isLoading}
            height={380}
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
