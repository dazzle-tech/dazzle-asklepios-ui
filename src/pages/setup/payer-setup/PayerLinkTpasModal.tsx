import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { NphiesPayer } from '@/types/model-types-new';
import {
  useGetAllTpaDefinitionsQuery,
  TpaDefinitionService
} from '@/services/setup/payer/TpaDefinitionSetupService';
import {
  useGetNphiesPayerByIdQuery,
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
  [...new Set((ids ?? []).filter((id): id is number => id != null))];

const tpaListFromResponse = (response: any) =>
  Array.isArray(response) ? response : response?.data ?? [];

const toTpaPickerOptions = (list: any[], extra: any[] = []) => {
  const byId = new Map<number, any>();
  [...list, ...extra].forEach(tpa => {
    if (tpa?.id == null || byId.has(tpa.id)) {
      return;
    }
    byId.set(tpa.id, tpa);
  });

  return [...byId.values()].map(tpa => ({
    value: tpa.id,
    label: [tpa.tpaCode, tpa.name].filter(Boolean).join(' - ') || `TPA #${tpa.id}`,
    isActive: tpa.isActive !== false
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

  const { data: tpaResponse, isFetching: isTpasLoading } = useGetAllTpaDefinitionsQuery(
    { page: 0, size: 1000, sort: 'id,asc' },
    { skip: !open }
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
    const linkedIds = new Set(uniqueIds(currentPayer?.tpas?.map(tpa => tpa.id)));
    const allTpas = tpaListFromResponse(tpaResponse).filter(
      (tpa: any) => tpa?.isActive !== false || linkedIds.has(tpa?.id)
    );
    return toTpaPickerOptions(allTpas, currentPayer?.tpas ?? []);
  }, [tpaResponse, currentPayer]);

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
