import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetPatientPrescriptionMedicationsQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { conjureValueBasedOnKeyFromList, formatEnumString } from '@/utils';
import React, {  useState } from 'react';

const PrescriptionDetails = ({ prescription }) => {
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });

  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const { data: genericMedicationListResponse } = useGetAllBrandMedicationsQuery({
    page: 0,
    size: 1000,
    sort: 'id,asc'
  });

  const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({
    page: 0,
    size: 1000
  });

  const {
    data: prescriptionMedicationsResponse,
    isLoading: isLoadingPrescriptionMedications,
  } = useGetPatientPrescriptionMedicationsQuery(
    prescription?.id
      ? {
        prescriptionHeaderId: prescription.id,
        ...paginationParams
      }
      : (undefined as any),
    { skip: !prescription?.id }
  );
  const { data: customeInstructions, refetch: refetchCo } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });

  const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery('UOM');
  const { data: unitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const totalCount = prescriptionMedicationsResponse?.totalCount ?? 0;

  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };

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

  const tableColumns = [
    {
      key: 'medicationsId',
      dataKey: 'medicationsId',
      title: <Translate>Medication Name</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        const medId = rowData.medicationsId ?? rowData.genericMedicationsId;
        return genericMedicationListResponse?.data?.find(
          (item: any) => String(item.id) === String(medId)
        )?.name;
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
          // return rowData?.instructions ? String(rowData.instructions).trim() : '-';
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
    {
      key: 'instructionsType',
      title: <Translate>Instructions Type</Translate>,
      flexGrow: 1,
      render: (rowData: any) => (
        <span>{formatEnumString(rowData.instructionsType)}</span>
      ),
    },
    {
      key: 'validUtil',
      dataKey: 'validUtil',
      title: <Translate>Valid util</Translate>,
      flexGrow: 1
    },
    {
      key: 'notes',
      dataKey: 'notes',
      title: <Translate>Note</Translate>,
      flexGrow: 1
    },
    {
      key: 'parametersToMonitor',
      dataKey: 'parametersToMonitor',
      title: <Translate>Lab Monitoring Parameters</Translate>,
      flexGrow: 1
    },
    {
      key: 'indicationUse',
      title: <Translate>Indicated Use</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData?.indicationUse ? formatEnumString(rowData.indicationUse) : '-';
      }
    },
    {
      key: 'indication',
      title: <Translate>Indication</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually]);
      }
    },
    {
      key: 'chronicMedication',
      dataKey: 'chronicMedication',
      title: <Translate>Is Chronic</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.chronicMedication ? 'Yes' : 'NO';
      }
    }
  ];

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
    <>
      <MyTable
        columns={tableColumns}
        totalCount={totalCount}
        loading={isLoadingPrescriptionMedications}
        data={prescriptionMedicationsResponse?.data ?? []}
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
    </>
  );
};

export default PrescriptionDetails;
