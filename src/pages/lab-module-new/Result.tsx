import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import { useAppSelector } from '@/hooks';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { skipToken } from '@reduxjs/toolkit/query';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import { Form, HStack, Panel, Tooltip, Whisper } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowDown, faArrowUp, faCheck, faCircleExclamation, faComment, faDiagramPredecessor, faFileLines, faPlusCircle, faPrint, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
import {
  useGetNotesByResultIdQuery,
  useCreateDiagnosticOrderTestResultTechnicianNoteMutation
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import ChatModal from '@/components/ChatModal';
import {
  useGetLovValuesByCodeQuery,
  useGetLovAllValuesQuery,
  useGetLovsQuery
} from '@/services/setupService';

import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetAllDiagnosticTestProfilesQuery
} from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
  useFilterDiagnosticOrderTestResultsQuery,
  useApproveDiagnosticOrderTestResultMutation,
  useRejectDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import {
  initialListRequestAllValues,
  initialListRequest
} from '@/types/types';
import LogResult from './LogResult';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import CancellationModal from '@/components/CancellationModal';

type Props = {
  order: any;
  loading?: boolean;
  setTest: (test: any) => void;
};


const isLovProfile = (profile?: any) =>
  profile?.resultType?.toUpperCase() === 'LOV';

const resolveLovDisplayValue = (
  profile: any,
  key: any,
  lovDefinitions: any,
  allLovValues: any
) => {
  if (
    !profile?.listOfValueId ||
    key == null ||
    !lovDefinitions?.object ||
    !allLovValues?.object
  ) {
    return key;
  }

  const lovDef = lovDefinitions.object.find(
    (d: any) =>
      String(d.key) === String(profile.listOfValueId)
  );

  if (!lovDef?.lovCode) return key;

  return (
    allLovValues.object.find(
      (v: any) =>
        String(v.lovCode) === String(lovDef.lovCode) &&
        String(v.key) === String(key)
    )?.lovDisplayVale ?? key
  );
};

