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
import {
  PatientSatisfactionSurveyV2ResponseVM,
  useGetPatientSatisfactionSurveyV2ResponsesQuery
} from '@/services/patient-satisfaction-survey-v2/patientSatisfactionSurveyV2Service';
import SatisfactionSurveyV2ResponseDetailsModal from './SatisfactionSurveyV2ResponseDetailsModal';
// Same page as the patient satisfaction survey responses, reading the satisfaction survey v2 tables
import '../patient-satisfaction-survey-responses/styles.less';

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

const PatientSatisfactionSurveyV2Responses: React.FC = () => {
  const dispatch = useAppDispatch();

  const [selectedResponse, setSelectedResponse] = useState<PatientSatisfactionSurveyV2ResponseVM | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortType, setSortType] = useState<SortType>('desc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'createdDate,desc'
  });

  const { data: responsesPage, isFetching } = useGetPatientSatisfactionSurveyV2ResponsesQuery(paginationParams);

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
    setPaginationParams(previous => ({ ...previous, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(event.target.value);
    setPaginationParams(previous => ({ ...previous, page: 0, size: newSize }));
  };

  const handleSortChange = (column: string, direction: SortType) => {
    if (column === 'actions') {
      return;
    }

    setSortColumn(column);
    setSortType(direction);
    setPaginationParams(previous => ({ ...previous, page: 0, sort: `${column},${direction}` }));
  };

  const handleViewDetails = (row: PatientSatisfactionSurveyV2ResponseVM) => {
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
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => (
        <MyBadgeStatus contant={formatEnumString(row.status)} color={getStatusColor(row.status)} />
      )
    },
    {
      key: 'overallScore',
      title: <Translate>Overall Score</Translate>,
      flexGrow: 2,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => row.overallScore ?? '-'
    },
    {
      key: 'overallPercentage',
      title: <Translate>Overall Percentage</Translate>,
      flexGrow: 2,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) =>
        row.overallPercentage != null ? `${row.overallPercentage}%` : '-'
    },
    {
      key: 'startedAt',
      title: <Translate>Started At</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => formatDateWithoutSeconds(row.startedAt ?? '')
    },
    {
      key: 'completedAt',
      title: <Translate>Completed At</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => formatDateWithoutSeconds(row.completedAt ?? '')
    },
    {
      key: 'createdDate',
      title: <Translate>Created Date</Translate>,
      flexGrow: 3,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => formatDateWithoutSeconds(row.createdDate ?? '')
    },
    {
      key: 'actions',
      title: '',
      width: 90,
      render: (row: PatientSatisfactionSurveyV2ResponseVM) => (
        <span onClick={event => event.stopPropagation()} onKeyDown={event => event.stopPropagation()}>
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

  const selectedRowClass = (row: PatientSatisfactionSurveyV2ResponseVM) =>
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

      <SatisfactionSurveyV2ResponseDetailsModal
        open={detailsModalOpen}
        setOpen={setDetailsModalOpen}
        response={selectedResponse}
      />
    </Panel>
  );
};

export default PatientSatisfactionSurveyV2Responses;
