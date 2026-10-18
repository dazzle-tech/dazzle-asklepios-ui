import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Checkbox, Form } from 'rsuite';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import {
  DiagnosticOrderTestStatus,
  DiagnosticStatus,
  TestType
} from '@/types/model-types-new';
import { useFilterDiagnosticOrdersQuery } from '@/services/diagnosic-order/diagnosticOrderService';
import {
  useFilterDiagnosticOrderTestsQuery
} from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetPatientPrescriptionQuery } from '@/services/patients/Prescription/patientPrescriptionService';
import { useLazyGetPatientPrescriptionMedicationsQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import {
  useFilterGroupedUccMedicationOrdersQuery
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useFindProcdureByEncounterQuery } from '@/services/patients/patientProcedureService';
import { useGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';
import { useGetBrandMedicationsByIdsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetProceduresByIdsQuery } from '@/services/setup/procedure/procedureService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';

export type OrderPickerSource =
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PRESCRIPTION'
  | 'UCC'
  | 'PROCEDURES';

export type OrderPickerItem = {
  key: string;
  source: OrderPickerSource;
  name: string;
  details?: string;
  meta?: string;
};

type FilterValue = 'ALL' | OrderPickerSource;

type OrdersPickerModalProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  patientId: number | null;
  encounterId: number | null;
  onAddSelected: (items: OrderPickerItem[]) => void;
};

const FILTER_OPTIONS: { label: string; value: FilterValue }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Laboratory', value: 'LABORATORY' },
  { label: 'Radiology', value: 'RADIOLOGY' },
  { label: 'Prescription', value: 'PRESCRIPTION' },
  { label: 'UCC Medication Orders', value: 'UCC' },
  { label: 'Procedures', value: 'PROCEDURES' }
];

const SOURCE_LABEL: Record<OrderPickerSource, string> = {
  LABORATORY: 'Laboratory',
  RADIOLOGY: 'Radiology',
  PRESCRIPTION: 'Prescription',
  UCC: 'UCC Medication Orders',
  PROCEDURES: 'Procedures'
};

const PAGE_SIZE = 1000;
const PRESCRIPTION_CANCELLED = 'CANCELLED';
const PROCEDURE_CANCELLED = 'CANCELLED';
const UCC_CANCELLED = 'CANCELLED';

const isLaboratoryType = (orderType?: string | null, testType?: string | null) => {
  const value = String(orderType ?? testType ?? '').toUpperCase();
  return value === 'LABORATORY' || value === TestType.LAB;
};

const isRadiologyType = (orderType?: string | null, testType?: string | null) => {
  const value = String(orderType ?? testType ?? '').toUpperCase();
  return value === 'RADIOLOGY' || value === TestType.RAD;
};

const cleanJoin = (vals: Array<string | number | null | undefined>, sep = ', ') =>
  vals
    .map(v => (v == null ? '' : String(v).trim()))
    .filter(v => v !== '' && v !== 'undefined' && v !== 'null')
    .join(sep);

const isDisplayableToken = (value: string) => /^[A-Za-z][A-Za-z0-9_]*$/.test(value);

const resolveMappedLabel = (
  map: Record<string, string>,
  key: string | number | null | undefined
): string | undefined => {
  if (key == null || key === '') return undefined;
  const fromMap = map[String(key)];
  if (fromMap != null && String(fromMap).trim() !== '') return String(fromMap).trim();
  const raw = String(key).trim();
  if (!raw) return undefined;
  if (isDisplayableToken(raw)) {
    const formatted = formatEnumString(raw);
    return formatted?.trim() ? formatted.trim() : undefined;
  }
  return undefined;
};

const formatDoseWithUnit = (
  dose: number | string | null | undefined,
  unitLabel: string | undefined
): string | undefined => {
  if (dose == null || dose === '') return unitLabel;
  const doseText = String(dose).trim();
  if (!doseText) return unitLabel;
  return unitLabel ? `${doseText} ${unitLabel}` : doseText;
};

const formatDurationWithUnit = (
  duration: number | string | null | undefined,
  unitLabel: string | undefined
): string | undefined => {
  if (duration == null || duration === '') return undefined;
  const durationText = String(duration).trim();
  if (!durationText) return undefined;
  return unitLabel ? `${durationText} ${unitLabel}` : durationText;
};

