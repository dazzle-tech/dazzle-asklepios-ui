import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { NphiesPayer } from '@/types/model-types-new';

import {
  useGetAllNphiesPayersQuery,
  useGetNphiesPayerByIdQuery,
  useGetAvailableChildCompaniesForPayerQuery,
  useUpdateNphiesPayerChildCompaniesMutation,
  NphiesPayerService
} from '@/services/setup/payer/NphiesPayerSetupService';

import { useAppDispatch } from '@/hooks';

import {
  hideSystemLoader,
  notify,
  showSystemLoader
} from '@/utils/uiReducerActions';

import './styles.less';

type PayerLinkChildCompaniesModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payer: NphiesPayer | null;
};

type CompanyPickerOption = {
  value: number;
  label: string;
  isActive: boolean;
};

const extractCompanyId = (value: any): number | null => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === 'object') {
    const possibleId = value.id ?? value.childCompanyId ?? value.value;
    if (possibleId === null || possibleId === undefined) {
      return null;
    }
    const parsed = Number(possibleId);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const normalizeCompanyIds = (...sources: any[]): number[] => {
  const result = new Set<number>();

  const processValue = (value: any) => {
    if (value === null || value === undefined) {
      return;
    }
    if (Array.isArray(value)) {
      value.forEach(processValue);
      return;
    }
    if (value instanceof Set) {
      Array.from(value).forEach(processValue);
      return;
    }
    const id = extractCompanyId(value);
    if (id !== null) {
      result.add(id);
    }
  };

  sources.forEach(processValue);
  return Array.from(result);
};

const extractArray = (response: any): any[] => {
  if (!response) {
    return [];
  }
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response.data)) {
    return response.data;
  }
  if (Array.isArray(response.content)) {
    return response.content;
  }
  if (Array.isArray(response.items)) {
    return response.items;
  }
  return [];
};

const getCompanyLabel = (company: any, id: number): string => {
  if (!company) {
    return `Insurance #${id}`;
  }

  const code = String(company.nphiesId ?? company.code ?? '').trim();
  const name = String(company.nameEn ?? company.name ?? '').trim();

  if (code && name) {
    return `${code} - ${name}`;
  }
  if (name) {
    return name;
  }
  if (code) {
    return code;
  }
  return `Insurance #${id}`;
};

const PayerLinkChildCompaniesModal: React.FC<PayerLinkChildCompaniesModalProps> = ({
  open,
  setOpen,
  payer
}) => {
  const dispatch = useAppDispatch();
  const [childCompanyIds, setChildCompanyIds] = useState<number[]>([]);

  const [updateNphiesPayerChildCompanies, { isLoading: isSaving }] =
    useUpdateNphiesPayerChildCompaniesMutation();

  const { data: payerDetails, isFetching: isPayerLoading } = useGetNphiesPayerByIdQuery(
    payer?.id as number,
    {
      skip: !open || !payer?.id
    }
  );

  const { data: availableCompaniesResponse, isFetching: isAvailableLoading } =
    useGetAvailableChildCompaniesForPayerQuery(payer?.id as number, {
      skip: !open || !payer?.id
    });

  const { data: payersResponse, isFetching: isCatalogLoading } = useGetAllNphiesPayersQuery(
    {
      page: 0,
      size: 2000,
      sort: 'nameEn,asc'
    },
    {
      skip: !open
    }
  );

  const currentPayer = payerDetails ?? payer;
  const availableCompanies = useMemo(
    () => extractArray(availableCompaniesResponse),
    [availableCompaniesResponse]
  );
  const catalogCompanies = useMemo(() => extractArray(payersResponse), [payersResponse]);

  useEffect(() => {
    if (!open || !currentPayer) {
      setChildCompanyIds([]);
      return;
    }

    setChildCompanyIds(
      normalizeCompanyIds(currentPayer.childCompanyIds, currentPayer.childCompanies)
    );
  }, [open, payer?.id, payerDetails, currentPayer]);

  const companyOptions = useMemo<CompanyPickerOption[]>(() => {
    const optionMap = new Map<number, CompanyPickerOption>();
    const parentId = currentPayer?.id == null ? null : Number(currentPayer.id);

    const addOption = (company: any) => {
      const id = extractCompanyId(company);
      if (id === null || id === parentId) {
        return;
      }
      optionMap.set(id, {
        value: id,
        label: getCompanyLabel(company, id),
        isActive: company?.isActive !== false
      });
    };

    catalogCompanies.forEach(addOption);
    availableCompanies.forEach(addOption);
    extractArray(currentPayer?.childCompanies).forEach(addOption);

    const originallyLinkedIds = normalizeCompanyIds(
      currentPayer?.childCompanyIds,
      currentPayer?.childCompanies
    );
    const selectableIds = new Set<number>([
      ...availableCompanies.map(extractCompanyId).filter((id): id is number => id !== null),
      ...originallyLinkedIds,
      ...childCompanyIds
    ]);

    childCompanyIds.forEach(id => {
      if (!optionMap.has(id)) {
        optionMap.set(id, {
          value: id,
          label: `Insurance #${id}`,
          isActive: true
        });
      }
    });

    return Array.from(optionMap.values())
      .filter(option => selectableIds.has(option.value))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [availableCompanies, catalogCompanies, currentPayer, childCompanyIds]);

  const handleCompanyChange = (updated: any) => {
    const nextValue =
      typeof updated === 'function'
        ? updated({ childCompanyIds })?.childCompanyIds
        : updated?.childCompanyIds;
    setChildCompanyIds(normalizeCompanyIds(nextValue));
  };

  const handleSave = async () => {
    if (!payer?.id) {
      return;
    }

    try {
      dispatch(showSystemLoader());
      await updateNphiesPayerChildCompanies({
        id: payer.id,
        childCompanyIds: normalizeCompanyIds(childCompanyIds)
      }).unwrap();

      dispatch(NphiesPayerService.util.invalidateTags(['NphiesPayer']));
      dispatch(
        notify({
          msg: 'Insurance companies linked successfully',
          sev: 'success'
        })
      );
      setOpen(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        err?.data?.title ||
        'Failed to link insurance companies';

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

  const handleClose = () => {
    setChildCompanyIds([]);
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={handleClose}
      title={
        currentPayer
          ? `Link Insurance Companies - ${currentPayer.nameEn || currentPayer.nphiesId || ''}`
          : 'Link Insurance Companies'
      }
      size="42vw"
      bodyheight="38vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!payer?.id || isPayerLoading || isSaving}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <p className="payer-link-tpas-hint">
            This company is the parent. Select one or more insurance companies to place under
            it. A company can belong to only one parent.
          </p>

          <MyInput
            width="100%"
            column
            fieldName="childCompanyIds"
            fieldType="checkPicker"
            fieldLabel="Child Insurance Companies"
            record={{
              childCompanyIds
            }}
            setRecord={handleCompanyChange}
            selectData={companyOptions}
            selectDataLabel="label"
            selectDataValue="value"
            loading={isAvailableLoading || isPayerLoading || isCatalogLoading}
            searchable
            virtualized={false}
            menuMaxHeight={240}
            placeholder="Select one or more insurance companies"
          />
        </Form>
      }
    />
  );
};

export default PayerLinkChildCompaniesModal;
