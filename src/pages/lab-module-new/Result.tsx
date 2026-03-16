import ChatModal from '@/components/ChatModal';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import CancellationModal from '@/components/CancellationModal';
import MyModal from '@/components/MyModal/MyModal';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { useAppDispatch } from '@/hooks';
import {
  useCreateDiagnosticOrderTestResultTechnicianNoteMutation,
  useGetNotesByResultIdQuery
} from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import {
  useApproveDiagnosticOrderTestResultMutation,
  useBulkApproveDiagnosticOrderTestResultMutation,
  useBulkRejectDiagnosticOrderTestResultMutation,
  useFilterDiagnosticOrderTestResultsQuery,
  useRejectDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { useLazyGetDiagnosticTestNormalRangesByProfileTestIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestNormalRangeService';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useGetAllDiagnosticTestsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useGetAllLaboratoriesQuery } from '@/services/setup/diagnosticTest/laboratoryService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faDiagramPredecessor,
  faFileLines,
  faPenToSquare,
  faPrint,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import {
  Button,
  Checkbox,
  HStack,
  Panel,
  Tooltip,
  Whisper
} from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { FaChartLine } from 'react-icons/fa';
import LaboratoryResultComparison from '../encounter/encounter-component/diagnostics-result/LaboratoryResultComparison';
import EditResultModal from './EditResultModal';
import LogResult from './LogResult';
import NormalRangeModal from './NormalRangeModal';
import MyButton from '@/components/MyButton/MyButton';

type SortType = 'asc' | 'desc';

type Props = {
  order: any;
  loading?: boolean;
  setTest: (test: any) => void;
  refetchAllLabData: () => Promise<void>;
};

type PaginationParams = {
  page: number;
  size: number;
  sort: string;
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
    (d: any) => String(d.key) === String(profile.listOfValueId)
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
  ({ order, loading, setTest, refetchAllLabData }, ref) => {
    const dispatch = useAppDispatch();

    const [openEditModal, setOpenEditModal] = useState(false);
    const [selectedResultForEdit, setSelectedResultForEdit] = useState<any>(null);
    const [openResultNoteModal, setOpenResultNoteModal] = useState(false);
    const [selectedResult, setSelectedResult] = useState<any>(null);
    const [openLogsModal, setOpenLogsModal] = useState(false);
    const [selectedResultForLogs, setSelectedResultForLogs] = useState<any>(null);
    const [localResultHasNoteIds, setLocalResultHasNoteIds] = useState<number[]>([]);
    const [openResultRejectModal, setOpenResultRejectModal] = useState(false);
    const [resultRejectReason, setResultRejectReason] = useState('');
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [categoryFilter, setCategoryFilter] = useState({ value: '' });
    const [sortColumn, setSortColumn] = useState('id');
    const [openNormalRangeModal, setOpenNormalRangeModal] = useState(false);
    const [openComparisonModal, setOpenComparisonModal] = useState(false);
    const [selectedComparisonProfileId, setSelectedComparisonProfileId] = useState<number | null>(null);

    const [selectedResultIds, setSelectedResultIds] = useState<number[]>([]);
    const [isBulkRejectMode, setIsBulkRejectMode] = useState(false);

    const [paginationParams, setPaginationParams] = useState<PaginationParams>({
      page: 0,
      size: 5,
      sort: 'id,asc'
    });
    const [sortType, setSortType] = useState<SortType>('asc');
    const [normalRangesMap, setNormalRangesMap] = useState<Record<number, any[]>>({});

    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const { data: allLovValues } = useGetLovAllValuesQuery({ ...initialListRequestAllValues });
    const { data: lovDefinitions } = useGetLovsQuery({ ...initialListRequest, pageSize: 1000 });
    const { data: allTestsResponse } = useGetAllDiagnosticTestsQuery({ page: 0, size: 10000 });
    const allTests = allTestsResponse?.data ?? [];
    const { data: allLabsResponse } = useGetAllLaboratoriesQuery({ page: 0, size: 10000 });
    const allLabs = allLabsResponse?.data ?? [];
    const { data: profilesResponse } = useGetAllDiagnosticTestProfilesQuery({
      page: 0,
      size: 10000,
      sort: 'id,asc'
    });
    const allProfiles = profilesResponse?.data ?? [];

    const [fetchNormalRangesByProfileTestId] = useLazyGetDiagnosticTestNormalRangesByProfileTestIdQuery();
    const [approveResult] = useApproveDiagnosticOrderTestResultMutation();
    const [rejectResult] = useRejectDiagnosticOrderTestResultMutation();
    const [bulkApproveResults] = useBulkApproveDiagnosticOrderTestResultMutation();
    const [bulkRejectResults] = useBulkRejectDiagnosticOrderTestResultMutation();
    const [createResultNote] = useCreateDiagnosticOrderTestResultTechnicianNoteMutation();

    const testsMap = useMemo(() => new Map(allTests.map(t => [t.id, t])), [allTests]);
    const labByTestIdMap = useMemo(() => new Map(allLabs.map(l => [l.testId, l])), [allLabs]);
    const profilesMap = useMemo(() => new Map(allProfiles.map(p => [p.id, p])), [allProfiles]);

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
          ...(categoryFilter.value ? { category: categoryFilter.value } : {})
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
      refetch: refetchResultNotes
    } = useGetNotesByResultIdQuery(selectedResult?.id ?? skipToken);

    const normalizedResults = useMemo(() => {
      return results.map(r => {
        const profile = profilesMap.get(r.profileTestId);
        const testId = profile?.testId;

        return {
          ...r,
          profile,
          test: testsMap.get(testId),
          lab: labByTestIdMap.get(testId),
          normalRanges: normalRangesMap[r.profileTestId] ?? []
        };
      });
    }, [results, profilesMap, testsMap, labByTestIdMap, normalRangesMap]);

    const selectableResults = useMemo(
      () => normalizedResults.filter(r => r.processingStatus === 'RESULT_READY'),
      [normalizedResults]
    );

    const selectableResultIds = useMemo(
      () => selectableResults.map(r => r.id),
      [selectableResults]
    );

    const isAllSelected =
      selectableResultIds.length > 0 &&
      selectableResultIds.every(id => selectedResultIds.includes(id));

    const isIndeterminate =
      selectedResultIds.length > 0 && !isAllSelected;

    const handleSendResultNote = async (value: string) => {
      if (!selectedResult?.id || !order?.id) return;

      try {
        await createResultNote({
          resultId: selectedResult.id,
          orderTestId: selectedResult.orderTestId,
          note: value
        }).unwrap();

        setLocalResultHasNoteIds(prev =>
          prev.includes(selectedResult.id) ? prev : [...prev, selectedResult.id]
        );

        refetchResultNotes();
      } catch (e: any) {
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
        (u: any) => String(u.key) === String(profile.resultUnit)
      )?.lovDisplayVale;

      return unit || null;
    };

    const handleApprove = async (row: any) => {
      try {
        await approveResult(row.id).unwrap();
        setSelectedResultIds(prev => prev.filter(id => id !== row.id));
        refetch();
        await refetchAllLabData();
      } catch (e: any) {
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

    const handleBulkApprove = async () => {
      if (!selectedResultIds.length) return;

      try {
        await bulkApproveResults({
          ids: selectedResultIds
        }).unwrap();

        setSelectedResultIds([]);
        refetch();
        await refetchAllLabData();

        dispatch(
          notify({
            msg: 'Selected results approved successfully',
            sev: 'success'
          })
        );
      } catch (e: any) {
        dispatch(
          notify({
            msg:
              e?.data?.message ||
              e?.data?.detail ||
              e?.error ||
              'Bulk approve failed',
            sev: 'error'
          })
        );
      }
    };

    const handleReject = async () => {
      try {
        if (isBulkRejectMode) {
          if (!selectedResultIds.length) return;

          await bulkRejectResults({
            ids: selectedResultIds,
            rejectedReason: resultRejectReason
          }).unwrap();

          setSelectedResultIds([]);
        } else {
          if (!selectedResult?.id) return;

          await rejectResult({
            id: selectedResult.id,
            body: { rejectedReason: resultRejectReason }
          }).unwrap();

          setSelectedResultIds(prev => prev.filter(id => id !== selectedResult.id));
        }

        setOpenResultRejectModal(false);
        setResultRejectReason('');
        setIsBulkRejectMode(false);

        refetch();
        await refetchAllLabData();

        dispatch(
          notify({
            msg: isBulkRejectMode
              ? 'Selected results rejected successfully'
              : 'Result rejected successfully',
            sev: 'success'
          })
        );
      } catch (e: any) {
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

    const toggleSelectRow = (row: any, checked: boolean) => {
      if (row.processingStatus !== 'RESULT_READY') return;

      setSelectedResultIds(prev =>
        checked
          ? prev.includes(row.id)
            ? prev
            : [...prev, row.id]
          : prev.filter(id => id !== row.id)
      );
    };

    const handleToggleSelectAll = (checked: boolean) => {
      if (checked) {
        setSelectedResultIds(selectableResultIds);
      } else {
        setSelectedResultIds([]);
      }
    };

    const columns: ColumnConfig[] = [
      {
        key: 'select',
        title: (
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            onChange={(_, checked) => handleToggleSelectAll(checked)}
          />
        ),
        align: 'center',
        width: 60,
        render: (row: any) => {
          const disabled = row.processingStatus !== 'RESULT_READY';
          return (
            <Checkbox
              checked={selectedResultIds.includes(row.id)}
              disabled={disabled}
              onChange={(_, checked) => toggleSelectRow(row, checked)}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
      },
      {
        key: 'testName',
        title: <Translate>TEST NAME</Translate>,
        render: (row: any) => (
          <>
            {row.profile?.name}
            <br />
            {!row.profile?.isDefault && (
              <span style={{ fontSize: 10, color: '#666' }}>
                {row.test?.name}
              </span>
            )}
          </>
        )
      },
      {
        key: 'result',
        title: <Translate>TEST RESULT, UNIT</Translate>,
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
        align: 'center',
        render: (row: any) => (
          <Whisper
            placement="top"
            trigger="hover"
            container={() => document.body}
            speaker={<Tooltip>View Normal Ranges</Tooltip>}
          >
            <span style={{ display: 'inline-block' }}>
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
        render: (row: any) => {
          const profile = row.profile;

          const hasViewRange =
            row.viewNormalRange && row.viewNormalRange.trim() !== '';

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
        render: (rowData: any) => {
          switch (rowData.viewMarker) {
            case 'ABNORMAL_MARKER':
              return <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: '1em' }} />;
            case 'NORMAL_MARKER':
              return 'Normal';
            case 'UNKNOWN':
              return 'Unknown';
            case 'UPPER_LIMIT':
              return <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1em' }} />;
            case 'LOWER_LIMIT':
              return <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: '1em' }} />;
            case 'CRITICAL_UPPER':
              return (
                <HStack spacing={10}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} />
                  <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1em' }} />
                </HStack>
              );
            case 'CRITICAL_LOWER':
              return (
                <HStack spacing={10}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} />
                  <FontAwesomeIcon icon={faArrowDown} style={{ fontSize: '1em' }} />
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
                style={{ cursor: 'pointer', opacity: 0.8 }}
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
        align: 'center',
        render: (row: any) => {
          const hasNote =
            row.hasNote === true || localResultHasNoteIds.includes(row.id);

          return (
            <HStack spacing={10}>
              <FontAwesomeIcon
                icon={faComment}
                style={{
                  fontSize: '1em',
                  cursor: 'pointer',
                  color: hasNote ? '#1675e0' : 'var(--primary-gray)'
                }}
                className="icon-laboratory-size"
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
        align: 'center',
        render: (row: any) => formatEnumString(row.processingStatus)
      },
      {
        key: 'action',
        title: <Translate>ACTION</Translate>,
        align: 'center',
        render: (row: any) => {
          const canEdit = row.processingStatus === 'RESULT_READY';
          const canApprove = row.processingStatus === 'RESULT_READY';
          const canReject = row.processingStatus === 'RESULT_READY';

          return (
            <HStack spacing={10}>
              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Edit Result</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faPenToSquare}
                    className="icon-laboratory-size"
                    style={{
                      cursor: canEdit ? 'pointer' : 'not-allowed',
                      opacity: canEdit ? 1 : 0.4
                    }}
                    onClick={() => {
                      if (!canEdit) return;
                      setSelectedResultForEdit(row);
                      setOpenEditModal(true);
                    }}
                  />
                </span>
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Approve Result</Tooltip>}>
                <span>
                  <CheckRoundIcon
                    onClick={() => {
                      if (!canApprove) return;
                      handleApprove(row);
                    }}
                    className="icon-laboratory-size"
                    style={{
                      fontSize: '1em',
                      marginRight: 10,
                      cursor: canApprove ? 'pointer' : 'not-allowed',
                      opacity: canApprove ? 1 : 0.4
                    }}
                  />
                </span>
              </Whisper>

              <Whisper placement="top" trigger="hover" speaker={<Tooltip>Reject Result</Tooltip>}>
                <span>
                  <WarningRoundIcon
                    onClick={() => {
                      if (!canReject) return;
                      setSelectedResult(row);
                      setIsBulkRejectMode(false);
                      setOpenResultRejectModal(true);
                    }}
                    className="icon-laboratory-size"
                    style={{
                      fontSize: '1em',
                      marginRight: 10,
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
                  className="icon-laboratory-size"
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
        expandable: true,
        render: (row: any) => (
          <>
            <span>{row.rejectedBy ?? ' '}</span>
            <br />
            <span className="date-table-style">
              {row.rejectedAt ? formatDateWithoutSeconds(row.rejectedAt) : ' '}
            </span>
          </>
        )
      },
      {
        key: 'approvedAt',
        title: <Translate>APPROVED AT / BY</Translate>,
        expandable: true,
        render: (row: any) => (
          <>
            <span>{row.approvedBy ?? ' '}</span>
            <br />
            <span className="date-table-style">
              {row.approvedAt ? formatDateWithoutSeconds(row.approvedDate) : ' '}
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
        page: newPage
      }));
    };

    const handleRowsPerPageChange = (e: any) => {
      const newSize = Number(e.target.value);
      setPaginationParams(prev => ({
        ...prev,
        size: newSize,
        page: 0
      }));
    };

    const handleSortChange = (column: string, type: SortType) => {
      setSortColumn(column);
      setSortType(type);

      setPaginationParams(prev => ({
        ...prev,
        sort: `${column},${type}`,
        page: 0
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
    }, [fetchNormalRangesByProfileTestId, normalRangesMap, profileTestIds]);

    useEffect(() => {
      const currentIds = normalizedResults.map(r => r.id);
      setSelectedResultIds(prev => prev.filter(id => currentIds.includes(id)));
    }, [normalizedResults]);

    return (
      <Panel
        defaultExpanded
        header={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span />
            <HStack spacing={10}>

              <Whisper placement="top" speaker={<Tooltip>Approve</Tooltip>}>
                <span style={{ display: 'inline-block' }}>
                  <MyButton
                    prefixIcon={() => <CheckRoundIcon />}
                    disabled={!selectedResultIds.length}
                    onClick={handleBulkApprove}
                  >
                    Approve Selected
                  </MyButton>
                </span>
              </Whisper>

              <Whisper placement="top" speaker={<Tooltip>Reject</Tooltip>}>
                <span style={{ display: 'inline-block' }}>
                  <MyButton
                    prefixIcon={() => <WarningRoundIcon />}
                    appearance="ghost"
                    disabled={!selectedResultIds.length}
                    onClick={() => {
                      setIsBulkRejectMode(true);
                      setOpenResultRejectModal(true);
                    }}
                  >
                    Reject Selected
                  </MyButton>
                </span>
              </Whisper>
            </HStack>
          </div>
        }
      >
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
        />

        <LogResult
          open={openLogsModal}
          setOpen={setOpenLogsModal}
          result={selectedResultForLogs}
        />

        <CancellationModal
          open={openResultRejectModal}
          setOpen={(open: boolean) => {
            setOpenResultRejectModal(open);
            if (!open) {
              setIsBulkRejectMode(false);
              setResultRejectReason('');
            }
          }}
          fieldName="rejectedReason"
          handleCancle={handleReject}
          object={{ rejectedReason: resultRejectReason }}
          setObject={(obj: any) => setResultRejectReason(obj.rejectedReason)}
          fieldLabel="Reject Reason"
          title={isBulkRejectMode ? 'Reject Selected Results' : 'Reject Result'}
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