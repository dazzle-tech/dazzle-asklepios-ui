import React, { useEffect, useMemo, useState } from 'react';
import { Checkbox, Form, Input } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { LinkedTpa, NphiesPayer } from '@/types/model-types-new';
import {
  TpaDefinitionService,
  normalizeTpaDefinition,
  unwrapList,
  useGetActiveTpaDefinitionsQuery,
  useGetAllTpaDefinitionsQuery
} from '@/services/setup/payer/TpaDefinitionSetupService';
import {
  useGetNphiesPayerByIdQuery,
  useGetAvailableTpasForPayerQuery,
  useUpdateNphiesPayerTpasMutation,
  NphiesPayerService
} from '@/services/setup/payer/NphiesPayerSetupService';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import './styles.less';

type PayerLinkTpasModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payer: NphiesPayer | null;
};

const uniqueIds = (ids?: Array<number | null | undefined>) =>
  [
    ...new Set(
      (ids ?? [])
        .map(id => normalizeTpaDefinition(id)?.id ?? null)
        .filter((id): id is number => id != null)
    )
  ];

const mergeTpa = (existing: LinkedTpa | undefined, next: LinkedTpa): LinkedTpa => {
  if (!existing) {
    return next;
  }
  const incomingIsStub = !next.tpaCode && !next.name;
  return {
    id: next.id,
    tpaCode: next.tpaCode || existing.tpaCode,
    name: next.name || existing.name,
    isActive: incomingIsStub ? existing.isActive : next.isActive
  };
};