type LookupMaps = {
  unitMap: Record<string, string>;
  frequencyMap: Record<string, string>;
  durationTypeMap: Record<string, string>;
  roaMap: Record<string, string>;
  frequencyUnitMap: Record<string, string>;
};

const buildPrescriptionDetails = (m: any, maps: LookupMaps): string | undefined => {
  const unitLabel = resolveMappedLabel(maps.unitMap, m?.doesUnit);
  const frequencyLabel = resolveMappedLabel(maps.frequencyMap, m?.frequency);
  const routeLabel = resolveMappedLabel(maps.roaMap, m?.rout);
  const durationUnitLabel = resolveMappedLabel(maps.durationTypeMap, m?.durationType);
  const dosePart = formatDoseWithUnit(m?.dose, unitLabel);
  const durationPart = formatDurationWithUnit(m?.duration, durationUnitLabel);
  const details = cleanJoin([dosePart, frequencyLabel, durationPart, routeLabel]);
  return details || undefined;
};

const buildUccDetails = (o: any, maps: LookupMaps): string | undefined => {
  if (o?.instructionType === 'MANUAL_INSTRUCTIONS') {
    const manual = String(o?.instructionText ?? '').trim();
    return manual || undefined;
  }

  const unitLabel = resolveMappedLabel(maps.unitMap, o?.doseUnit);
  const routeLabel = resolveMappedLabel(maps.roaMap, o?.route);
  const frequencyUnitLabel = resolveMappedLabel(maps.frequencyUnitMap, o?.frequencyUnit);
  const dosePart = formatDoseWithUnit(o?.dose, unitLabel);

  let frequencyPart: string | undefined;
  if (o?.frequencyNumber != null && String(o.frequencyNumber).trim() !== '') {
    frequencyPart = frequencyUnitLabel
      ? `${String(o.frequencyNumber).trim()} ${frequencyUnitLabel}`
      : String(o.frequencyNumber).trim();
  }

  // PatientUccMedicationOrderGroup.duration is a number with no duration-unit field in the model.
  const durationPart =
    o?.duration != null && String(o.duration).trim() !== ''
      ? String(o.duration).trim()
      : undefined;

  const details = cleanJoin([dosePart, frequencyPart, durationPart, routeLabel]);
  if (details) return details;

  const fallbackText = String(o?.instructionText ?? '').trim();
  return fallbackText || undefined;
};

