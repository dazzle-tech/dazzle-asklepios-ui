
import React, { useEffect, useMemo, useState } from 'react';
import '../styles.less';
import MyTable from '@/components/MyTable';
import {
  useGetCustomeInstructionsQuery
} from '@/services/encounterService';
import FullViewTable from './FullViewTable';
import Section from '@/components/Section';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import { useGetAllChronicRawQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import Translate from '@/components/Translate';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetActiveIngredientsByIdsMutation } from '@/services/setup/activeIngredients/activeIngredientsService';

const PatientChronicMedication = ({ patient, title = null }) => {
  const [open, setOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const {
    data: chronicMedications,
    isLoading
  } = useGetAllChronicRawQuery(
    {
      patientId: patient?.id,
      ...paginationParams
    },
    {
      skip: !patient?.id
    }
  );
 const [
  getActiveIngredientsByIds,
  {
    data: activeIngredientsByIds,
    isLoading: isLoadingActiveIngredientsByIds,
  },
] = useGetActiveIngredientsByIdsMutation();

const activeIngredientIds = useMemo(() => {
  const medications = chronicMedications?.data ?? [];

  const ids = medications.map((item) => {
   
    return item.activeIngredientId;
  });


  const filtered = ids.filter((id): id is number => id != null);


  return filtered;
}, [chronicMedications]);


useEffect(() => {
  if (!activeIngredientIds.length) return;
  getActiveIngredientsByIds(activeIngredientIds);
}, [activeIngredientIds, getActiveIngredientsByIds]);

const activeIngredientsMap = useMemo(() => {
  return new Map(
    (activeIngredientsByIds ?? []).map((item) => [item.id, item])
  );
}, [activeIngredientsByIds]);

  const { data: genericMedicationListResponse, isLoading: isLoadingGenericMedication } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: predefinedInstructionsListResponse, isLoading: isLoadingPredefinedInstructions } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000
  });

  const { data: customeInstructions, isLoading: isLoadingCustomeInstructions } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });


  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const totalCount = chronicMedications?.totalCount ?? 0;
  const tableColumns = [
    {
        key: 'activeIngredientId',
      
        title: 'Active Ingredients',
        flexGrow: 1,
        render: (rowData: any) => {
         const ingredient = activeIngredientsMap.get(rowData.activeIngredientId)
          return ingredient?.name ? String(ingredient.name) : '-';
        }
  
    },
    {
      key: 'medicationName',
      dataKey: 'medicationsId',
      title: <Translate>Medication Name</Translate>,
      flexGrow: 2,
      render: (rowData: any) => {
        if (rowData?.otherMedicationName?.trim()) {
          return rowData.otherMedicationName.trim();
        }
        const medId =
          rowData?.medicationsId ??
          rowData?.genericMedicationsId;

        if (!medId) {
          return '-';
        }

        return (
          genericMedicationListResponse?.data?.find(
            (item: any) => String(item.id) === String(medId)
          )?.name ?? '-'
        );
      }
    },
    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const type = rowData?.instructionsType;

        if (rowData?.instructionsType === 'PRE_DEFINED_INSTRUCTIONS') {
          const inst = (predefinedInstructionsListResponse?.data ?? []).find(
            (x: any) => Number(x.id) === Number(rowData?.instructions)
          );
          if (!inst) return 'No predefined instructions';
          return [inst?.dose, formatEnumString(inst?.unit), formatEnumString(inst?.rout), formatEnumString(inst?.frequency)]
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(Boolean)
            .join(', ');
        }

        if (type === 'MANUAL_INSTRUCTIONS') {
          return rowData?.instructions || 'No instructions';
        }

        if (type === 'CUSTOM_INSTRUCTIONS') {
          // Try reading from medication object first (new API)
          if (rowData?.dose != null || rowData?.doesUnit || rowData?.frequency || rowData?.rout) {
            // Get LOV arrays - handle both object and direct array formats
            const unitLovArray = Array.isArray(unitLovQueryResponse) ? unitLovQueryResponse : (unitLovQueryResponse?.object ?? []);
            const freqLovArray = Array.isArray(frequencyLov) ? frequencyLov : (frequencyLov?.object ?? []);

            const unitDisplay = getLovDisplay(unitLovArray, rowData?.doesUnit) ||
              formatEnumString(rowData?.doesUnit) ||
              (rowData?.doesUnit ? String(rowData.doesUnit) : '');
            const freqDisplay = getLovDisplay(freqLovArray, rowData?.frequency) ||
              formatEnumString(rowData?.frequency) ||
              (rowData?.frequency ? String(rowData.frequency) : '');
            return [
              toStr(rowData?.dose),
              unitDisplay,
              formatEnumString(rowData?.rout),
              freqDisplay
            ]
              .map(s => s.trim())
              .filter(Boolean)
              .join(', ');
          }

          // Fallback to legacy custom instructions lookup
          const ci = customeInstructions.find(
            (x: any) => String(x.prescriptionMedicationsKey) === String(rowData?.id ?? rowData?.key)
          );

          return [
            toStr(ci?.dose),
            toStr(ci?.unitLvalue?.lovDisplayVale),
            formatEnumString(ci?.roaLkey),
            toStr(ci?.frequencyLvalue?.lovDisplayVale)
          ]
            .map(s => s.trim())
            .filter(Boolean)
            .join(', ');
        }

        return '-';
      }
    },
  ];

  const getLovDisplay = (list: any[] = [], key: any, labelKey = 'lovDisplayVale') => {
    if (!key && key !== 0) return '';
    const lovList = list ?? [];
    if (!lovList.length) return '';

    // Normalize key to string and number for comparison
    const keyStr = String(key);
    const keyNum = Number(key);

    // Try multiple matching strategies
    for (const item of lovList) {
      // Match by key (string or number) - most common case
      if (String(item?.key) === keyStr || Number(item?.key) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
      // Match by id (string or number)
      if (String(item?.id) === keyStr || Number(item?.id) === keyNum) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
      // Match by valueCode (for enum-based LOVs)
      if (item?.valueCode && String(item?.valueCode) === keyStr) {
        const display = item?.[labelKey] ?? item?.lovDisplayVale ?? item?.name ?? '';
        if (display) return String(display);
      }
    }

    // Fallback to original utility function
    const fallback = conjureValueBasedOnKeyFromList(lovList, key, labelKey);
    if (fallback && fallback !== key) return String(fallback);

    return '';
  };
  const toStr = (v: any) => (v === null || v === undefined ? '' : String(v));

  const handlePageChange = (event, newPage) => {
    setPaginationParams({ ...paginationParams, page: newPage });
  };

  const handleSortChange = (newSortColumn: string, newSortType: 'asc' | 'desc') => {
    setSortColumn(newSortColumn);
    setSortType(newSortType);

    const sortValue = `${newSortColumn},${newSortType}`;
    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
  };

  return (
    <Section
      isContainOnlyTable
      title={title ? title : <Translate>Patient Chronic Medication</Translate>}
      content={
        <MyTable
          columns={tableColumns}
          totalCount={totalCount}
          loading={isLoading || isLoadingCustomeInstructions || isLoadingGenericMedication || isLoadingPredefinedInstructions}
          data={chronicMedications?.data ?? []}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
          onPageChange={handlePageChange}
          onRowsPerPageChange={e => {
            const newSize = Number(e.target.value);
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
        />
      }
      setOpen={setOpen}
      rightLink="Full view"
      openedContent={
        <FullViewTable open={open} setOpen={setOpen}
          data={chronicMedications?.data ?? []}
          genericMedicationListResponse={genericMedicationListResponse}
          predefinedInstructionsListResponse={predefinedInstructionsListResponse}
          unitLovQueryResponse={unitLovQueryResponse}
          frequencyLov={frequencyLov}
          customeInstructions={customeInstructions}
          getLovDisplay={getLovDisplay}
          toStr={toStr}
          totalCount={totalCount}
          isLoading={isLoading}
          paginationParams={paginationParams}
          setPaginationParams={setPaginationParams}
          sortColumn={sortColumn}
          sortType={sortType}
          handlePageChange={handlePageChange}
          handleSortChange={handleSortChange}
          activeIngredientsMap={activeIngredientsMap}
        />
      }
    />
  );
};
export default PatientChronicMedication;