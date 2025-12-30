import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetPrescriptionMedicationsQuery } from '@/services/encounterService';
import { useGetPrescriptionInstructionQuery } from '@/services/medicationsSetupService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { initialListRequest } from '@/types/types';
import { formatEnumString } from '@/utils';
import React from 'react';
import { FlexboxGrid } from 'rsuite';
const PrescriptionDetails = ({ customeInstructions, prescription }) => {

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
    data: prescriptionMedications,
    isLoading: isLoadingPrescriptionMedications,
    refetch: medicRefetch
  } = useGetPrescriptionMedicationsQuery(
    {
      ...initialListRequest,

      filters: [
        {
          fieldName: 'prescription_key',
          operator: '',
          value: prescription.key
        },
        {
          fieldName: 'status_lkey',
          operator: 'match',
          value: '1804482322306061'
        }
      ]
    },
    { skip: prescription.key === null }
  );
  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };


  const tableColumns = [
    {
      key: 'genericMedicationsKey',
      dataKey: 'genericMedicationsId',
      title: <Translate>Medication Name</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return genericMedicationListResponse?.data?.find(
          item => item.id === rowData.genericMedicationsId
        )?.name;
      }
    },
    {
      key: 'instructions',
      dataKey: '',
      title: 'Instructions',
      flexGrow: 3,
      render: (rowData: any) => {
        const type = String(rowData?.instructionsTypeLkey ?? '');

        // Pre-defined
        // Pre-defined 
        if (type === '3010591042600262') { const inst = (predefinedInstructionsListResponse?.data ?? []).find((x: any) => Number(x.id) === Number(rowData?.instructions)); if (!inst) return '-'; return [inst?.dose, formatEnumString(inst?.unit), formatEnumString(inst?.rout), formatEnumString(inst?.frequency)].map(v => (v == null ? '' : String(v).trim())).filter(Boolean).join(', '); }
        // ✅ Manual (free text)
        if (type === '3010573499898196') {
          return rowData?.instructions ? String(rowData.instructions).trim() : '-';
        }

        // ✅ Custom
        if (type === '3010606785535008') {
          const rowMedKey = String(
            rowData?.prescriptionMedicationsKey ??
            rowData?.prescriptionMedicationKey ??
            rowData?.prescriptionMedicationId ??
            rowData?.id ??
            rowData?.key
          );

          const matches = (customeInstructions ?? []).filter(
            (x: any) => String(x?.prescriptionMedicationsKey) === rowMedKey
          );

          const pickBest = (arr: any[]) => {
            const score = (ci: any) => {
              let s = 0;
              if (ci?.dose != null && String(ci?.dose).trim() !== '') s += 2;
              if (ci?.unitLvalue?.lovDisplayVale) s += 2;
              if (ci?.frequencyLvalue?.lovDisplayVale) s += 2;
              if (ci?.roaLvalue?.lovDisplayVale) s += 1;
              const t = Number(ci?.updatedAt ?? ci?.createdAt ?? 0);
              return s * 1_000_000_000_000 + t;
            };
            return arr.reduce((best, cur) => (!best || score(cur) > score(best) ? cur : best), null);
          };

          const ci = pickBest(matches);

          const txt = [ci?.dose, ci?.unitLvalue?.lovDisplayVale, ci?.frequencyLvalue?.lovDisplayVale]
            .map(v => (v == null ? '' : String(v).trim()))
            .filter(Boolean)
            .join(', ');

          return txt || '-';
        }



        return '-';
      }
    }
    ,
    {
      key: '',
      title: <Translate>Instructions Type</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.instructionsTypeLkey
          ? rowData.instructionsTypeLvalue.lovDisplayVale
          : rowData.instructionsTypeLkey;
      }
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
      key: '',
      title: <Translate>Indicated Use</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.indicationUseLkey
          ? rowData.indicationUseLvalue.lovDisplayVale
          : rowData.indicationUseLkey;
      }
    },
    {
      key: '',
      title: <Translate>Indication</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return joinValuesFromArray([rowData.indicationIcd, rowData.indicationManually]);
      }
    },
    {
      key: 'chronicMedication',
      dataKEy: 'chronicMedication',
      title: <Translate>Is Chronic</Translate>,
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.chronicMedication ? 'Yes' : 'NO';
      }
    }
  ];
  return (
    <>
      <MyTable
        columns={tableColumns}
        loading={isLoadingPrescriptionMedications}
        data={prescriptionMedications?.object ?? []}
      />
    </>
  );
};
export default PrescriptionDetails;