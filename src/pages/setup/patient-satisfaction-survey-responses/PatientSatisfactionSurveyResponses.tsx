import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { MdVisibility } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { useGetSubmittedPatientSatisfactionSurveysQuery } from '@/services/patient-satisfaction/patientSatisfactionSurveyService';
import type { PatientSatisfactionSurveyResponseVM } from '@/pages/patient-satisfaction-survey/types';
import SurveyResponseDetailsModal from './SurveyResponseDetailsModal';
import './styles.less';

type SortType = 'asc' | 'desc';

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'COMPLETED':
      return 'var(--primary-green)';
    case 'IN_PROGRESS':
      return 'var(--primary-orange)';
    case 'ABANDONED':
      return 'var(--primary-gray)';
    default:
      return 'var(--primary-gray)';
  }
};

const PatientSatisfactionSurveyResponses: React.FC = () => {
  const dispatch = useAppDispatch();

  const [selectedResponse, setSelectedResponse] =
    useState<PatientSatisfactionSurveyResponseVM | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortType, setSortType] = useState<SortType>('desc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'createdDate,desc',
    timestamp: Date.now()
  });

  const { data: responsesPage, isFetching } = useGetSubmittedPatientSatisfactionSurveysQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });

  const tableData = useMemo(() => responsesPage?.data ?? [], [responsesPage?.data]);
  const totalCount = responsesPage?.totalCount ?? 0;

  useEffect(() => {
    dispatch(setPageCode('PatientSatisfactionSurveyResponses'));
    dispatch(setDivContent('Patient Satisfaction Survey Responses'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(previous => ({
      ...previous,
      page: newPage,
      timestamp: Date.now()
    }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(event.target.value);

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      size: newSize,
      timestamp: Date.now()
    }));
  };

  const handleSortChange = (column: string, direction: SortType) => {
    if (column === 'actions') {
      return;
    }

    setSortColumn(column);
    setSortType(direction);

    setPaginationParams(previous => ({
      ...previous,
      page: 0,
      sort: `${column},${direction}`,
      timestamp: Date.now()
    }));
  };

  const handleViewDetails = (row: PatientSatisfactionSurveyResponseVM) => {
    setSelectedResponse(row);
    setDetailsModalOpen(true);
  };

  const tableColumns = [
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row: PatientSatisfactionSurveyResponseVM) => (
        <MyBadgeStatus
          contant={formatEnumString(row.status)}
          color={getStatusColor(row.status)}
        />
      )
    },
    {
      key: 'overallScore',
      title: <Translate>Overall Score</Translate>,
      width: 130,
      align: 'center' as const,
      render: (row: PatientSatisfactionSurveyResponseVM) => row.overallScore ?? '-'
    },
    {
      key: 'overallPercentage',
      title: <Translate>Overall %</Translate>,
      width: 120,
      align: 'center' as const,
      render: (row: PatientSatisfactionSurveyResponseVM) =>
        row.overallPercentage ?? '-'
    },
    {
      key: 'startedAt',
      title: <Translate>Started At</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyResponseVM) =>
        formatDateWithoutSeconds(row.startedAt)
    },
    {
      key: 'completedAt',
      title: <Translate>Completed At</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyResponseVM) =>
        formatDateWithoutSeconds(row.completedAt ?? '')
    },
    {
      key: 'createdDate',
      title: <Translate>Created Date</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyResponseVM) =>
        formatDateWithoutSeconds(row.createdDate)
    },
    {
      key: 'actions',
      title: '',
      width: 90,
      render: (row: PatientSatisfactionSurveyResponseVM) => (
        <span
          onClick={event => event.stopPropagation()}
          onKeyDown={event => event.stopPropagation()}
        >
          <MyButton
            appearance="subtle"
            size="sm"
            className="survey-response-view-btn"
            onClick={() => handleViewDetails(row)}
          >
            <MdVisibility size={18} />
          </MyButton>
        </span>
      )
    }
  ];

  const selectedRowClass = (row: PatientSatisfactionSurveyResponseVM) =>
    row?.id === selectedResponse?.id ? 'selected-row' : '';

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={selectedRowClass}
        onRowClick={row => setSelectedResponse(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
        height={650}
      />

      <SurveyResponseDetailsModal
        open={detailsModalOpen}
        setOpen={setDetailsModalOpen}
        response={selectedResponse}
      />
    </Panel>
  );
};

export default PatientSatisfactionSurveyResponses;
