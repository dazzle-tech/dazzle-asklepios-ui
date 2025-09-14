import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetGeneralAssessmentsQuery } from '@/services/encounterService';
import { Divider, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import FullViewTable from './FullViewTable';
import Section from '@/components/Section';
const GeneralAssessmentSummary = ({ patient, encounter }) => {
  const [open, setOpen] = useState(false);

  // Initialize list request with default filters
  const [generalAssessmentListRequest, setGeneralAssessmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'patient_key',
        operator: 'match',
        value: patient?.key
      },
      {
        fieldName: 'encounter_key',
        operator: 'match',
        value: encounter?.key
      }
    ]
  });

  // Fetch the list of General Assessment based on the provided request, and provide a refetch function
  const {
    data: generalAssessmentResponse,
    refetch,
    isLoading
  } = useGetGeneralAssessmentsQuery(generalAssessmentListRequest);

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setGeneralAssessmentListRequest({ ...generalAssessmentListRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setGeneralAssessmentListRequest({
      ...generalAssessmentListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };

  // Effects
  useEffect(() => {
    setGeneralAssessmentListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        ...(patient?.key && encounter?.key
          ? [
              {
                fieldName: 'patient_key',
                operator: 'match',
                value: patient?.key
              },
              {
                fieldName: 'encounter_key',
                operator: 'match',
                value: encounter?.key
              }
            ]
          : [])
      ]
    }));
  }, [patient?.key, encounter?.key]);

  // Pagination values
  const pageIndex = generalAssessmentListRequest.pageNumber - 1;
  const rowsPerPage = generalAssessmentListRequest.pageSize;
  const totalCount = generalAssessmentResponse?.extraNumeric ?? 0;

  // Table Column
  const columns = [
    {
      key: 'positionStatusLkey',
      title: 'Position Status',
      render: (rowData: any) =>
        rowData?.positionStatusLvalue
          ? rowData.positionStatusLvalue.lovDisplayVale
          : rowData.positionStatusLkey
    },
    {
      key: 'bodyMovementsLkey',
      title: 'Body Movements',
      render: (rowData: any) =>
        rowData?.bodyMovementsLvalue
          ? rowData.bodyMovementsLvalue.lovDisplayVale
          : rowData.bodyMovementsLkey
    },

    {
      key: 'levelOfConsciousnessLkey',
      title: 'Level of Consciousness',
      render: (rowData: any) =>
        rowData?.levelOfConsciousnessLvalue
          ? rowData.levelOfConsciousnessLvalue.lovDisplayVale
          : rowData.levelOfConsciousnessLkey
    }
  ];

  return (
    <Section
      title="General Assessment"
      content={
        <MyTable
          data={generalAssessmentResponse?.object ?? []}
          columns={columns}
          height={200}
          loading={isLoading}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={totalCount}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      }
      setOpen={setOpen}
      rightLink="Full view"
      openedContent={
         <FullViewTable
            open={open}
            setOpen={setOpen}
            list={generalAssessmentResponse?.object}
            isLoading={isLoading}
            pageIndex={pageIndex}
            rowsPerPage={rowsPerPage}
            totalCount={totalCount}
            handlePageChange={handlePageChange}
            handleRowsPerPageChange={handleRowsPerPageChange}
        />
      }
    />
  );
};
export default GeneralAssessmentSummary;