const Result = forwardRef<any, Props>(
  ({ order, loading, setTest }, ref) => {
    const authSlice = useAppSelector(state => state.auth);

    const [pageIndex, setPageIndex] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openAddResultModal, setOpenAddResultModal] = useState(false);
    const [openResultNoteModal, setOpenResultNoteModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [openLogsModal, setOpenLogsModal] = useState(false);
    const [selectedResultForLogs, setSelectedResultForLogs] = useState<any>(null);
    const [localResultHasNoteIds, setLocalResultHasNoteIds] = useState([]);
    const [openResultRejectModal, setOpenResultRejectModal] = useState(false);
    const [resultRejectReason, setResultRejectReason] = useState('');
    const [selectedRow, setSelectedRow] = useState(null);
    const [categoryFilter, setCategoryFilter] = useState({ value: '' });
    const [sortColumn, setSortColumn] = useState("id");
    const [sortType, setSortType] = useState<"asc" | "desc">("asc");

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: "id,asc",
    });



    const { data: labCatLovQueryResponse } =
      useGetLovValuesByCodeQuery('LAB_CATEGORIES');

    const { data: valueUnitLov } =
      useGetLovValuesByCodeQuery('VALUE_UNIT');

    const { data: allLovValues } =
      useGetLovAllValuesQuery({ ...initialListRequestAllValues });

    const { data: lovDefinitions } =
      useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

    /* ===================== STATIC DATA ===================== */

    const { data: allTestsResponse } =
      useGetAllDiagnosticTestsQuery({ page: 0, size: 10000 });
    const allTests = allTestsResponse?.data ?? [];

    const { data: allLabsResponse } =
      useGetAllLaboratoriesQuery({ page: 0, size: 10000 });
    const allLabs = allLabsResponse?.data ?? [];

    const testsMap = useMemo(
      () => new Map(allTests.map(t => [t.id, t])),
      [allTests]
    );

    const labByTestIdMap = useMemo(
      () => new Map(allLabs.map(l => [l.testId, l])),
      [allLabs]
    );

    const {
      data: resultsResponse,
      isFetching,
      refetch
    } = useFilterDiagnosticOrderTestResultsQuery(
      order?.id
        ? {
          orderId: order.id,
          page: pageIndex,
          size: rowsPerPage,
          ...(categoryFilter.value
            ? { category: categoryFilter.value }
            : {})
        }
        : skipToken
    );

    useImperativeHandle(ref, () => ({ refetch }));

    const results = resultsResponse?.data ?? [];

    const {
      data: resultNotesResponse,
      isFetching: isResultNotesFetching,
      refetch: refetchResultNotes
    } = useGetNotesByResultIdQuery(
      selectedResult?.id ?? skipToken
    );

    const [
      createResultNote,
      { isLoading: isSendingResultNote }
    ] = useCreateDiagnosticOrderTestResultTechnicianNoteMutation();


    const handleSendResultNote = async (value: string) => {
      if (!selectedResult?.id || !order?.id) return;

      try {
        await createResultNote({
          resultId: selectedResult.id,
          orderId: order.id,
          orderTestId: selectedResult.orderTestId,
          note: value
        }).unwrap();

        // 🔵 optimistic update
        setLocalResultHasNoteIds(prev =>
          prev.includes(selectedResult.id)
            ? prev
            : [...prev, selectedResult.id]
        );

        refetchResultNotes();
      } catch (e) {
        console.error('Send result note failed', e);
      }
    };

    const { data: profilesResponse } =
      useGetAllDiagnosticTestProfilesQuery({
        page: 0,
        size: 10000,
        sort: 'id,asc'
      });

    const allProfiles = profilesResponse?.data ?? [];

    const profilesMap = useMemo(
      () => new Map(allProfiles.map(p => [p.id, p])),
      [allProfiles]
    );

    /* ===================== NORMALIZE ===================== */

    const normalizedResults = useMemo(() => {
      return results.map(r => {
        const profile = profilesMap.get(r.profileTestId);
        const testId = profile?.testId ?? profile?.diagnosticTestId;

        const relatedTest = testsMap.get(testId);

        return {
          ...r,
          profile,
          test: relatedTest,
          lab: labByTestIdMap.get(testId),
          profileName: profile?.name ?? profile?.profileName
        };
      });
    }, [results, profilesMap, testsMap, labByTestIdMap]);

    const resolveResultDisplay = (row: any) => {
      const profile = row.profile;
      if (!profile) return ' ';

      if (isLovProfile(profile)) {
        return resolveLovDisplayValue(
          profile,
          row.resultValueText,
          lovDefinitions,
          allLovValues
        );
      }

      return row.resultValueNumber ?? ' ';
    };

    const resolveUnitDisplay = (row: any) => {
      const profile = row.profile;
      if (!profile || isLovProfile(profile)) return null;

      return profile.resultUnit
        ? valueUnitLov?.object?.find(
          u => String(u.key) === String(profile.resultUnit)
        )?.lovDisplayVale
        : null;
    };

    const [
      approveResult,
      { isLoading: isApproving }
    ] = useApproveDiagnosticOrderTestResultMutation();

    const [
      rejectResult,
      { isLoading: isRejecting }
    ] = useRejectDiagnosticOrderTestResultMutation();


    const handleApprove = async (row: any) => {
      try {
        await approveResult(row.id).unwrap();
        refetch();
      } catch (e) {
        console.error('Approve failed', e);
      }
    };

    const handleReject = async () => {
      if (!selectedResult?.id) return;

      try {
        await rejectResult({
          id: selectedResult.id,
          body: {
            rejectedReason: resultRejectReason
          }
        }).unwrap();

        setOpenResultRejectModal(false);
        setResultRejectReason('');
        refetch();
      } catch (e) {
        console.error('Reject failed', e);
      }
    };



    const columns = [
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => (
          <>
            {row.profileName}
            <br />
            <span style={{ fontSize: 10, color: '#666' }}>
              {row.test?.name}
            </span>
          </>
        )
      },
      {
        key: 'result',
        title: <Translate>TEST RESULT, UNIT</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => {
          const value = resolveResultDisplay(row);
          const unit = resolveUnitDisplay(row);

          return (
            <>
              <span>{value}</span>
              {unit && (
                <span style={{ marginLeft: 6, color: '#666' }}>
                  {unit}
                </span>
              )}
            </>
          );
        }
      },
      {
        key: 'resultnormalRange',
        title: <Translate>RESULT NORMAL RANGE</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => {
          const unit = resolveUnitDisplay(row);

          if (row.normalRange) {
            return `${row.normalRange}${unit ? ` ${unit}` : ''}`;
          }

          if (row.minValue != null || row.maxValue != null) {
            return `${row.minValue ?? '-'} - ${row.maxValue ?? '-'}${unit ? ` ${unit}` : ''}`;
          }

          return '';
        }
      },
      {
        key: 'normalRange',
        title: <Translate>NORMAL RANGE</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => {
          const unit = resolveUnitDisplay(row);

          if (row.viewNormalRange) {
            return `${row.viewNormalRange}${unit ? ` ${unit}` : ''}`;
          }

          if (row.minValue != null || row.maxValue != null) {
            return `${row.minValue ?? '-'} - ${row.maxValue ?? '-'}${unit ? ` ${unit}` : ''}`;
          }

          return '';
        }
      },
      {
        key: 'marker',
        title: <Translate>MARKER</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (rowData: any) => {
          switch (rowData.viewMarker) {

            case 'ABNORMAL_MARKER':
              return (
                <FontAwesomeIcon
                  icon={faCircleExclamation}
                  style={{ fontSize: '1em' }}
                />
              );

            case 'NORMAL_MARKER':
              return 'Normal';

            case 'UPPER_LIMIT':
              return (
                <FontAwesomeIcon
                  icon={faArrowUp}
                  style={{ fontSize: '1em' }}
                />
              );

            case 'LOWER_LIMIT':
              return (
                <FontAwesomeIcon
                  icon={faArrowDown}
                  style={{ fontSize: '1em' }}
                />
              );

            case 'CRITICAL_UPPER':
              return (
                <HStack spacing={10}>
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    style={{ fontSize: '1em' }}
                  />
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    style={{ fontSize: '1em' }}
                  />
                </HStack>
              );

            case 'CRITICAL_LOWER':
              return (
                <HStack spacing={10}>
                  <FontAwesomeIcon
                    icon={faTriangleExclamation}
                    style={{ fontSize: '1em' }}
                  />
                  <FontAwesomeIcon
                    icon={faArrowDown}
                    style={{ fontSize: '1em' }}
                  />
                </HStack>
              );

            default:
              return ' ';
          }
        }
      },
      {
        key: 'compare',
        title: <Translate>COMPARE WITH ALL PREVIOUS</Translate>,
        flexGrow: 1,
        align: 'center',
        render: () => (
          <FontAwesomeIcon
            icon={faDiagramPredecessor}
            style={{ opacity: 0.6 }}
          />
        )
      },
      {
        key: 'resultTechnicianNotes',
        title: <Translate>TECHNICIAN NOTES</Translate>,
        flexGrow: 1,
        align: 'center',
        render: (row: any) => {
          const hasNote =
            row.hasNote === true ||
            localResultHasNoteIds.includes(row.id);
          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faComment}
                style={{
                  fontSize: '1em',
                  cursor: 'pointer',
                  color: hasNote ? '#1675e0' : 'inherit'
                }}
                onClick={() => {
                  setSelectedResult(row);
                  setOpenResultNoteModal(true);
                }}
              />
            </HStack>
          );
        }
      },
      {
        key: 'status',
        title: <Translate>RESULT STATUS</Translate>,
        flexGrow: 1,
        align: 'center',
        render: (row: any) =>
          formatEnumString(row.processingStatus)
      },
      {
        key: 'action',
        title: <Translate>ACTION</Translate>,
        flexGrow: 2,
        align: 'center',
        render: (row: any) => (
          <HStack spacing={10}>

        <Whisper placement="top" trigger="hover" speaker={<Tooltip>Approve</Tooltip>}>
            <CheckRoundIcon
              onClick={() => {
                handleApprove(row);
              }}
              style={{
                fontSize: '1em',
                marginRight: 10,
                color: 'inherit',
                cursor: 'pointer'
              }}
            />
          </Whisper>

            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject</Tooltip>}>
              <WarningRoundIcon
                onClick={() => {
                  setSelectedResult(row);
                  setOpenResultRejectModal(true);
                }}
                style={{
                  fontSize: '1em',
                  marginRight: 10,
                  color: 'inherit',
                  cursor: 'pointer'
                }}
              />
            </Whisper>



            <FontAwesomeIcon icon={faPrint} style={{ opacity: 0.5 }} />

            <Whisper placement="top" trigger="hover" speaker={<Tooltip>Logs</Tooltip>}>
              <FontAwesomeIcon
                icon={faFileLines}
                style={{ cursor: 'pointer', opacity: 0.8 }}
                onClick={() => {
                  setSelectedResultForLogs(row);
                  setOpenLogsModal(true);
                }}
              />
            </Whisper>

          </HStack>
        )
      },
      {
        key: 'rejectedAt',
        title: <Translate>REJECTED AT / BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (row: any) => (
          <>
            <span>{row.rejectedBy ?? ' '}</span>
            <br />
            <span className="date-table-style">
              {row.rejectedAt
                ? formatDateWithoutSeconds(row.rejectedAt)
                : ' '}
            </span>
          </>
        )
      },
      {
        key: 'approvedAt',
        title: <Translate>APPROVED AT / BY</Translate>,
        flexGrow: 1,
        expandable: true,
        render: (row: any) => (
          <>
            <span>{row.approvedBy ?? ' '}</span>
            <br />
            <span className="date-table-style">
              {row.approvedAt
                ? formatDateWithoutSeconds(row.approvedAt)
                : ' '}
            </span>
          </>
        )
      }
    ];

