import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { NphiesPayer } from '@/types/model-types-new';
import { TpaDefinitionService } from '@/services/setup/payer/TpaDefinitionSetupService';
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
  [...new Set((ids ?? []).filter((id): id is number => Number.isFinite(Number(id))))].map(Number);

const listFromResponse = (response: any): any[] => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.data)) {
    return response.data;
  }
  if (Array.isArray(response?.content)) {
    return response.content;
  }
  return [];
};

const normalizeTpa = (tpa: any) => {
  const id = Number(tpa?.id ?? tpa?.tpaId ?? tpa?.value);
  if (!Number.isFinite(id)) {
    return null;
  }

  const tpaCode = String(tpa?.tpaCode ?? tpa?.code ?? '').trim();
  const name = String(tpa?.name ?? tpa?.tpaName ?? tpa?.label ?? '').trim();

  return {
    id,
    tpaCode,
    name,
    isActive: tpa?.isActive !== false,
    label: [tpaCode, name].filter(Boolean).join(' - ') || `TPA #${id}`
  };
};

const toTpaPickerOptions = (...groups: any[][]) => {
  const byId = new Map<number, ReturnType<typeof normalizeTpa>>();
  groups.flat().forEach(item => {
    const tpa = normalizeTpa(item);
    if (!tpa || byId.has(tpa.id)) {
      return;
    }
    byId.set(tpa.id, tpa);
  });

  return [...byId.values()].map(tpa => ({
    value: tpa!.id,
    label: tpa!.label,
    isActive: tpa!.isActive
  }));
};

const PayerLinkTpasModal: React.FC<PayerLinkTpasModalProps> = ({ open, setOpen, payer }) => {
  const dispatch = useAppDispatch();
  const [tpaIds, setTpaIds] = useState<number[]>([]);
  const [updateNphiesPayerTpas] = useUpdateNphiesPayerTpasMutation();

  const { data: payerDetails, isFetching: isPayerLoading } = useGetNphiesPayerByIdQuery(
    payer?.id as number,
    { skip: !open || !payer?.id }
  );

  const { data: availableTpas, isFetching: isTpasLoading } = useGetAvailableTpasForPayerQuery(
    payer?.id as number,
    { skip: !open || !payer?.id }
  );

  const currentPayer = payerDetails ?? payer;

  useEffect(() => {
    if (!open) {
      return;
    }
    setTpaIds(
      uniqueIds(currentPayer?.tpaIds ?? currentPayer?.tpas?.map(tpa => tpa.id))
    );
  }, [open, payer?.id, payerDetails]);

  const tpaOptions = useMemo(() => {
    const options = toTpaPickerOptions(listFromResponse(availableTpas), currentPayer?.tpas ?? []);
    const existing = new Set(options.map(option => option.value));
    tpaIds.forEach(id => {
      if (!existing.has(id)) {
        options.push({ value: id, label: `TPA #${id}`, isActive: true });
      }
    });
    return options;
  }, [availableTpas, currentPayer, tpaIds]);

  const handleSave = async () => {
    if (!payer?.id) {
      return;
    }

    const nextIds = uniqueIds(tpaIds);
    try {
      dispatch(showSystemLoader());
      await updateNphiesPayerTpas({ id: payer.id, tpaIds: nextIds }).unwrap();
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

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={
        currentPayer
          ? `Link TPAs - ${currentPayer.nameEn || currentPayer.nphiesId}`
          : 'Link TPAs'
      }
      size="42vw"
      bodyheight="38vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={!payer?.id || isPayerLoading}
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form fluid layout="vertical" className="nphies-payer-form">
          <p className="payer-link-tpas-hint">
            Select one or more TPAs. The same TPA cannot be linked twice to this company, and the
            same company cannot be linked twice to a TPA.
          </p>
          <MyInput
            width="100%"
            column
            fieldName="tpaIds"
            fieldType="checkPicker"
            fieldLabel="Linked TPAs"
            record={{ tpaIds }}
            setRecord={(updated: any) => {
              const next = typeof updated === 'function' ? updated({ tpaIds }) : updated;
              setTpaIds(uniqueIds(next?.tpaIds));
            }}
            selectData={tpaOptions}
            selectDataLabel="label"
            selectDataValue="value"
            loading={isTpasLoading || isPayerLoading}
            disableByField="isActive"
            searchable
            virtualized={false}
            menuMaxHeight={240}
            placeholder="Select one or more TPAs"
          />
        </Form>
      }
    />
  );
};

export default PayerLinkTpasModal;
