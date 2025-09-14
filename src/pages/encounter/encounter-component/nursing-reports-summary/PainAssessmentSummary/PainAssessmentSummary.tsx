import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetPainAssessmentQuery } from '@/services/encounterService';
import { Divider, Text } from 'rsuite';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import FullViewTable from './FullViewTable';
import Section from '@/components/Section';
const PainAssessmentSummary = ({ patient, encounter }) => {
  const [open, setOpen] = useState(false);

  // Initialize list request with default filters
  const [painAssessmentListRequest, setPainAssessmentListRequest] = useState<ListRequest>({
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

  // Fetch the list of Pain Assessment based on the provided request, and provide a refetch function
  const {
    data: painAssessmentResponse,
    refetch,
    isLoading
  } = useGetPainAssessmentQuery(painAssessmentListRequest);

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setPainAssessmentListRequest({ ...painAssessmentListRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPainAssessmentListRequest({
      ...painAssessmentListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };

  // Effects
  useEffect(() => {
    setPainAssessmentListRequest(prev => ({
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
  const pageIndex = painAssessmentListRequest.pageNumber - 1;
  const rowsPerPage = painAssessmentListRequest.pageSize;
  const totalCount = painAssessmentResponse?.extraNumeric ?? 0;

  // Table Column
  const columns = [
    {
      key: 'assessmentDateTime',
      title: 'Assessment Date Time',
      render: (row: any) =>
        row?.createdAt ? (
          <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
        ) : (
          ' '
        )
    },
    {
      key: 'painDegreeLkey',
      title: 'Pain Degree',
      render: (rowData: any) =>
        rowData?.painDegreeLvalue ? rowData.painDegreeLvalue.lovDisplayVale : rowData.painDegreeLkey
    },
    {
      key: 'painLocationLkey',
      title: 'Pain Location',
      render: (rowData: any) =>
        rowData?.painLocationLvalue
          ? rowData.painLocationLvalue.lovDisplayVale
          : rowData.painLocationLkey
    },
    {
      key: 'painPatternLkey',
      title: 'Pain Pattern',
      render: (rowData: any) =>
        rowData?.painPatternLvalue
          ? rowData.painPatternLvalue.lovDisplayVale
          : rowData.painPatternLkey
    }
  ];

  return (
    <Section
      title="Pain Assessment"
      content={
        <MyTable
          data={painAssessmentResponse?.object ?? []}
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
      rightLink="Full view"
      setOpen={setOpen}
      openedContent={
        <FullViewTable
          open={open}
          setOpen={setOpen}
          list={painAssessmentResponse?.object}
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
export default PainAssessmentSummary;