const isResultSelected = (rowData: any) => {
  if (rowData && selectedRow && rowData.id === selectedRow.id) {
    return 'selected-row';
  }
  return '';
};



    const handlePageChange = (_: any, newPage: number) => {
      setPaginationParams(prev => ({
        ...prev,
        page: newPage,
      }));
    };

    const handleRowsPerPageChange = (e: any) => {
      const newSize = Number(e.target.value);
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0,
      }));
    };

    const handleSortChange = (column: string, type: "asc" | "desc") => {
      setSortColumn(column);
      setSortType(type);

      setPaginationParams(prev => ({
        ...prev,
        sort: `${column},${type}`,
        page: 0,
      }));
    };



    return (
      <Panel defaultExpanded>
        <MyTable
          columns={columns}
          height={500}
          data={normalizedResults}
          loading={loading || isFetching}
          page={pageIndex}
          rowsPerPage={rowsPerPage}
          totalCount={resultsResponse?.totalCount ?? 0}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          sortColumn={sortColumn}
          sortType={sortType}
          onSortChange={handleSortChange}
          rowClassName={isResultSelected}
          onRowClick={rowData => {
            setSelectedRow(rowData);
            if (rowData?.orderTestId) {
              setTest({
                id: rowData.orderTestId,
                processingStatus: rowData.processingStatus,
                status: rowData.status
              });
            }
          }}
        />


        <ChatModal
          open={openResultNoteModal}
          setOpen={setOpenResultNoteModal}
          title="Result Technician Notes"
          list={resultNotesResponse ?? []}
          fieldShowName="note"
          handleSendMessage={handleSendResultNote}
          loading={isResultNotesFetching || isSendingResultNote}
        />

          <LogResult
            open={openLogsModal}
            setOpen={setOpenLogsModal}
            result={selectedResultForLogs}
          />

        <CancellationModal
          open={openResultRejectModal}
          setOpen={setOpenResultRejectModal}
          fieldName="rejectedReason"
          handleCancle={handleReject}
          object={{ rejectedReason: resultRejectReason }}
          setObject={(obj: any) =>
            setResultRejectReason(obj.rejectedReason)
          }
          fieldLabel="Reject Reason"
          title="Reject Result"
        />


      </Panel>
    );
  }
);

export default Result;