const OrdersPickerModal: React.FC<OrdersPickerModalProps> = ({
  open,
  setOpen,
  patientId,
  encounterId,
  onAddSelected
}) => {
  const [filter, setFilter] = useState<{ type: FilterValue }>({ type: 'ALL' });
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [prescriptionMeds, setPrescriptionMeds] = useState<any[]>([]);
  const [prescriptionMedsLoading, setPrescriptionMedsLoading] = useState(false);
  const [prescriptionMedsError, setPrescriptionMedsError] = useState(false);
  const medsLoadGenerationRef = useRef(0);

  const idsReady = patientId != null && encounterId != null;
  const queryEnabled = open && idsReady;

  useEffect(() => {
    if (open) {
      setSelectedKeys(new Set());
      setFilter({ type: 'ALL' });
    }
  }, [open, patientId, encounterId]);

  useEffect(() => {
    setPrescriptionMeds([]);
    setPrescriptionMedsLoading(false);
    setPrescriptionMedsError(false);
    setSelectedKeys(new Set());
    medsLoadGenerationRef.current += 1;
  }, [patientId, encounterId]);

  /* ===================== LOVs / enums for medication details ===================== */
  const {
    data: unitLov,
    isLoading: unitLovLoading,
    isFetching: unitLovFetching,
    isError: unitLovError
  } = useGetLovValuesByCodeQuery('UOM', { skip: !queryEnabled });

  const {
    data: frequencyLov,
    isLoading: frequencyLovLoading,
    isFetching: frequencyLovFetching,
    isError: frequencyLovError
  } = useGetLovValuesByCodeQuery('MED_FREQUENCY', { skip: !queryEnabled });

  const {
    data: durationTypeLov,
    isLoading: durationTypeLovLoading,
    isFetching: durationTypeLovFetching,
    isError: durationTypeLovError
  } = useGetLovValuesByCodeQuery('MED_DURATION', { skip: !queryEnabled });

  const roaOptions = useEnumOptions('RouteOfAdministration');
  const frequencyUnitOptions = useEnumOptions('FrequencyList');

  const unitMap = useMemo(() => {
    const map: Record<string, string> = {};
    const list = Array.isArray(unitLov) ? unitLov : unitLov?.object ?? [];
    list.forEach((item: any) => {
      if (item?.key != null && item?.lovDisplayVale != null) {
        map[String(item.key)] = String(item.lovDisplayVale);
      }
    });
    return map;
  }, [unitLov]);

  const frequencyMap = useMemo(() => {
    const map: Record<string, string> = {};
    const list = Array.isArray(frequencyLov) ? frequencyLov : frequencyLov?.object ?? [];
    list.forEach((item: any) => {
      if (item?.key != null && item?.lovDisplayVale != null) {
        map[String(item.key)] = String(item.lovDisplayVale);
      }
    });
    return map;
  }, [frequencyLov]);

  const durationTypeMap = useMemo(() => {
    const map: Record<string, string> = {};
    const list = Array.isArray(durationTypeLov) ? durationTypeLov : durationTypeLov?.object ?? [];
    list.forEach((item: any) => {
      if (item?.key != null && item?.lovDisplayVale != null) {
        map[String(item.key)] = String(item.lovDisplayVale);
      }
    });
    return map;
  }, [durationTypeLov]);

  const roaMap = useMemo(() => {
    const map: Record<string, string> = {};
    (roaOptions || []).forEach((item: any) => {
      map[String(item.value)] = item.label;
    });
    return map;
  }, [roaOptions]);

  const frequencyUnitMap = useMemo(() => {
    const map: Record<string, string> = {};
    (frequencyUnitOptions || []).forEach((item: any) => {
      map[String(item.value)] = item.label;
    });
    return map;
  }, [frequencyUnitOptions]);

  /* ===================== Diagnostic orders ===================== */
  const {
    currentData: diagnosticOrdersResponse,
    isLoading: diagnosticOrdersLoading,
    isFetching: diagnosticOrdersFetching,
    isError: diagnosticOrdersError
  } = useFilterDiagnosticOrdersQuery(
    queryEnabled && patientId != null && encounterId != null
      ? { patientId, encounterId, page: 0, size: PAGE_SIZE }
      : skipToken
  );

  const diagnosticOrders = useMemo(
    () => diagnosticOrdersResponse?.data ?? [],
    [diagnosticOrdersResponse?.data]
  );

  const orderById = useMemo(() => {
    const map = new Map<number, any>();
    diagnosticOrders.forEach((o: any) => {
      if (o?.id != null) map.set(Number(o.id), o);
    });
    return map;
  }, [diagnosticOrders]);

  const orderIds = useMemo(
    () => diagnosticOrders.map((o: any) => o.id).filter(Boolean),
    [diagnosticOrders]
  );

  const {
    currentData: diagnosticTestsResponse,
    isLoading: diagnosticTestsLoading,
    isFetching: diagnosticTestsFetching,
    isError: diagnosticTestsError
  } = useFilterDiagnosticOrderTestsQuery(
    queryEnabled && orderIds.length
      ? {
          orderIdIn: orderIds,
          page: 0,
          size: PAGE_SIZE,
          excludeStatus: [DiagnosticOrderTestStatus.CANCELLED]
        }
      : skipToken
  );

  const diagnosticOrderTests = useMemo(
    () => diagnosticTestsResponse?.data ?? [],
    [diagnosticTestsResponse?.data]
  );

  const diagnosticTestIds = useMemo(
    () =>
      Array.from(
        new Set(
          diagnosticOrderTests.map((t: any) => t.testId).filter((id: any) => id != null)
        )
      ),
    [diagnosticOrderTests]
  );

  const {
    currentData: diagnosticTestsByIds,
    isLoading: diagnosticNamesLoading,
    isFetching: diagnosticNamesFetching,
    isError: diagnosticNamesError
  } = useGetDiagnosticTestsByIdsQuery(
    queryEnabled && diagnosticTestIds.length ? { ids: diagnosticTestIds } : skipToken
  );

  const diagnosticTestsMap = useMemo(
    () => new Map((diagnosticTestsByIds ?? []).map((t: any) => [t.id, t])),
    [diagnosticTestsByIds]
  );

  /* ===================== Prescriptions ===================== */
  const {
    currentData: prescriptionsResponse,
    isLoading: prescriptionsLoading,
    isFetching: prescriptionsFetching,
    isError: prescriptionsError
  } = useGetPatientPrescriptionQuery(
    queryEnabled && patientId != null && encounterId != null
      ? {
          patientId,
          encounterId,
          includeCanceled: false,
          page: 0,
          size: PAGE_SIZE,
          sort: 'prescriptionNum,desc'
        }
      : skipToken
  );

  const prescriptions = useMemo(() => {
    const rows = prescriptionsResponse?.data ?? [];
    return rows.filter((p: any) => p?.status !== PRESCRIPTION_CANCELLED);
  }, [prescriptionsResponse?.data]);

  const [fetchPrescriptionMedications] = useLazyGetPatientPrescriptionMedicationsQuery();

  useEffect(() => {
    if (!queryEnabled) {
      setPrescriptionMeds([]);
      setPrescriptionMedsLoading(false);
      setPrescriptionMedsError(false);
      return;
    }

    const generation = ++medsLoadGenerationRef.current;
    let cancelled = false;

    const loadMeds = async () => {
      if (!prescriptions.length) {
        if (!cancelled && generation === medsLoadGenerationRef.current) {
          setPrescriptionMeds([]);
          setPrescriptionMedsLoading(false);
          setPrescriptionMedsError(false);
        }
        return;
      }

      if (generation === medsLoadGenerationRef.current) {
        setPrescriptionMedsLoading(true);
        setPrescriptionMedsError(false);
      }

      try {
        const batches = await Promise.all(
          prescriptions.map((rx: any) =>
            fetchPrescriptionMedications({
              prescriptionHeaderId: rx.id,
              page: 0,
              size: PAGE_SIZE,
              sort: 'id,asc'
            }).unwrap()
          )
        );

        if (cancelled || generation !== medsLoadGenerationRef.current) return;

        const all = batches.flatMap(batch => batch?.data ?? []);
        setPrescriptionMeds(
          all.filter((m: any) => String(m?.status ?? '').toUpperCase() !== PRESCRIPTION_CANCELLED)
        );
      } catch {
        if (!cancelled && generation === medsLoadGenerationRef.current) {
          setPrescriptionMeds([]);
          setPrescriptionMedsError(true);
        }
      } finally {
        if (!cancelled && generation === medsLoadGenerationRef.current) {
          setPrescriptionMedsLoading(false);
        }
      }
    };

    void loadMeds();
    return () => {
      cancelled = true;
    };
  }, [queryEnabled, prescriptions, fetchPrescriptionMedications, patientId, encounterId]);

  const prescriptionBrandIds = useMemo(
    () =>
      Array.from(
        new Set(
          prescriptionMeds
            .map((m: any) => m.medicationsId ?? m.genericMedicationsId)
            .filter((id: any) => id != null)
        )
      ),
    [prescriptionMeds]
  );

  const {
    currentData: brandMedicationsByIds,
    isLoading: brandNamesLoading,
    isFetching: brandNamesFetching,
    isError: brandNamesError
  } = useGetBrandMedicationsByIdsQuery(
    queryEnabled && prescriptionBrandIds.length ? { ids: prescriptionBrandIds } : skipToken
  );

  const brandMedicationMap = useMemo(
    () => new Map((brandMedicationsByIds ?? []).map((item: any) => [item.id, item])),
    [brandMedicationsByIds]
  );

  /* ===================== UCC medication orders (grouped — has duration/freq fields) ===================== */
  const {
    currentData: uccResponse,
    isLoading: uccLoading,
    isFetching: uccFetching,
    isError: uccError
  } = useFilterGroupedUccMedicationOrdersQuery(
    queryEnabled && patientId != null && encounterId != null
      ? {
          patientId,
          encounterId,
          statusNotIn: [UCC_CANCELLED],
          page: 0,
          size: PAGE_SIZE,
          sort: 'createdDate,desc'
        }
      : skipToken
  );

  const uccOrders = useMemo(() => {
    const rows = uccResponse?.data ?? [];
    return rows.filter((o: any) => o?.status !== UCC_CANCELLED);
  }, [uccResponse?.data]);

  const activeIngredientIds = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...prescriptionMeds.map((m: any) => m.activeIngredientId),
            ...uccOrders.map((o: any) => o.activeIngredientId)
          ].filter((id: any): id is number => id != null)
        )
      ),
    [prescriptionMeds, uccOrders]
  );

  const [
    getActiveIngredientsByIds,
    {
      data: activeIngredientsByIds,
      isLoading: ingredientsLoading,
      isError: ingredientsError
    }
  ] = useGetActiveIngredientsByIdsMutation();

  useEffect(() => {
    if (!queryEnabled || !activeIngredientIds.length) return;
    getActiveIngredientsByIds(activeIngredientIds);
  }, [queryEnabled, activeIngredientIds, getActiveIngredientsByIds]);

  const activeIngredientMap = useMemo(
    () => new Map((activeIngredientsByIds ?? []).map((item: any) => [item.id, item])),
    [activeIngredientsByIds]
  );

  /* ===================== Procedures ===================== */
  const {
    currentData: proceduresResponse,
    isLoading: proceduresLoading,
    isFetching: proceduresFetching,
    isError: proceduresError
  } = useFindProcdureByEncounterQuery(
    queryEnabled && encounterId != null
      ? {
          encounterId,
          page: 0,
          size: PAGE_SIZE,
          includeCancelled: false
        }
      : skipToken
  );

  const procedures = useMemo(() => {
    const rows = proceduresResponse?.data ?? [];
    return rows.filter((p: any) => p?.status !== PROCEDURE_CANCELLED);
  }, [proceduresResponse?.data]);

  const procedureIds = useMemo(
    () =>
      Array.from(
        new Set(
          procedures.map((p: any) => Number(p.procedureId)).filter((id: number) => !Number.isNaN(id))
        )
      ),
    [procedures]
  );

  const {
    currentData: proceduresByIds,
    isLoading: procedureNamesLoading,
    isFetching: procedureNamesFetching,
    isError: procedureNamesError
  } = useGetProceduresByIdsQuery(procedureIds, {
    skip: !queryEnabled || !procedureIds.length
  });

  const proceduresMap = useMemo(() => {
    const map = new Map<number, any>();
    (proceduresByIds ?? []).forEach((p: any) => {
      map.set(p.id, p);
    });
    return map;
  }, [proceduresByIds]);

  const lookupMaps: LookupMaps = useMemo(
    () => ({
      unitMap,
      frequencyMap,
      durationTypeMap,
      roaMap,
      frequencyUnitMap
    }),
    [unitMap, frequencyMap, durationTypeMap, roaMap, frequencyUnitMap]
  );

  /* ===================== Build picker items ===================== */
  const allItems = useMemo(() => {
    const items: OrderPickerItem[] = [];

    diagnosticOrderTests.forEach((ot: any) => {
      if (ot?.status === DiagnosticOrderTestStatus.CANCELLED) return;

      const parent = orderById.get(Number(ot.orderId));
      if (parent?.status === DiagnosticStatus.CANCELLED) return;

      const setupTest = diagnosticTestsMap.get(ot.testId);
      const orderType = ot.orderType ?? setupTest?.type;
      const name = setupTest?.testName ?? setupTest?.name ?? 'Unknown test';

      if (isLaboratoryType(orderType, setupTest?.type)) {
        if (parent?.labStatus === DiagnosticStatus.CANCELLED) return;
        items.push({
          key: `lab:${ot.id}`,
          source: 'LABORATORY',
          name: String(name),
          meta: ot.status ? String(ot.status) : undefined
        });
        return;
      }

      if (isRadiologyType(orderType, setupTest?.type)) {
        if (parent?.radStatus === DiagnosticStatus.CANCELLED) return;
        items.push({
          key: `rad:${ot.id}`,
          source: 'RADIOLOGY',
          name: String(name),
          meta: ot.status ? String(ot.status) : undefined
        });
      }
    });

    prescriptionMeds.forEach((m: any) => {
      const otherName = String(m?.otherMedicationName ?? '').trim();
      const brandId = m?.medicationsId ?? m?.genericMedicationsId;
      const brandName = brandId != null ? brandMedicationMap.get(brandId)?.name : undefined;
      const ingredientName =
        m?.activeIngredientId != null
          ? activeIngredientMap.get(m.activeIngredientId)?.name
          : undefined;
      const name = otherName || brandName || ingredientName || 'Unknown medication';

      items.push({
        key: `rx:${m.id}`,
        source: 'PRESCRIPTION',
        name: String(name),
        details: buildPrescriptionDetails(m, lookupMaps),
        meta: m.status ? String(m.status) : undefined
      });
    });

    uccOrders.forEach((o: any) => {
      if (o?.orderGroupId == null) return;
      const name =
        activeIngredientMap.get(o.activeIngredientId)?.name ?? 'Unknown medication';
      items.push({
        key: `ucc:${o.orderGroupId}`,
        source: 'UCC',
        name: String(name),
        details: buildUccDetails(o, lookupMaps),
        meta: o.status ? String(o.status) : undefined
      });
    });

    procedures.forEach((p: any) => {
      const proc = proceduresMap.get(Number(p.procedureId));
      items.push({
        key: `proc:${p.id}`,
        source: 'PROCEDURES',
        name: String(proc?.name ?? 'Unknown procedure'),
        meta: p.status ? String(p.status) : undefined
      });
    });

    return items;
  }, [
    diagnosticOrderTests,
    orderById,
    diagnosticTestsMap,
    prescriptionMeds,
    brandMedicationMap,
    activeIngredientMap,
    uccOrders,
    procedures,
    proceduresMap,
    lookupMaps
  ]);

  const filteredItems = useMemo(() => {
    if (filter.type === 'ALL') return allItems;
    return allItems.filter(item => item.source === filter.type);
  }, [allItems, filter.type]);

  const needsMedicationLookups =
    prescriptionMeds.length > 0 || uccOrders.length > 0;
  const needsDiagnosticLookups = diagnosticTestIds.length > 0;
  const needsProcedureLookups = procedureIds.length > 0;
  const needsBrandLookups = prescriptionBrandIds.length > 0;
  const needsIngredientLookups = activeIngredientIds.length > 0;

  const lookupsLoading =
    (needsMedicationLookups &&
      (unitLovLoading ||
        unitLovFetching ||
        frequencyLovLoading ||
        frequencyLovFetching ||
        durationTypeLovLoading ||
        durationTypeLovFetching)) ||
    (needsDiagnosticLookups && (diagnosticNamesLoading || diagnosticNamesFetching)) ||
    (needsBrandLookups && (brandNamesLoading || brandNamesFetching)) ||
    (needsIngredientLookups && ingredientsLoading) ||
    (needsProcedureLookups && (procedureNamesLoading || procedureNamesFetching));

  const lookupsError =
    (needsMedicationLookups && (unitLovError || frequencyLovError || durationTypeLovError)) ||
    (needsDiagnosticLookups && diagnosticNamesError) ||
    (needsBrandLookups && brandNamesError) ||
    (needsIngredientLookups && ingredientsError) ||
    (needsProcedureLookups && procedureNamesError);

  const isLoading =
    diagnosticOrdersLoading ||
    diagnosticOrdersFetching ||
    diagnosticTestsLoading ||
    diagnosticTestsFetching ||
    prescriptionsLoading ||
    prescriptionsFetching ||
    prescriptionMedsLoading ||
    uccLoading ||
    uccFetching ||
    proceduresLoading ||
    proceduresFetching ||
    lookupsLoading;

  const hasError =
    diagnosticOrdersError ||
    diagnosticTestsError ||
    prescriptionsError ||
    prescriptionMedsError ||
    uccError ||
    proceduresError ||
    lookupsError;

  const visibleKeys = filteredItems.map(item => item.key);
  const selectedVisibleCount = visibleKeys.filter(key => selectedKeys.has(key)).length;
  const isAllVisibleSelected =
    visibleKeys.length > 0 && visibleKeys.every(key => selectedKeys.has(key));
  const isSomeVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < visibleKeys.length;

  const toggleKey = (key: string) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleAllVisible = (checked: boolean) => {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (checked) {
        visibleKeys.forEach(key => next.add(key));
      } else {
        visibleKeys.forEach(key => next.delete(key));
      }
      return next;
    });
  };

  const selectedItems = useMemo(
    () => allItems.filter(item => selectedKeys.has(item.key)),
    [allItems, selectedKeys]
  );

  const canAddSelected =
    selectedItems.length > 0 && !isLoading && !hasError && !lookupsLoading && !lookupsError;

  const handleAddSelected = () => {
    if (!canAddSelected) return;
    onAddSelected(selectedItems);
    setSelectedKeys(new Set());
    setOpen(false);
  };

  const columns = [
    {
      key: 'check',
      title: (
        <Checkbox
          checked={isAllVisibleSelected}
          indeterminate={isSomeVisibleSelected}
          disabled={!filteredItems.length}
          onChange={(_, checked) => toggleAllVisible(Boolean(checked))}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      ),
      width: 60,
      align: 'center' as const,
      render: (row: OrderPickerItem) => (
        <Checkbox
          checked={selectedKeys.has(row.key)}
          onChange={() => toggleKey(row.key)}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        />
      )
    },
    {
      key: 'source',
      title: <Translate>Source</Translate>,
      width: 160,
      render: (row: OrderPickerItem) => SOURCE_LABEL[row.source]
    },
    {
      key: 'name',
      title: <Translate>Name</Translate>,
      width: 220,
      render: (row: OrderPickerItem) => row.name
    },
    {
      key: 'details',
      title: <Translate>Details</Translate>,
      width: 320,
      render: (row: OrderPickerItem) => row.details || '—'
    }
  ];

  let bodyContent: React.ReactNode;
  if (!idsReady) {
    bodyContent = (
      <div style={{ padding: 16 }}>
        <Translate>Patient and encounter are required to load orders.</Translate>
      </div>
    );
  } else if (isLoading) {
    bodyContent = (
      <div style={{ padding: 16 }}>
        <Translate>Loading orders…</Translate>
      </div>
    );
  } else if (hasError) {
    bodyContent = (
      <div style={{ padding: 16 }}>
        <Translate>Failed to load some orders. Please try again.</Translate>
      </div>
    );
  } else if (!filteredItems.length) {
    bodyContent = (
      <div style={{ padding: 16 }}>
        <Translate>No orders found for this encounter.</Translate>
      </div>
    );
  } else {
    bodyContent = (
      <MyTable columns={columns} data={filteredItems} loading={false} height={360} />
    );
  }

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title={<Translate>Orders</Translate>}
      size="70vw"
      bodyheight="60vh"
      actionButtonLabel="Add Selected"
      actionButtonFunction={handleAddSelected}
      isDisabledActionBtn={!canAddSelected}
      content={
        <div>
          <Form fluid>
            <MyInput
              fieldType="select"
              fieldName="type"
              fieldLabel="Filter"
              record={filter}
              setRecord={setFilter}
              selectData={FILTER_OPTIONS}
              selectDataLabel="label"
              selectDataValue="value"
              width="280px"
            />
          </Form>
          {bodyContent}
        </div>
      }
    />
  );
};

export default OrdersPickerModal;

export const formatSelectedOrdersForTreatmentPlan = (items: OrderPickerItem[]): string => {
  const groups: { source: OrderPickerSource; heading: string }[] = [
    { source: 'LABORATORY', heading: 'Laboratory' },
    { source: 'RADIOLOGY', heading: 'Radiology' },
    { source: 'PRESCRIPTION', heading: 'Prescription' },
    { source: 'UCC', heading: 'UCC Medication Orders' },
    { source: 'PROCEDURES', heading: 'Procedures' }
  ];

  const blocks: string[] = [];

  groups.forEach(({ source, heading }) => {
    const groupItems = items.filter(item => item.source === source);
    if (!groupItems.length) return;
    const lines = groupItems.map(item => {
      const details = String(item.details ?? '').trim();
      return details ? `- ${item.name} (${details})` : `- ${item.name}`;
    });
    blocks.push(`${heading}:\n${lines.join('\n')}`);
  });

  return blocks.join('\n\n');
};
