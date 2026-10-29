import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { MdVisibility } from 'react-icons/md';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatDateWithoutSeconds } from '@/utils';
import { SurveyResponse, useGetSurveyResponsesQuery } from '@/services/survey/surveyService';
import SurveyResponseDetailsModal from './SurveyResponseDetailsModal';
// Same page as the patient satisfaction survey responses
import '../patient-satisfaction-survey-responses/styles.less';

type SortType = 'asc' | 'desc';

// Columns stored on the response table; the patient name and MRN come from the patient
const SORTABLE_COLUMNS = new Set(['overallScore', 'overallPercentage', 'startedAt', 'completedAt', 'createdDate']);

/** Submitted patient satisfaction surveys, answered with the survey questions setup */
const SurveyResponses: React.FC = () => {
  const dispatch = useAppDispatch();

  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortType, setSortType] = useState<SortType>('desc');
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'createdDate,desc'
  });

  const { data: responsesPage, isFetching } = useGetSurveyResponsesQuery(paginationParams);

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
    if (!SORTABLE_COLUMNS.has(column)) {
      return;
    }

    setSortColumn(column);
    setSortType(direction);
    setPaginationParams(previous => ({ ...previous, page: 0, sort: `${column},${direction}` }));
  };

  const handleViewDetails = (row: SurveyResponse) => {
    setSelectedResponse(row);
    setDetailsModalOpen(true);
  };

  const tableColumns = [
    {
      key: 'patientName',
      title: <Translate>Patient Name</Translate>,
      flexGrow: 3,
      render: (row: SurveyResponse) => row.patientName || <Translate>Anonymous</Translate>
    },
    {
      key: 'medicalRecordNumber',
      title: <Translate>MRN</Translate>,
      flexGrow: 2,
      render: (row: SurveyResponse) => row.medicalRecordNumber || '-'
    },
    {
      key: 'overallScore',
      title: <Translate>Overall Score</Translate>,
      flexGrow: 2,
      render: (row: SurveyResponse) => row.overallScore ?? '-'
    },
    {
      key: 'overallPercentage',
      title: <Translate>Overall Percentage</Translate>,
      flexGrow: 2,
      render: (row: SurveyResponse) => (row.overallPercentage != null ? `${row.overallPercentage}%` : '-')
    },
    {
      key: 'startedAt',
      title: <Translate>Started At</Translate>,
      flexGrow: 3,
      render: (row: SurveyResponse) => formatDateWithoutSeconds(row.startedAt ?? '')
    },
    {
      key: 'completedAt',
      title: <Translate>Completed At</Translate>,
      flexGrow: 3,
      render: (row: SurveyResponse) => formatDateWithoutSeconds(row.completedAt ?? '')
    },
    {
      key: 'createdDate',
      title: <Translate>Created Date</Translate>,
      flexGrow: 3,
      render: (row: SurveyResponse) => formatDateWithoutSeconds(row.createdDate ?? '')
    },
    {
      key: 'actions',
      title: '',
      width: 90,
      render: (row: SurveyResponse) => (
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

  const selectedRowClass = (row: SurveyResponse) => (row?.id === selectedResponse?.id ? 'selected-row' : '');

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

      <SurveyResponseDetailsModal open={detailsModalOpen} setOpen={setDetailsModalOpen} response={selectedResponse} />
    </Panel>
  );
};

export default SurveyResponses;
