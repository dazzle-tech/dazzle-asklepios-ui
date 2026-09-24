import CancellationModal from '@/components/CancellationModal';
import ChatModal from '@/components/ChatModal';
import LovValueCell from '@/components/LovValueCell';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import Translate from '@/components/Translate';
import UserDateCell from '@/components/UserDateCell/UserDateCell';
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
import { useGetDiagnosticTestProfilesByIdsMutation } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import { useLazyGetDiagnosticTestsByIdsQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import { useLazyGetLaboratoriesByTestIdsQuery } from '@/services/setup/diagnosticTest/laboratoryService';

import {
  useGetLovValuesByCodeQuery
} from '@/services/setupService';

import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faDiagramPredecessor,
  faFileLines,
  faPenToSquare,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState
} from 'react';
import { FaChartLine } from 'react-icons/fa';
import {
  Checkbox,
  HStack,
  Panel,
  Tooltip,
  Whisper
} from 'rsuite';
import LaboratoryReportButton from '../encounter/encounter-component/diagnostics-result/LaboratoryReportButton';
import LaboratoryResultComparison from '../encounter/encounter-component/diagnostics-result/LaboratoryResultComparison';
import EditResultModal from './EditResultModal';
import LogResult from './LogResult';
import NormalRangeModal from './NormalRangeModal';

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

    // ── Critical confirmation modal state ────────────────────────────────────
    const [openCriticalConfirmModal, setOpenCriticalConfirmModal] = useState(false);
    const [pendingApproveRow, setPendingApproveRow] = useState<any>(null);
    const [isBulkCriticalApprove, setIsBulkCriticalApprove] = useState(false);
    // ─────────────────────────────────────────────────────────────────────────

    const [paginationParams, setPaginationParams] = useState<PaginationParams>({
      page: 0,
      size: 20,
      sort: 'id,asc'
    });
    const [sortType, setSortType] = useState<SortType>('asc');
    const [normalRangesMap, setNormalRangesMap] = useState<Record<number, any[]>>({});

    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');
    const [fetchDiagnosticTestsByIds, { data: diagnosticTestsByIdsResponse }] =
      useLazyGetDiagnosticTestsByIdsQuery();
    const [fetchLaboratoriesByTestIds, { data: labsByTestIds }] =
      useLazyGetLaboratoriesByTestIdsQuery();
    const [getProfilesByIds, { data: profilesResponse }] =
      useGetDiagnosticTestProfilesByIdsMutation();

    const [fetchNormalRangesByProfileTestId] = useLazyGetDiagnosticTestNormalRangesByProfileTestIdQuery();
    const [approveResult] = useApproveDiagnosticOrderTestResultMutation();
    const [rejectResult] = useRejectDiagnosticOrderTestResultMutation();
    const [bulkApproveResults] = useBulkApproveDiagnosticOrderTestResultMutation();
    const [bulkRejectResults] = useBulkRejectDiagnosticOrderTestResultMutation();
    const [createResultNote] = useCreateDiagnosticOrderTestResultTechnicianNoteMutation();

   

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

    const profilesMap = useMemo(
      () => new Map((profilesResponse ?? []).map((profile: any) => [profile.id, profile])),
      [profilesResponse]
    );
 const testIds = useMemo(
      () =>
        Array.from(
          new Set(
            profileTestIds
              .map((profileId: any) => profilesMap.get(profileId)?.testId)
              .filter((id): id is number => id != null)
          )
        ),
      [profileTestIds, profilesMap]
    );

    const testsMap = useMemo(
      () => new Map((diagnosticTestsByIdsResponse ?? []).map((test: any) => [test.id, test])),
      [diagnosticTestsByIdsResponse]
    );
    const labTestIds = useMemo(
      () =>
        Array.from(
          new Set(
            profileTestIds
              .map((profileId: any) => profilesMap.get(profileId)?.testId)
              .filter((id): id is number => id != null)
          )
        ),
      [profileTestIds, profilesMap]
    );

    const labByTestIdMap = useMemo(
      () => new Map((labsByTestIds ?? []).map((lab: any) => [lab.testId, lab])),
      [labsByTestIds]
    );

    useEffect(() => {
      if (!profileTestIds.length) return;

      getProfilesByIds(profileTestIds)
        .unwrap()
        .then(() => undefined)
        .catch(() => undefined);
    }, [getProfilesByIds, profileTestIds]);

    useEffect(() => {
      if (!testIds.length) return;

      fetchDiagnosticTestsByIds({ ids: testIds })
        .unwrap()
        .then(() => undefined)
        .catch(() => undefined);
    }, [fetchDiagnosticTestsByIds, testIds]);

    useEffect(() => {
      if (!labTestIds.length) return;

      fetchLaboratoriesByTestIds({ testIds: labTestIds })
        .unwrap()
        .then(() => undefined)
        .catch(() => undefined);
    }, [fetchLaboratoriesByTestIds, labTestIds]);

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

    const
      selectableResultIds = useMemo(
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

  const resultType =
    profile?.resultType?.toUpperCase()?.trim();

  if (resultType === 'LOV') {
    return (
      <LovValueCell
        valueKey={row.resultValueText}
      />
    );
  }

  if (resultType === 'TEXT') {
    return row.resultValueText ?? ' ';
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

    const isCriticalResult = (row: any) =>
      row?.viewMarker === 'CRITICAL_UPPER' || row?.viewMarker === 'CRITICAL_LOWER';

    // ── Actual approve execution (called after confirmation) ──────────────────
    const doApprove = async (row: any) => {
      try {
        await approveResult(row.id).unwrap();
        setSelectedResultIds(prev => prev.filter(id => id !== row.id));
        refetch();
        await refetchAllLabData();
        dispatch(notify({ msg: 'Result approved successfully', sev: 'success' }));
      } catch (e: any) {
        dispatch(
          notify({
            msg: e?.data?.message || e?.data?.detail || e?.error || 'Approve failed',
            sev: 'error'
          })
        );
      }
    };
    const handleApprove = (row: any) => {

      if (isResultEmpty(row)) {
        dispatch(
          notify({
            msg: 'Cannot approve. Result value is missing.',
            sev: 'warning'
          })
        );
        return;
      }

      if (isCriticalResult(row)) {
        setPendingApproveRow(row);
        setIsBulkCriticalApprove(false);
        setOpenCriticalConfirmModal(true);
      } else {
        doApprove(row);
      }
    };
    const doBulkApprove = async (idsToApprove?: number[]) => {
      const resolvedIds = idsToApprove ?? selectedResultIds;
      if (!resolvedIds?.length) return;
      try {
        await bulkApproveResults({ ids: resolvedIds }).unwrap();
        setSelectedResultIds([]);
        handleToggleSelectAll(false);
        await refetch();
        await refetchAllLabData();
        dispatch(notify({ msg: 'Selected results approved successfully', sev: 'success' }));
      } catch (e: any) {
        dispatch(
          notify({
            msg: e?.data?.message || e?.data?.detail || e?.error || 'Bulk approve failed',
            sev: 'error'
          })
        );
      }
    };

    // ─────────────────────────────────────────────────────────────────────────

  const isResultEmpty = (row: any) => {
  const profile = row.profile;

  if (!profile) return true;

  const resultType =
    profile?.resultType?.toUpperCase()?.trim();

  if (resultType === 'LOV' || resultType === 'TEXT') {
    return (
      row.resultValueText === null ||
      row.resultValueText === undefined ||
      row.resultValueText === ''
    );
  }

  return (
    row.resultValueNumber === null ||
    row.resultValueNumber === undefined
  );
};



    const handleBulkApprove = () => {
      const eligibleIds = normalizedResults
        .filter(row => {
          const isSelected = selectedResultIds.includes(row.id);
          const isSelectAllChecked = selectableResultIds.length > 0 && selectableResultIds.every(id => selectedResultIds.includes(id));
          return (isSelected || isSelectAllChecked) && row.processingStatus === 'RESULT_READY';
        })
        .map(row => row.id);

      if (!eligibleIds.length) {
        dispatch(
          notify({
            msg: 'No results are eligible for approval.',
            sev: 'warning'
          })
        );
        return;
      }

      const emptyResults = normalizedResults.filter(
        row =>
          eligibleIds.includes(row.id) &&
          isResultEmpty(row)
      );

      if (emptyResults.length > 0) {
        dispatch(
          notify({
            msg: 'Some selected results are empty. Please fill them before approval.',
            sev: 'warning'
          })
        );
        return;
      }

      const hasCritical = normalizedResults.some(
        row =>
          eligibleIds.includes(row.id) &&
          isCriticalResult(row)
      );

      setSelectedResultIds(eligibleIds);

      if (hasCritical) {
        setIsBulkCriticalApprove(true);
        setPendingApproveRow(null);
        setOpenCriticalConfirmModal(true);
      } else {
        void doBulkApprove(eligibleIds);
      }
    };

    const handleCriticalConfirmYes = () => {
      setOpenCriticalConfirmModal(false);
      if (isBulkCriticalApprove) {
        const idsToApprove = selectedResultIds.length ? selectedResultIds : [];
        void doBulkApprove(idsToApprove);
      } else if (pendingApproveRow) {
        doApprove(pendingApproveRow);
      }
      setPendingApproveRow(null);
      setIsBulkCriticalApprove(false);
    };

    const handleCriticalConfirmNo = () => {
      setOpenCriticalConfirmModal(false);
      setPendingApproveRow(null);
      setIsBulkCriticalApprove(false);
    };

    const handleReject = async () => {
      try {
        const resolvedIds = (() => {
          if (isBulkRejectMode) {
            const isSelectAllChecked = selectableResultIds.length > 0 && selectableResultIds.every(id => selectedResultIds.includes(id));
            if (isSelectAllChecked) {
              return selectableResultIds;
            }
            return selectedResultIds;
          }

          return selectedResult?.id ? [selectedResult.id] : [];
        })();

        if (!resolvedIds.length) return;

        if (isBulkRejectMode) {
          await bulkRejectResults({
            ids: resolvedIds,
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

      setSelectedResultIds(prev =>
        checked
          ? prev.includes(row.id)
            ? prev
            : [...prev, row.id]
          : prev.filter(id => id !== row.id)
      );
    };


    const handleToggleSelectAll = (checked: boolean) => {
      const allRowIds = normalizedResults.map(row => row.id);

      if (checked) {
        setSelectedResultIds(prev => Array.from(new Set([...prev, ...allRowIds])));
      } else {
        setSelectedResultIds(prev => prev.filter(id => !allRowIds.includes(id)));
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
            onClick={(e) => e.stopPropagation()}
          />
        ),
        align: 'center',
        width: 60,
        render: (row: any) => {
          return (
            <Checkbox
              checked={selectedResultIds.includes(row.id)}
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
        render: (row: any) => {

          const isText =
            row?.profile?.resultType?.toUpperCase() === 'TEXT';

          if (isText) {
            return '-';
          }

          return (
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
          );
        }
      },
      {
        key: 'normalRange',
        title: <Translate>NORMAL RANGE</Translate>,
        render: (row: any) => {
          const profile = row.profile;
          const isText =
            profile?.resultType?.toUpperCase() === 'TEXT';

          if (isText) {
            return '-';
          }
          const hasViewRange =
            row.viewNormalRange && row.viewNormalRange.trim() !== '';
   
          const hasMinMaxRange =
            row.minValue !== null &&
            row.minValue !== undefined &&
            row.maxValue !== null &&
            row.maxValue !== undefined;
            console.log('hasViewRange', hasViewRange);
            console.log("isLovProfile", isLovProfile(profile));
          if (hasViewRange) {
            if (isLovProfile(profile)) {
              return (
                <LovValueCell
                  valueKey={row.viewNormalRange}
                />
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
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} color='red' />
                  <FontAwesomeIcon icon={faArrowUp} style={{ fontSize: '1em' }} />
                </HStack>
              );
            case 'CRITICAL_LOWER':
              return (
                <HStack spacing={10}>
                  <FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: '1em' }} color='red' />
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
                  console.log('🔍 Selected Row:', row);
                  console.log('🆔 row.profileTestId:', row.profileTestId);

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
          const canPrint = row.processingStatus === 'RESULT_APPROVED';

          return (
            <HStack spacing={10}>
              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Edit Result</Tooltip>}
              >
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

              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Reject Result</Tooltip>}
              >
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

              <Whisper
                placement="top"
                trigger="hover"
                speaker={<Tooltip>Logs</Tooltip>}
              >
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
          <UserDateCell
            login={row.rejectedBy}
            date={row.rejectedAt}
          />
        )
      },
      {
        key: 'approvedAt',
        title: <Translate>APPROVED AT / BY</Translate>,
        expandable: true,
        render: (row: any) => (
          <UserDateCell
            login={row.approvedBy}
            date={row.approvedDate}
          />
        )
      },
      {
        key: 'createdAt',
        title: <Translate>CREATED AT / BY</Translate>,
        expandable: true,
        render: (row: any) => (
          <UserDateCell
            login={row.createdBy}
            date={row.createdDate}
          />
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



    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


    return (
      <div dir={dir}>
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
                <Whisper placement='top' speaker={<Tooltip>Print Results Report</Tooltip>}>
                  <span style={{ display: 'inline-block' }}>
                    <LaboratoryReportButton resultIds={selectedResultIds} />
                  </span>
                </Whisper>
              </HStack>
            </div>
          }
        >
          <div className='laboratory-table-size-container'>
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
          </div>

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
            required
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
            profileTestId={selectedResult?.profileTestId ?? null}
          />

          <MyModal
            open={openCriticalConfirmModal}
            setOpen={setOpenCriticalConfirmModal}
            title="Approve Result — Confirmation Required"
            size="30vw"
            bodyheight="30vh"
            pagesCount={1}
            hideBack
            actionButtonLabel="Yes, Approve"
            actionButtonFunction={handleCriticalConfirmYes}
            cancelButtonLabel="No, Keep Unapproved"
            handleCancelFunction={handleCriticalConfirmNo}
            content={() => (
              <div style={{ textAlign: 'center', padding: '16px 8px' }}>
                <FontAwesomeIcon
                  icon={faTriangleExclamation}
                  style={{ fontSize: '2.5rem', color: 'var(--primary-pink)', marginBottom: 16 }}
                />
                <p style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 8 }}>
                  You are about to <span style={{ color: 'var(--primary-pink)' }}>APPROVE</span> this result.
                </p>
                <p style={{ fontSize: '0.95rem', color: 'var(--gray-dark)' }}>
                  Communicated to Healthcare Provider?
                </p>
              </div>
            )}
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
                patient={{ id: order?.patientId }}
                profileTestId={selectedComparisonProfileId}
                hideTestNameFilter={true}
              />
            )}
          />
        </Panel>
      </div>
    );
  }
);

export default Result;
