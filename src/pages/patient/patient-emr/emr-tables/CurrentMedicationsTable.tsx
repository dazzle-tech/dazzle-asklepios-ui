import React, { useMemo, useState, useEffect } from "react";
import MyTable from "@/components/MyTable";
import { initialListRequest, ListRequest } from "@/types/types";
import { formatDateWithoutSeconds, formatEnumString } from "@/utils";
import { useGetCustomeInstructionsQuery, useGetPrescriptionMedicationsQuery } from "@/services/encounterService";
import { useGetAllBrandMedicationsQuery } from "@/services/setup/brandmedication/BrandMedicationService ";
import { useGetAllPrescriptionInstructionsQuery } from "@/services/setup/prescription-instruction/prescriptionInstructionService";
import Translate from '@/components/Translate';


const CurrentMedicationsTable = ({ patient }) => {
  const [listRequest, setListRequest] = useState({
    ...initialListRequest,
      pageNumber: 1,
      pageSize: 15,
      sortBy: "createdAt",
      sortType: "desc",
    filters: [
      { fieldName: "patient_key", operator: "match", value: patient?.key },
    ]
  });

  const {
    data: prescriptionMedications,
    isLoading: isLoadingPrescriptionMedications,
    refetch: medicRefetch
  } = useGetPrescriptionMedicationsQuery(listRequest);

    const { data: genericMedicationListResponse } =
      useGetAllBrandMedicationsQuery({ page: 0, size: 1000, sort: 'id,asc' });
 
      const { data: predefinedInstructionsListResponse } = useGetAllPrescriptionInstructionsQuery({ page: 0, size: 1000, sort: 'id,asc' });
   
        const {
          data: customeInstructions,
          isLoading: isLoadingCustomeInstructions,
          refetch: refetchCo
        } = useGetCustomeInstructionsQuery({
          ...initialListRequest
        });

  
  const tableColumns = [
    {
      key: 'medicationName',
      dataKey: 'genericMedicationsId',
      title: <Translate> Medication Name</Translate>,
      flexGrow: 2,
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
        if (rowData.instructionsTypeLkey === '3010591042600262') {
          const generic = predefinedInstructionsListResponse?.data?.find(
            item => item.id === Number(rowData.instructions)
          );
       

          if (generic) {
          } else {
            console.warn('No matching generic found for key:', rowData.instructions);
          }
          return [
            generic?.dose ?? '',
            formatEnumString(generic?.unit) ?? '',
            formatEnumString(generic?.rout) ?? '',   // ✅ route
            formatEnumString(generic?.frequency) ?? '',
          ]
            .filter(v => v != null && String(v).trim() !== '')
            .join(', ');
        }
        if (rowData.instructionsTypeLkey === '3010573499898196') {
          return rowData.instructions;
        }
        if (rowData.instructionsTypeLkey === '3010606785535008') {
          return (
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.dose +
            ',' +
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.unitLvalue.lovDisplayVale +
            ',' +
            customeInstructions?.object?.find(
              item => item.prescriptionMedicationsKey === rowData.key
            )?.frequencyLvalue.lovDisplayVale
          );
        }

        return 'no';
      }
    },
    {
      key: 'instructionsType',
      dataKey: 'instructionsTypeLkey',
      title: 'Instructions Type',
      flexGrow: 2,
      render: (rowData: any) => {
        return rowData.instructionsTypeLvalue
          ? rowData.instructionsTypeLvalue.lovDisplayVale
          : rowData.instructionsTypeLkey;
      }
    },
    {
      key: 'validUtil',
      dataKey: 'validUtil',
      title: 'Valid Util',
      flexGrow: 2
    },
    {
      key: 'isChronic',
      dataKey: 'chronicMedication',
      title: 'Is Chronic',
      flexGrow: 2,
      render: (rowData: any) => {
        return rowData.chronicMedication ? 'Yes' : 'No';
      }
    },
    {
      key: 'status',
      dataKey: 'statusLkey',
      title: 'Status',
      flexGrow: 1,
      render: (rowData: any) => {
        return rowData.statusLvalue ? rowData.statusLvalue?.lovDisplayVale : rowData.statusLkey;
      }
    },
  ];

const handlePageChange = (_ , newPage) => {
  setListRequest(prev => ({
    ...prev,
    pageNumber: newPage + 1
  }));
};

const handleRowsPerPageChange = (e) => {
  setListRequest(prev => ({
    ...prev,
    pageSize: Number(e.target.value),
    pageNumber: 1
  }));
};

const handleSortChange = (sortBy, sortType) => {
  setListRequest(prev => ({
    ...prev,
    sortBy,
    sortType,
    pageNumber: 1
  }));
};



useEffect(() => {
  setListRequest(prev => ({
    ...prev!,
    filters: [
      { fieldName: "patient_key", operator: "match", value: patient?.key }
    ],
    pageNumber: 1,
  }));
}, [patient?.key]);

  return (
    <MyTable
      columns={tableColumns}
      data={prescriptionMedications?.object ?? []}
      loading={isLoadingPrescriptionMedications}
      page={(listRequest.pageNumber ?? 1) - 1}
      rowsPerPage={listRequest.pageSize}
      totalCount={prescriptionMedications?.extraNumeric ?? 0}
      onSortChange={handleSortChange}
      onPageChange={handlePageChange}
      onRowsPerPageChange={handleRowsPerPageChange}
    />
  );
};

export default CurrentMedicationsTable;
