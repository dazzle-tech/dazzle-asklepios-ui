import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useGetCustomeInstructionsQuery } from '@/services/encounterService';
import { useGetPatientPrescriptionMedicationsQuery } from '@/services/patients/Prescription/patientPrescriptionMedicationService';
import { useGetAllBrandMedicationsQuery } from '@/services/setup/brandmedication/BrandMedicationService ';
import { useGetAllPrescriptionInstructionsQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { conjureValueBasedOnKeyFromListOfValues, formatEnumString } from '@/utils';
import React, { useMemo, useState } from 'react';

const PrescriptionDetails = ({ customeInstructions, prescription }) => {
  console.log("customeInstructions: ", customeInstructions);
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

  console.log("prescriptionMedicationsResponse: ", prescriptionMedicationsResponse);
  const totalCount = prescriptionMedicationsResponse?.totalCount ?? 0;

  const { data: customInstructionsResponse } = useGetCustomeInstructionsQuery({
    ...({} as any)
  });

  const effectiveCustomInstructions =
    customeInstructions ?? customInstructionsResponse?.object ?? [];


  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };



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

        // if (type === 'CUSTOM_INSTRUCTIONS') {
        //   const dose = rowData?.dose;

        //   const unit = conjureValueBasedOnKeyFromListOfValues(
        //     genderLovQueryResponse.object,
        //     rowData?.doesUnit,
        //     'lovDisplayVale'
        //   );

        //   const frequency = conjureValueBasedOnKeyFromListOfValues(
        //     genderLovQueryResponse.object,
        //     rowData?.frequency,
        //     'lovDisplayVale'
        //   );

        //   const roa = conjureValueBasedOnKeyFromListOfValues(
        //     genderLovQueryResponse.object,
        //     rowData?.rout,
        //     'lovDisplayVale'
        //   );

        //   return txt || '-';
        // }

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
