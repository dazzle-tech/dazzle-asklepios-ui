import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';

import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';

import { NphiesPayer } from '@/types/model-types-new';

import {
  TpaDefinitionService,
  useGetAllTpaDefinitionsQuery
} from '@/services/setup/payer/TpaDefinitionSetupService';

import {
  useGetNphiesPayerByIdQuery,
  useGetAvailableTpasForPayerQuery,
  useUpdateNphiesPayerTpasMutation,
  NphiesPayerService
} from '@/services/setup/payer/NphiesPayerSetupService';

import { useAppDispatch } from '@/hooks';

import {
  hideSystemLoader,
  notify,
  showSystemLoader
} from '@/utils/uiReducerActions';

import './styles.less';

type PayerLinkTpasModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  payer: NphiesPayer | null;
};

type TpaPickerOption = {
  value: number;
  label: string;
  isActive: boolean;
};

/**
 * Converts any possible ID value to a valid number.
 *
 * Supports:
 * 1000
 * "1000"
 * { id: 1000 }
 * { tpaId: 1000 }
 * { value: 1000 }
 */
const extractTpaId = (value: any): number | null => {
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
    const possibleId =
      value.id ??
      value.tpaId ??
      value.value ??
      value.tpaDefinitionId;

    if (possibleId === null || possibleId === undefined) {
      return null;
    }

    const parsed = Number(possibleId);

    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

/**
 * Converts any mixture of:
 *
 * [1, 2]
 * [{ id: 1 }, { id: 2 }]
 * [[1, 2], [{ id: 3 }]]
 *
 * into:
 *
 * [1, 2, 3]
 */
const normalizeTpaIds = (...sources: any[]): number[] => {
  const result = new Set<number>();

  const processValue = (value: any) => {
    if (value === null || value === undefined) {
      return;
    }

    /*
     * Array
     */
    if (Array.isArray(value)) {
      value.forEach(processValue);
      return;
    }

    /*
     * Set
     *
     * Important:
     * this prevents [object Set] from ever reaching the picker.
     */
    if (value instanceof Set) {
      Array.from(value).forEach(processValue);
      return;
    }

    const id = extractTpaId(value);

    if (id !== null) {
      result.add(id);
    }
  };

  sources.forEach(processValue);

  return Array.from(result);
};

/**
 * Some APIs return:
 *
 * [...]
 *
 * while others return:
 *
 * { data: [...] }
 * { content: [...] }
 * { items: [...] }
 *
 * This normalizes all of them.
 */
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

  if (Array.isArray(response.results)) {
    return response.results;
  }

  return [];
};

/**
 * Builds a clean display label for the TPA.
 *
 * Example API response:
 *
 * {
 *   id: 1000,
 *   tpaCode: "TPA_1",
 *   name: "BM DIT"
 * }
 *
 * Result:
 *
 * TPA_1 - BM DIT
 */
const getTpaLabel = (tpa: any, id: number): string => {
  if (!tpa) {
    return `TPA #${id}`;
  }

  const code =
    tpa.tpaCode ??
    tpa.code ??
    tpa.tpaCodeValue ??
    '';

  const name =
    tpa.name ??
    tpa.nameEn ??
    tpa.nameEnglish ??
    tpa.description ??
    '';

  const cleanCode =
    typeof code === 'string'
      ? code.trim()
      : '';

  const cleanName =
    typeof name === 'string'
      ? name.trim()
      : '';

  if (cleanCode && cleanName) {
    return `${cleanCode} - ${cleanName}`;
  }

  if (cleanName) {
    return cleanName;
  }

  if (cleanCode) {
    return cleanCode;
  }

  return `TPA #${id}`;
};

