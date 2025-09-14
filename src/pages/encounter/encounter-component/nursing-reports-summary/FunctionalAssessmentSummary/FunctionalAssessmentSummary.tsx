import React, { useEffect, useState } from 'react';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetFunctionalAssessmentsQuery } from '@/services/encounterService';
import Translate from '@/components/Translate';
import { newApFunctionalAssessment } from '@/types/model-types-constructor';
import { ApFunctionalAssessment } from '@/types/model-types';
import MyTable from '@/components/MyTable';
import { formatDateWithoutSeconds } from '@/utils';
import { FaEye } from 'react-icons/fa';
import { Divider, Text } from 'rsuite';
import ViewFunctionalAssessment from '../../functional-assessment/ViewFunctionalAssessment';
import Section from '@/components/Section';

const FunctionalAssessmentSummary = ({ patient, encounter }) => {
  const [open, setOpen] = useState(false);
  const [functionalAssessment, setFunctionalAssessment] = useState<ApFunctionalAssessment>({
    ...newApFunctionalAssessment
  });

  // Initialize list request with default filters
  const [functionalAssessmentListRequest, setFunctionalAssessmentListRequest] =
    useState<ListRequest>({
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

  // Fetch the list of Functional Assessment based on the provided request, and provide a refetch function
  const {
    data: functionalAssessmentResponse,
    refetch,
    isLoading
  } = useGetFunctionalAssessmentsQuery(functionalAssessmentListRequest);

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setFunctionalAssessmentListRequest({
      ...functionalAssessmentListRequest,
      pageNumber: newPage + 1
    });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFunctionalAssessmentListRequest({
      ...functionalAssessmentListRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };

  // Effects
  useEffect(() => {
    setFunctionalAssessmentListRequest(prev => ({
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
  const pageIndex = functionalAssessmentListRequest.pageNumber - 1;
  const rowsPerPage = functionalAssessmentListRequest.pageSize;
  const totalCount = functionalAssessmentResponse?.extraNumeric ?? 0;

  // Table Column
  const columns = [
    {
      key: 'createdAt',
      title: 'CREATED AT/BY',
      render: (row: any) =>
        row?.createdAt ? (
          <>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.createdAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'deletedAt',
      title: 'CANCELLED AT/BY',
      render: (row: any) =>
        row?.deletedAt ? (
          <>
            <br />
            <span className="date-table-style">{formatDateWithoutSeconds(row.deletedAt)}</span>
          </>
        ) : (
          ' '
        )
    },
    {
      key: 'cancellationReason',
      title: 'CANCELLATION REASON',
      dataKey: 'cancellationReason'
    },
    {
      key: 'details',
      title: <Translate>VIEW</Translate>,
      flexGrow: 2,
      render: (rowData: any) => (
        <FaEye
          title="View"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setOpen(true);
            setFunctionalAssessment(rowData);
          }}
        />
      )
    }
  ];

  return (
    <Section
      isContainOnlyTable
      title="Functional Assessment"
      content={
        <MyTable
          data={functionalAssessmentResponse?.object ?? []}
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
      rightLink=""
      setOpen={setOpen}
      openedContent={
        <ViewFunctionalAssessment
          open={open}
          setOpen={setOpen}
          functionalAssessmentObj={functionalAssessment}
        />
      }
    />
  );
};
export default FunctionalAssessmentSummary;
