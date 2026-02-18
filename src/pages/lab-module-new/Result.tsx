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
import { faArrowDown, faArrowUp, faCheck, faCircleExclamation, faComment, faDiagramPredecessor, faFileLines, faPenToSquare, faPlusCircle, faPrint, faTriangleExclamation, faXmark } from '@fortawesome/free-solid-svg-icons';
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
import EditResultModal from './EditResultModal';
import { useLazyGetDiagnosticTestNormalRangesByProfileTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import NormalRangeModal from './NormalRangeModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import LaboratoryResultComparison from '../encounter/encounter-component/diagnostics-result/LaboratoryResultComparison';
import MyModal from '@/components/MyModal/MyModal';
import { FaChartLine } from 'react-icons/fa';

type Props = {
  order: any;
  loading?: boolean;
  setTest: (test: any) => void;
  fetchAllTests?: () => any;
  refetchAllLabData: () => Promise<void>;
  fecthSample?: () => any;
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
  ({ order, loading, setTest, fetchAllTests, refetchAllLabData, fecthSample }, ref) => {
    const authSlice = useAppSelector(state => state.auth);
    const dispatch = useAppDispatch();
    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedResultForEdit, setSelectedResultForEdit] = useState<any>(null);
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
    const [openNormalRangeModal, setOpenNormalRangeModal] = useState(false);
    const [openComparisonModal, setOpenComparisonModal] = useState(false);
    const [selectedComparisonProfileId, setSelectedComparisonProfileId] = useState<number | null>(null);

    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: "id,asc",
    });

    const [
      fetchNormalRangesByProfileTestId
    ] = useLazyGetDiagnosticTestNormalRangesByProfileTestIdQuery();

    const [normalRangesMap, setNormalRangesMap] = useState<
      Record<number, any[]>
    >({});





    const { data: labCatLovQueryResponse } =
      useGetLovValuesByCodeQuery('LAB_CATEGORIES');

    const { data: valueUnitLov } =
      useGetLovValuesByCodeQuery('VALUE_UNIT');

    const { data: allLovValues } =
      useGetLovAllValuesQuery({ ...initialListRequestAllValues });

    const { data: lovDefinitions } =
      useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });

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
            orderIdIn: order.id,
            page: paginationParams.page,
            size: paginationParams.size,
            sort: paginationParams.sort,
            ...(categoryFilter.value
              ? { category: categoryFilter.value }
              : {})
          }
        : skipToken
    );


    useImperativeHandle(ref, () => ({ refetch }));

    const results = resultsResponse?.data ?? [];


    const profileTestIds = useMemo(
      () =>
        results
          .map(r => r.profileTestId)
          .filter(Boolean)
          .filter((id, i, arr) => arr.indexOf(id) === i),
      [results]
    );


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
          orderTestId: selectedResult.orderTestId,
          note: value
        }).unwrap();
        setLocalResultHasNoteIds(prev =>
          prev.includes(selectedResult.id)
            ? prev
            : [...prev, selectedResult.id]
        );

        refetchResultNotes();
      } catch (e: any) {
        console.error('Send result note failed', e);

        dispatch(
          notify({
            msg:
              e?.data?.message ||
              e?.data?.detail ||
              e?.error ||
              'Send result note failed',
            sev: 'error'
          })
        );
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
    const normalizedResults = useMemo(() => {
      return results.map(r => {
        const profile = profilesMap.get(r.profileTestId);
        const testId = profile?.testId ?? profile?.diagnosticTestId;

        return {
          ...r,
          profile,
          test: testsMap.get(testId),
          lab: labByTestIdMap.get(testId),
          // profileName: profile?.name ?? profile?.profileName,
          // isDefault:profile?.isDefault,
          normalRanges: normalRangesMap[r.profileTestId] ?? []
        };
      });
    }, [
      results,
      profilesMap,
      testsMap,
      labByTestIdMap,
      normalRangesMap
    ]);

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

  if (!profile.resultUnit) return null;

  const unit = valueUnitLov?.object?.find(
    u => String(u.key) === String(profile.resultUnit)
  )?.lovDisplayVale;

  return unit || null;
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
        await refetchAllLabData();
      } catch (e: any) {
        console.error('Approve failed', e);

        dispatch(
          notify({
            msg:
              e?.data?.message ||
              e?.data?.detail ||
              e?.error ||
              'Approve failed',
            sev: 'error'
          })
        );
      }

    };




    const handleReject = async () => {
      if (!selectedResult?.id) return;

      try {
        await rejectResult({
          id: selectedResult.id,
          body: { rejectedReason: resultRejectReason }
        }).unwrap();

        setOpenResultRejectModal(false);
        setResultRejectReason('');

        refetch();
        await refetchAllLabData();
      } catch (e: any) {
        console.error('Reject failed', e);

        dispatch(
          notify({
            msg:
              e?.data?.message ||
              e?.data?.detail ||
              e?.error ||
              'Reject failed',
            sev: 'error'
          })
        );
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
            {row.profile?.name}
            <br />
            {(!row.profile?.isDefault)&& <span style={{ fontSize: 10, color: '#666' }}>
              {row.test?.name}
            </span>}
           
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
        align: 'center',
        fullText: true,
        render: (row: any) => (
          <Whisper
            placement="top"
            trigger="hover"
            container={() => document.body}
            speaker={<Tooltip>View Normal Ranges</Tooltip>}>
            <span style={{ display: "inline-block" }}>
              <FaChartLine
                size={18}
                color="var(--primary-gray)"
                style={{ cursor: 'pointer', opacity: 0.8 }}
                onClick={() => {
                  setSelectedResult(row);
                  setOpenNormalRangeModal(true);
                }}
              />
            </span>
          </Whisper>
        )
      },
      {
        key: 'normalRange',
        title: <Translate>NORMAL RANGE</Translate>,
        flexGrow: 2,
        fullText: true,
        render: (row: any) => {
          const profile = row.profile;

          const hasViewRange =
            row.viewNormalRange &&
            row.viewNormalRange.trim() !== '';

          const hasMinMaxRange =
            row.minValue !== null &&
            row.minValue !== undefined &&
            row.maxValue !== null &&
            row.maxValue !== undefined;

          if (hasViewRange) {
            if (isLovProfile(profile)) {
              return resolveLovDisplayValue(
                profile,
                row.viewNormalRange,
                lovDefinitions,
                allLovValues
              );
            }

            const unit = resolveUnitDisplay(row);
            return `${row.viewNormalRange}${unit ? ` ${unit}` : ''}`;
          }

          if (hasMinMaxRange) {
            const unit = resolveUnitDisplay(row);
            return `${row.minValue} - ${row.maxValue}${unit ? ` ${unit}` : ''}`;
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
            case 'UNKNOWN':
              
              return 'Unknown';
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
        render: (row: any) => (
          <Whisper
            placement="top"
            trigger="hover"
            speaker={<Tooltip>Compare with previous results</Tooltip>}
          >
            <span>
              <FontAwesomeIcon
                icon={faDiagramPredecessor}
                style={{
                  cursor: 'pointer',
                  opacity: 0.8
                }}
                onClick={() => {
                  setSelectedComparisonProfileId(row.profileTestId);
                  setOpenComparisonModal(true);
                }}
              />
            </span>
          </Whisper>
        )
      },
      {
        key: 'resultTechnicianNotes',
        title: <Translate>COMMENTS</Translate>,
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
        render: (row: any) => {
          const canEdit = row.processingStatus === 'RESULT_READY';
          const canApprove = row.processingStatus === 'RESULT_READY';
          const canReject = row.processingStatus === 'RESULT_READY';

          return (
            <HStack spacing={10}>
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Edit Result</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    style={{
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      opacity: canEdit ? 1 : 0.4
                    }}
                    onClick={() => {
                      if (!canEdit) return;
                      setSelectedResultForEdit(row);
                      setOpenEditModal(true);
                    }}/>
                </span>
              </Whisper>
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Approve Result</Tooltip>}
              >
                <span>
                  <CheckRoundIcon
                    onClick={() => {
                      if (!canApprove) return;
                      handleApprove(row);
                    }}
                    style={{
                      fontSize: '1em',
                      marginRight: 10,
                      color: 'inherit',
                      cursor: canApprove ? 'pointer' : 'not-allowed',
                      opacity: canApprove ? 1 : 0.4
                    }}
                  />
                </span>
              </Whisper>
              <Whisper
                placement="top"
                trigger="hover"
                speaker={
                  <Tooltip>Reject Result</Tooltip>
                }
              >
                <span>
                  <WarningRoundIcon
                    onClick={() => {
                      if (!canReject) return;
                      setSelectedResult(row);
                      setOpenResultRejectModal(true);
                    }}
                    style={{
                      fontSize: '1em',
                      marginRight: 10,
                      color: 'inherit',
                      cursor: canReject ? 'pointer' : 'not-allowed',
                      opacity: canReject ? 1 : 0.4
                    }}
                  />
                </span>
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
          );
        }
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
                ? formatDateWithoutSeconds(row.approvedDate)
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



    useEffect(() => {
      if (!profileTestIds.length) return;

      profileTestIds.forEach(profileTestId => {
        if (normalRangesMap[profileTestId]) return;

        fetchNormalRangesByProfileTestId({
          profileTestId,
          page: 0,
          size: 50
        })
          .unwrap()
          .then(res => {
            setNormalRangesMap(prev => ({
              ...prev,
              [profileTestId]: res?.data ?? []
            }));
          })
          .catch(() => { });
      });
    }, [profileTestIds]);

    return (
      <Panel defaultExpanded>
        <MyTable
          columns={columns}
          data={normalizedResults}
          loading={loading || isFetching}
          page={paginationParams.page}
          rowsPerPage={paginationParams.size}
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
          title="Result Comments"
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

        <EditResultModal
          open={openEditModal}
          setOpen={setOpenEditModal}
          result={selectedResultForEdit}
          onSuccess={() => refetch()}
        />

        <NormalRangeModal
          open={openNormalRangeModal}
          setOpen={setOpenNormalRangeModal}
          ranges={
            selectedResult
              ? normalRangesMap[selectedResult.profileTestId] ?? []
              : []
          }
        />

        <MyModal
          open={openComparisonModal}
          setOpen={setOpenComparisonModal}
          title="Laboratory Result Comparison"
          size="80vw"
          bodyheight="85vh"
          hideActionBtn
          content={() => (
            <LaboratoryResultComparison
              patient={{ key: order?.patientId }}
              profileTestId={selectedComparisonProfileId}
              hideTestNameFilter={true}
            />
          )}
        />



      </Panel>
    );
  }
);

export default Result;