const PayerLinkTpasModal: React.FC<PayerLinkTpasModalProps> = ({
  open,
  setOpen,
  payer
}) => {
  const dispatch = useAppDispatch();

  const [tpaIds, setTpaIds] = useState<number[]>([]);

  const [
    updateNphiesPayerTpas,
    { isLoading: isSaving }
  ] = useUpdateNphiesPayerTpasMutation();

  /*
   * Load full payer data.
   */
  const {
    data: payerDetails,
    isFetching: isPayerLoading
  } = useGetNphiesPayerByIdQuery(
    payer?.id as number,
    {
      skip: !open || !payer?.id
    }
  );

  /*
   * TPAs that can still be linked to this payer.
   */
  const {
    data: availableTpasResponse,
    isFetching: isTpasLoading
  } = useGetAvailableTpasForPayerQuery(
    payer?.id as number,
    {
      skip: !open || !payer?.id
    }
  );

  /*
   * Full TPA catalog.
   *
   * Used as fallback so selected TPAs can still have
   * their correct label even when they are not returned
   * by the "available TPAs" endpoint anymore.
   */
  const {
    data: tpaDefinitionsResponse,
    isFetching: isDefinitionsLoading
  } = useGetAllTpaDefinitionsQuery(
    {
      page: 0,
      size: 1000,
      sort: 'id,asc'
    },
    {
      skip: !open
    }
  );

  const currentPayer = payerDetails ?? payer;

  /*
   * Normalize API responses.
   */
  const availableTpas = useMemo(
    () => extractArray(availableTpasResponse),
    [availableTpasResponse]
  );

  const tpaDefinitions = useMemo(
    () => extractArray(tpaDefinitionsResponse),
    [tpaDefinitionsResponse]
  );

  /*
   * Every time popup opens / payer changes,
   * load already-linked TPA IDs.
   *
   * IMPORTANT:
   *
   * Wrong:
   *
   * uniqueTpaIds([
   *   currentPayer?.tpaIds,
   *   currentPayer?.tpas
   * ])
   *
   * Correct:
   *
   * normalize both sources individually.
   */
  useEffect(() => {
    if (!open) {
      setTpaIds([]);
      return;
    }

    if (!currentPayer) {
      setTpaIds([]);
      return;
    }

    const linkedIds = normalizeTpaIds(
      currentPayer.tpaIds,
      currentPayer.tpas
    );

    setTpaIds(linkedIds);
  }, [
    open,
    payer?.id,
    payerDetails,
    currentPayer
  ]);

  /*
   * Build picker options.
   *
   * We combine:
   *
   * 1. Available TPAs
   * 2. Full TPA definitions/catalog
   * 3. Already linked TPAs
   *
   * Then deduplicate by ID.
   */
  const tpaOptions = useMemo<TpaPickerOption[]>(() => {
    const optionMap = new Map<number, TpaPickerOption>();

    /*
     * Catalog first.
     */
    tpaDefinitions.forEach((tpa: any) => {
      const id = extractTpaId(tpa);

      if (id === null) {
        return;
      }

      optionMap.set(id, {
        value: id,
        label: getTpaLabel(tpa, id),
        isActive: tpa?.isActive !== false
      });
    });

    /*
     * Available TPAs override catalog values if needed.
     */
    availableTpas.forEach((tpa: any) => {
      const id = extractTpaId(tpa);

      if (id === null) {
        return;
      }

      optionMap.set(id, {
        value: id,
        label: getTpaLabel(tpa, id),
        isActive: tpa?.isActive !== false
      });
    });

    /*
     * Already linked TPA objects.
     */
    const linkedTpas = extractArray(currentPayer?.tpas);

    linkedTpas.forEach((tpa: any) => {
      const id = extractTpaId(tpa);

      if (id === null) {
        return;
      }

      optionMap.set(id, {
        value: id,
        label: getTpaLabel(tpa, id),
        isActive: tpa?.isActive !== false
      });
    });

    /*
     * Guarantee every currently selected ID exists as an option.
     *
     * This is useful if the selected TPA is no longer returned
     * from the available endpoint.
     */
    tpaIds.forEach(id => {
      if (!optionMap.has(id)) {
        optionMap.set(id, {
          value: id,
          label: `TPA #${id}`,
          isActive: true
        });
      }
    });

    return Array.from(optionMap.values()).sort((a, b) =>
      a.label.localeCompare(b.label)
    );
  }, [
    availableTpas,
    tpaDefinitions,
    currentPayer,
    tpaIds
  ]);

  const handleTpaChange = (updated: any) => {
    let nextValue: any;

    /*
     * MyInput sometimes sends a React state updater
     * and sometimes sends the actual object.
     */
    if (typeof updated === 'function') {
      const currentRecord = {
        tpaIds
      };

      const updatedRecord = updated(currentRecord);

      nextValue = updatedRecord?.tpaIds;
    } else {
      nextValue = updated?.tpaIds;
    }

    const normalizedIds = normalizeTpaIds(nextValue);

    setTpaIds(normalizedIds);
  };

  const handleSave = async () => {
    if (!payer?.id) {
      return;
    }

    const nextIds = normalizeTpaIds(tpaIds);

    try {
      dispatch(showSystemLoader());

      await updateNphiesPayerTpas({
        id: payer.id,
        tpaIds: nextIds
      }).unwrap();

      /*
       * Refresh both screens after save.
       */
      dispatch(
        TpaDefinitionService.util.invalidateTags([
          'TpaDefinition'
        ])
      );

      dispatch(
        NphiesPayerService.util.invalidateTags([
          'NphiesPayer'
        ])
      );

      dispatch(
        notify({
          msg: 'TPAs linked successfully',
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
        'Failed to link TPAs';

      serverMessage = String(serverMessage).replace(
        /^error\./i,
        ''
      );

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
    setTpaIds([]);
    setOpen(false);
  };

  const isLoading =
    isTpasLoading ||
    isPayerLoading ||
    isDefinitionsLoading;

  return (
    <MyModal
      open={open}
      setOpen={handleClose}
      title={
        currentPayer
          ? `Link TPAs - ${
              currentPayer.nameEn ||
              currentPayer.nphiesId ||
              ''
            }`
          : 'Link TPAs'
      }
      size="42vw"
      bodyheight="38vh"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      isDisabledActionBtn={
        !payer?.id ||
        isPayerLoading ||
        isSaving
      }
      modalColor="var(--primary-blue)"
      steps={[]}
      content={
        <Form
          fluid
          layout="vertical"
          className="nphies-payer-form"
        >
          <p className="payer-link-tpas-hint">
            Select one or more TPAs. The same TPA cannot
            be linked twice to this company, and the same
            company cannot be linked twice to a TPA.
          </p>

          <MyInput
            width="100%"
            column
            fieldName="tpaIds"
            fieldType="checkPicker"
            fieldLabel="Linked TPAs"
            record={{
              tpaIds
            }}
            setRecord={handleTpaChange}
            selectData={tpaOptions}
            selectDataLabel="label"
            selectDataValue="value"
            loading={isLoading}
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