const PayerLinkTpasModal: React.FC<PayerLinkTpasModalProps> = ({ open, setOpen, payer }) => {
  const dispatch = useAppDispatch();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [search, setSearch] = useState('');
  const [updateNphiesPayerTpas] = useUpdateNphiesPayerTpasMutation();
  const initializedPayerIdRef = React.useRef<number | null>(null);

  const { data: payerDetails, isFetching: isPayerLoading } = useGetNphiesPayerByIdQuery(
    payer?.id as number,
    { skip: !open || !payer?.id }
  );

  const { data: availableTpas, isFetching: isAvailableLoading } = useGetAvailableTpasForPayerQuery(
    payer?.id as number,
    { skip: !open || !payer?.id }
  );

  const { data: allTpasResponse, isFetching: isAllTpasLoading } = useGetAllTpaDefinitionsQuery(
    { page: 0, size: 1000, sort: 'name,asc' },
    { skip: !open, refetchOnMountOrArgChange: true }
  );

  const { data: activeTpasResponse, isFetching: isActiveTpasLoading } =
    useGetActiveTpaDefinitionsQuery(
      { page: 0, size: 1000, sort: 'name,asc' },
      { skip: !open, refetchOnMountOrArgChange: true }
    );

  const currentPayer = payerDetails ?? payer;

  useEffect(() => {
    if (!open) {
      initializedPayerIdRef.current = null;
      setSearch('');
      return;
    }

    if (!payer?.id || initializedPayerIdRef.current === payer.id) {
      return;
    }

    const fallbackIds = uniqueIds([
      ...(currentPayer?.tpaIds ?? []),
      ...(currentPayer?.tpas ?? []).map(tpa => tpa.id)
    ]);
    setSelectedIds(fallbackIds);

    if (!isPayerLoading) {
      initializedPayerIdRef.current = payer.id;
    }
  }, [open, payer?.id, currentPayer, isPayerLoading]);

  const tpas = useMemo(() => {
    const byId = new Map<number, LinkedTpa>();
    [
      ...unwrapList(allTpasResponse),
      ...unwrapList(activeTpasResponse),
      ...unwrapList(availableTpas),
      ...unwrapList(currentPayer?.tpas)
    ].forEach(item => {
      const tpa = normalizeTpaDefinition(item);
      if (!tpa) {
        return;
      }
      byId.set(tpa.id, mergeTpa(byId.get(tpa.id), tpa));
    });
    return [...byId.values()];
  }, [allTpasResponse, activeTpasResponse, availableTpas, currentPayer]);

  const originallyLinkedIdSet = useMemo(
    () =>
      new Set(
        uniqueIds([
          ...(currentPayer?.tpaIds ?? []),
          ...(currentPayer?.tpas ?? []).map(tpa => tpa.id)
        ])
      ),
    [currentPayer]
  );

  const isTpaSelectable = (tpa: LinkedTpa) =>
    tpa.isActive !== false || originallyLinkedIdSet.has(tpa.id);

  const filteredTpas = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return tpas;
    }
    return tpas.filter(tpa =>
      [tpa.tpaCode, tpa.name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(term))
    );
  }, [tpas, search]);

  const selectableFiltered = filteredTpas.filter(isTpaSelectable);
  const allFilteredSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every(tpa => selectedIds.includes(tpa.id));
  const someFilteredSelected =
    !allFilteredSelected && selectableFiltered.some(tpa => selectedIds.includes(tpa.id));

  const toggleTpa = (tpaId: number, nextChecked: boolean) => {
    setSelectedIds(prev => {
      if (nextChecked) {
        return uniqueIds([...prev, tpaId]);
      }
      return prev.filter(id => id !== tpaId);
    });
  };

  const toggleAllFiltered = (nextChecked: boolean) => {
    const ids = selectableFiltered.map(tpa => tpa.id);
    setSelectedIds(prev => {
      if (nextChecked) {
        return uniqueIds([...prev, ...ids]);
      }
      return prev.filter(id => !ids.includes(id));
    });
  };

  const handleSave = async () => {
    if (!payer?.id) {
      return;
    }

    try {
      dispatch(showSystemLoader());
      await updateNphiesPayerTpas({ id: payer.id, tpaIds: uniqueIds(selectedIds) }).unwrap();
      dispatch(TpaDefinitionService.util.invalidateTags(['TpaDefinition']));
      dispatch(NphiesPayerService.util.invalidateTags(['NphiesPayer']));
      dispatch(notify({ msg: 'TPAs linked successfully', sev: 'success' }));
      setOpen(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.title ||
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Failed to link TPAs';
      serverMessage = String(serverMessage).replace(/^error\./i, '');
      dispatch(notify({ msg: serverMessage, sev: 'warning' }));
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const isLoading =
    isPayerLoading || isAvailableLoading || isAllTpasLoading || isActiveTpasLoading;

  const columns = [
    {
      key: 'select',
      title: (
        <span onClick={event => event.stopPropagation()}>
          <Checkbox
            checked={allFilteredSelected}
            indeterminate={someFilteredSelected}
            disabled={selectableFiltered.length === 0}
            onChange={() => toggleAllFiltered(!allFilteredSelected)}
          />
        </span>
      ),
      flexGrow: 0.6,
      render: (rowData: LinkedTpa) => {
        const selectable = isTpaSelectable(rowData);
        return (
          <span onClick={event => event.stopPropagation()}>
            <Checkbox
              checked={selectedIds.includes(rowData.id)}
              disabled={!selectable}
              title={selectable ? undefined : 'Inactive TPA cannot be linked'}
              onChange={() => toggleTpa(rowData.id, !selectedIds.includes(rowData.id))}
            />
          </span>
        );
      }
    },
    {
      key: 'tpaCode',
      title: <Translate>TPA Code</Translate>,
      flexGrow: 2,
      render: (rowData: LinkedTpa) => <span>{rowData.tpaCode || '-'}</span>
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      flexGrow: 4,
      render: (rowData: LinkedTpa) => <span>{rowData.name || '-'}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 1,
      render: (rowData: LinkedTpa) => <span>{rowData.isActive ? 'Active' : 'Inactive'}</span>
    }
  ];

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        currentPayer
          ? `Link TPAs - ${currentPayer.nameEn || currentPayer.nphiesId}`
          : 'Link TPAs'
      }
      size="72vw"
      bodyheight="68vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!payer?.id || isPayerLoading}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <p className="payer-link-tpas-hint">
            Select one or more TPAs from the list below. A company can be linked to multiple TPAs,
            and the same TPA cannot be linked twice to this company.
          </p>
          <div className="tpa-link-companies-toolbar">
            <Input
              value={search}
              onChange={value => setSearch(String(value ?? ''))}
              placeholder="Search TPA code or name"
            />
            <span className="tpa-link-companies-count">{selectedIds.length} selected</span>
          </div>
          <MyTable
            data={filteredTpas}
            columns={columns}
            loading={isLoading}
            height={380}
            dontTranslateData
            onRowClick={(rowData: LinkedTpa) => {
              if (!isTpaSelectable(rowData)) {
                return;
              }
              toggleTpa(rowData.id, !selectedIds.includes(rowData.id));
            }}
            rowClassName={(rowData: LinkedTpa) =>
              selectedIds.includes(rowData.id) ? 'selected-row' : ''
            }
          />
        </Form>
      }
    />
  );
};

export default PayerLinkTpasModal;
