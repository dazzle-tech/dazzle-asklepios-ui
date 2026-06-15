import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import ChatModal from '@/components/ChatModal';
import MyInput from '@/components/MyInput';
import MyTable from '@/components/MyTable';
import Translate from '@/components/Translate';
import {
  useLazyFilterDiagnosticOrdersQuery,
  useLazyGetDiagnosticOrderByIdQuery
} from '@/services/diagnosic-order/diagnosticOrderService';
import { useGetNotesByResultIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestResultTechnicianNoteService';
import { useLazyGetDiagnosticOrderTestByIdQuery } from '@/services/diagnosic-order/diagnosticOrderTestService';
import {
  useFilterDiagnosticOrderTestResultsQuery,
  useToggleReviewDiagnosticOrderTestResultMutation
} from '@/services/setup/diagnosticTest/diagnosticOrderTestResultService';
import { useGetAllDiagnosticTestProfilesQuery } from '@/services/setup/diagnosticTest/diagnosticTestProfileService';
import {
  useGetLovAllValuesQuery,
  useGetLovsQuery,
  useGetLovValuesByCodeQuery
} from '@/services/setupService';
import { DiagnosticOrderTestStatus } from '@/types/model-types-new';
import { initialListRequest, initialListRequestAllValues } from '@/types/types';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import {
  faArrowDown,
  faArrowUp,
  faCircleExclamation,
  faComment,
  faStar,
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
import { Checkbox, Form, HStack, Panel, Tooltip, Whisper } from 'rsuite';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import { useGetBulkPatientBasicInfoMutation } from '@/services/patient/patientService';
import { useDispatch } from 'react-redux';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useLazyGetEncounterByIdQuery } from '@/services/encounters/patientEncounterService';
import { newApEncounter } from '@/types/model-types-constructor';
import { newPatientEncounter } from '@/types/model-types-constructor-new';
import './ReviewResultsIcon.less';
import UserDateCell from '@/components/UserDateCell';
import PatientSearch from '@/components/PatientSearch';
import { useGetAllDepartmentsWithoutPaginationQuery } from '@/services/security/departmentService';


const renderMarker = (Marker?: string) => {
  switch (Marker) {
    case 'ABNORMAL_MARKER':
      return <FontAwesomeIcon icon={faCircleExclamation} />;
    case 'UPPER_LIMIT':
      return <FontAwesomeIcon icon={faArrowUp} />;
    case 'LOWER_LIMIT':
      return <FontAwesomeIcon icon={faArrowDown} />;
    case 'CRITICAL_UPPER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowUp} />
        </HStack>
      );
    case 'CRITICAL_LOWER':
      return (
        <HStack spacing={6}>
          <FontAwesomeIcon icon={faTriangleExclamation} />
          <FontAwesomeIcon icon={faArrowDown} />
        </HStack>
      );
    default:
      return formatEnumString(Marker);
  }
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

  const normalizedKey = String(key);

  const lovDef = lovDefinitions.object.find(
    (d: any) => String(d.key) === String(profile.listOfValueId)
  );

  if (!lovDef?.lovCode) return key;

  return (
    allLovValues.object.find(
      (v: any) =>
        String(v.lovCode) === String(lovDef.lovCode) &&
        String(v.key) === normalizedKey
    )?.lovDisplayVale ?? key
  );
};

const ReviewResults = forwardRef<any, any>(
  ({ loading, setTest, refetchAllLabData, setPatient, setEncounter }, ref) => {
    const today = new Date();
    const [page, setPage] = useState(0);
    const [size, setSize] = useState(15);
    const [openNotesModal, setOpenNotesModal] = useState(false);
    const [approvalDate, setApprovalDate] = useState({
      fromDate: today,
      toDate: today
    });

    const dispatch = useDispatch();
    const [orderIdIn, setOrderIdIn] = useState<number[] | null>(null);
    const [orderDate, setOrderDate] = useState({ fromDate: null, toDate: null });
    const [showReview, setShowReview] = useState(false);
    const [showAbnormal, setShowAbnormal] = useState(false);
    const [orderTestsMap, setOrderTestsMap] = useState<Record<string, any>>({});
    const [fetchOrderById] = useLazyGetDiagnosticOrderByIdQuery();
    const [fetchOrderTestById] = useLazyGetDiagnosticOrderTestByIdQuery();
    const [selectedResultId, setSelectedResultId] = useState<number | null>(null);
    const [ordersMap, setOrdersMap] = useState<Record<string, any>>({});
    const [rowsPerPage, setRowsPerPage] = useState(10);

    const [filtersKey, setFiltersKey] = useState(0);

    const [orderIdFilter, setOrderIdFilter] = useState('');

    const [selectedPatient, setSelectedPatient] = useState<any>(null);

    const [departmentFilter, setDepartmentFilter] = useState<any>({
      fromDepartmentIdIn: null
    });

    const [getBulkPatientBasicInfo] = useGetBulkPatientBasicInfoMutation();
    const [patientsMap, setPatientsMap] = useState<Record<string, any>>({});

    const [fetchOrders] = useLazyFilterDiagnosticOrdersQuery();
    const [fetchEncounterById] = useLazyGetEncounterByIdQuery();

    const [toggleReviewDiagnosticOrderTestResult] =
      useToggleReviewDiagnosticOrderTestResultMutation();

    const { data: valueUnitLov } = useGetLovValuesByCodeQuery('VALUE_UNIT');

    const { data: allLovValues } = useGetLovAllValuesQuery({
      ...initialListRequestAllValues
    });

    const { data: lovDefinitions } = useGetLovsQuery({
      ...initialListRequest,
      pageSize: 1000
    });


    const { data: departmentsList = [] } =
      useGetAllDepartmentsWithoutPaginationQuery();

    const normalizeDateRange = (from?: Date | null, to?: Date | null) => {
      if (from && to && from > to) {
        return { from: to, to: from };
      }
      return { from, to };
    };

    const endOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const filterParams = useMemo(() => {
      const params: any = {
        page,
        size,
        processingStatus: DiagnosticOrderTestStatus.RESULT_APPROVED
      };

      params.reviewed = showReview;

      if (selectedPatient?.id) {
        params.patientIdIn = [selectedPatient.id];
      }

      if (departmentFilter?.fromDepartmentIdIn) {
          params.fromDepartmentIdIn = [
            Number(departmentFilter.fromDepartmentIdIn)
          ];
      }

      if (showAbnormal) {
        params.excludeMarkerIn = ['NORMAL_MARKER', 'UNKNOWN'];
      }

      const approval = normalizeDateRange(
        approvalDate.fromDate,
        approvalDate.toDate
      );

      if (approval.from) {
        params.approvedDateFrom = startOfDay(approval.from).toISOString();
      }

      if (approval.to) {
        params.approvedDateTo = endOfDay(approval.to).toISOString();
      }

      const orderIdNumber = Number(orderIdFilter);

      if (orderIdFilter.trim() && Number.isFinite(orderIdNumber)) {
        params.orderNumber = orderIdNumber;
      }

      if (
        selectedPatient?.id ||
        departmentFilter?.fromDepartmentIdIn ||
        orderDate.fromDate ||
        orderDate.toDate
      ) {
        if (orderIdIn && orderIdIn.length > 0) {
          params.orderIdIn = orderIdIn;
        } else {
          params.orderIdIn = [-1];
        }
      }

      return params;
      }, [
            page,
            size,
            approvalDate,
            showReview,
            showAbnormal,
            orderIdIn,
            orderDate,
            orderIdFilter,
            selectedPatient?.id,
            departmentFilter?.fromDepartmentIdIn
          ]);
    const {
      data: resultsResponse,
      isFetching,
      refetch
    } = useFilterDiagnosticOrderTestResultsQuery({
      page,
      size: rowsPerPage,
      sort: 'id,desc',
      ...filterParams
    });

    useEffect(() => {
      dispatch(setPageCode('review-results'));
      dispatch(setDivContent('Review Results'));

      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(' '));
      };
    }, [dispatch]);

    const patientIds = useMemo(() => {
      return Object.values(ordersMap)
        .map((o: any) => o?.patientId)
        .filter(Boolean)
        .map(String)
        .filter((id, i, arr) => arr.indexOf(id) === i);
    }, [ordersMap]);

    useImperativeHandle(ref, () => ({ refetch }));

    const results = resultsResponse?.data ?? [];
    const totalCount = resultsResponse?.totalCount ?? 0;

    const { data: notesResponse } = useGetNotesByResultIdQuery(
      openNotesModal && selectedResultId ? selectedResultId : skipToken
    );

    useEffect(() => {
      if (!results.length) return;

      results.forEach((r) => {
        if (r.orderTestId && orderTestsMap[r.orderTestId]) {
          const orderId = orderTestsMap[r.orderTestId]?.orderId;

          if (orderId && !ordersMap[orderId]) {
            fetchOrderById(orderId)
              .unwrap()
              .then((order) => {
                setOrdersMap((prev) => ({
                  ...prev,
                  [String(order.id)]: order
                }));
              })
              .catch(() => { });
          }
        }

        if (r.orderTestId && !orderTestsMap[r.orderTestId]) {
          fetchOrderTestById(r.orderTestId)
            .unwrap()
            .then((test) => {
              setOrderTestsMap((prev) => ({
                ...prev,
                [String(test.id)]: test
              }));
            })
            .catch(() => { });
        }
      });
    }, [results]);

    useEffect(() => {
      if (!patientIds.length) return;

      const numericIds = patientIds.map((id) => Number(id));

      getBulkPatientBasicInfo(numericIds)
        .unwrap()
        .then((res: any[]) => {
          const map: Record<string, any> = {};

          res.forEach((p: any, index: number) => {
            const originalId = numericIds[index];
            map[String(originalId)] = p;
          });

          setPatientsMap(map);
        })
        .catch((err) => {
          console.error('❌ Bulk patient error:', err);
        });
    }, [patientIds]);

    useEffect(() => {
      Object.values(orderTestsMap).forEach((test: any) => {
        const orderId = test?.orderId;

        if (orderId && !ordersMap[orderId]) {
          fetchOrderById(orderId)
            .unwrap()
            .then((order) => {
              setOrdersMap((prev) => ({
                ...prev,
                [String(order.id)]: order
              }));
            })
            .catch(() => { });
        }
      });
    }, [orderTestsMap]);

    const { data: profilesResponse } = useGetAllDiagnosticTestProfilesQuery({
      page: 0,
      size: 10000,
      sort: 'id,asc'
    });

    const profilesMap = useMemo(
      () => new Map(profilesResponse?.data?.map((p) => [p.id, p]) ?? []),
      [profilesResponse]
    );

    const normalizedResults = useMemo(() => {
      return results.map((r) => {
        const orderTest = orderTestsMap[String(r?.orderTestId)];
        const order = ordersMap[String(orderTest?.orderId)];
        const patient = patientsMap[String(order?.patientId)];
        const profile = profilesMap.get(r.profileTestId);

        return {
          ...r,
          _patientName: patient
            ? [patient.firstName, patient.secondName, patient.lastName].filter(Boolean).join(' ')
            : '—',
          _profile: profile,
          _testName: profile?.name ?? '-',
          _approvedDate: r.approvedDate,
          encounterId: order?.encounterId
        };
      });
    }, [results, orderTestsMap, ordersMap, patientsMap, profilesMap]);

    const resolveUnitDisplay = (row: any) => {
      const profile = row._profile;
      if (!profile || isLovProfile(profile)) return null;

      const unit = valueUnitLov?.object?.find(
        (u) => String(u.key) === String(profile.resultUnit)
      )?.lovDisplayVale;

      return unit || null;
    };

    const resetFilters = () => {
      const now = new Date();

      setApprovalDate({
        fromDate: new Date(now),
        toDate: new Date(now)
      });

      setOrderDate({
        fromDate: null,
        toDate: null
      });

      setShowReview(false);
      setShowAbnormal(false);
      setOrderIdIn(null);
      setSelectedPatient(null);

      setDepartmentFilter({
        fromDepartmentIdIn: null
      });
      setOrderIdFilter('');
      setPage(0);

      setFiltersKey(prev => prev + 1);
    };

    const columns: ColumnConfig[] = useMemo(
      () => [
        {
          key: 'patient',
          title: <Translate>PATIENT NAME</Translate>,
          render: (r: any) => r._patientName
        },
        {
          key: 'approvedAt',
          title: <Translate>RESULT DATE</Translate>,
          render: (row: any) => formatDateWithoutSeconds(row.approvedDate)
        },
        {
          key: 'testName',
          title: <Translate>TEST NAME</Translate>,
          render: (row: any) => (
            <>
              {row._profile?.name ?? '-'}
              <br />
              <span style={{ fontSize: 10, color: '#666' }}>
                {row._profile?.testName ?? ''}
              </span>
            </>
          )
        },
        {
          key: 'resultValue',
          title: <Translate>RESULT VALUE</Translate>,
          render: (row: any) => {
            const profile = row._profile;

            const value = row.resultValueNumber ?? row.resultValueText ?? '';

            if (isLovProfile(profile)) {
              return resolveLovDisplayValue(
                profile,
                value,
                lovDefinitions,
                allLovValues
              );
            }

            const unit = resolveUnitDisplay(row);

            return `${value ?? ''}${unit ? ` ${unit}` : ''}`;
          }
        },
        {
          key: 'normalRange',
          title: <Translate>NORMAL RANGE</Translate>,
          render: (row: any) => {
            const profile = row._profile;
            const hasViewRange =
              row.normalRangeValue && row.normalRangeValue.trim() !== '';

            const hasMinMaxRange =
              row.minValue !== null &&
              row.minValue !== undefined &&
              row.maxValue !== null &&
              row.maxValue !== undefined;

            if (hasViewRange) {
              if (isLovProfile(profile)) {
                return resolveLovDisplayValue(
                  profile,
                  String(row.normalRangeValue),
                  lovDefinitions,
                  allLovValues
                );
              }

              const unit = resolveUnitDisplay(row);
              return `${row.normalRangeValue}${unit ? ` ${unit}` : ''}`;
            }

            if (hasMinMaxRange) {
              const unit = resolveUnitDisplay(row);
              return `${row.minValue} - ${row.maxValue}${unit ? ` ${unit}` : ''}`;
            }

            return ' ';
          }
        },
        {
          key: 'marker',
          title: <Translate>MARKER</Translate>,
          align: 'center',
          width: 90,
          render: (row: any) => renderMarker(row.marker)
        },
        {
          key: 'comments',
          title: <Translate>COMMENTS</Translate>,
          align: 'center',
          render: (row: any) => (
            <FontAwesomeIcon
              icon={faComment}
              className="icon-radiologist-worklist-size"
              style={{
                cursor: 'pointer',
                color: row.hasNote ? '#1675e0' : 'gray'
              }}
              onClick={() => {
                setSelectedResultId(row.id);
                setOpenNotesModal(true);
              }}
            />
          )
        },
        {
          key: 'action',
          title: <Translate>Review</Translate>,
          flexGrow: 1,
          align: 'center',
          render: (rowData: any) => {
            const isReviewed = !!rowData.reviewDate;

            return (
              <Whisper placement="top" speaker={<Tooltip>Review</Tooltip>}>
                <span>
                  <FontAwesomeIcon
                    icon={faStar}
                    className={`review-icon-base ${isReviewed ? 'review-icon-reviewed' : 'review-icon-unreviewed'
                      }`}
                    onClick={async (e) => {
                      e.stopPropagation();
                      setSelectedResultId(rowData.id);

                      try {
                        await toggleReviewDiagnosticOrderTestResult(
                          rowData.id
                        ).unwrap();
                        await refetchAllLabData();
                        refetch();
                      } catch (e) {
                        console.error('Review toggle failed', e);
                      }
                    }}
                  />
                </span>
              </Whisper>
            );
          }
        },
        {
          key: 'reviewDate',
          title: 'Review By/At',
          expandable: true,
          flexGrow: 2,
          render: (row: any) => (
            <UserDateCell
              login={row.reviewBy}
              date={row.reviewDate}
            />
          )
        },
      ],
      [patientsMap, normalizedResults]
    );

    const filters = () => (
      <Form fluid key={filtersKey}>
        <div className="results-table-filters-review-results-main-container">
          <MyInput
            fieldType="date"
            fieldLabel="Approval From Date"
            fieldName="fromDate"
            record={approvalDate}
            setRecord={setApprovalDate}
          />

          <MyInput
            fieldType="date"
            fieldLabel="Approval To Date"
            fieldName="toDate"
            record={approvalDate}
            setRecord={setApprovalDate}
          />

          <MyInput
            fieldType="date"
            fieldLabel="Order From Date"
            fieldName="fromDate"
            record={orderDate}
            setRecord={setOrderDate}
          />

          <MyInput
            fieldType="date"
            fieldLabel="Order To Date"
            fieldName="toDate"
            record={orderDate}
            setRecord={setOrderDate}
          />

          <div className='check-box-review-results-handle'>
            <PatientSearch
              value={selectedPatient}
              onChange={setSelectedPatient}
              showLabel={false}
              width="22vw"
              containerMinWidth={250}
            />

            <MyInput
              width="12vw"
              placeholder="Department Name"
              fieldType="select"
              fieldName="fromDepartmentIdIn"
              record={departmentFilter}
              setRecord={setDepartmentFilter}
              selectData={departmentsList}
              selectDataLabel="name"
              selectDataValue="id"
              showLabel={false}
              cleanable
            />

          <MyInput
            fieldType="text"
            fieldLabel="Order ID"
            fieldName="orderId"
            showLabel={false}
            placeholder="Order ID"
            record={{ orderId: orderIdFilter }}
            setRecord={(record: any) => {
              setOrderIdFilter(record.orderId ?? '');
              setPage(0);
            }}
          />
            </div>
          <div className='check-box-review-results-handle'>
            <MyInput
              fieldType="check"
              fieldLabel="Show Reviewed Results"
              showLabel={false}
              fieldName="showReview"
              record={{ showReview }}
              setRecord={(obj: any) => setShowReview(!!obj.showReview)}
            />
          </div>


        </div>

        <AdvancedSearchFilters
          searchFilter={false}
          showAdvancedButton={false}
          clearOnClick={resetFilters}
        />
      </Form>
    );

    const isSelected = (rowData: any) =>
      selectedResultId === rowData.id ? 'selected-row' : '';

    useEffect(() => {
      const today = new Date();
      setApprovalDate({
        fromDate: today,
        toDate: today
      });
    }, []);

    useEffect(() => {
      const { fromDate, toDate } = orderDate;

      fetchOrders({
        submittedDateFrom: fromDate
          ? startOfDay(fromDate).toISOString()
          : undefined,

        submittedDateTo: toDate
          ? endOfDay(toDate).toISOString()
          : undefined,

        ...(selectedPatient?.id
          ? {
              patientIdIn: [selectedPatient.id]
            }
          : {}),

        ...(departmentFilter?.fromDepartmentIdIn
          ? {
              fromDepartmentIdIn: [
                Number(departmentFilter.fromDepartmentIdIn)
              ]
            }
          : {}),

        page: 0,
        size: 10000
      })
        .unwrap()
        .then((res) => {
          const ids = (res?.data ?? []).map((o: any) => o.id);
          setOrderIdIn(ids);
        })
        .catch(() => setOrderIdIn([]));
    }, [
      orderDate,
      selectedPatient?.id,
      departmentFilter?.fromDepartmentIdIn
    ]);


    useEffect(() => {
      setPage(0);
    }, [
        orderDate,
        selectedPatient?.id,
        departmentFilter?.fromDepartmentIdIn
      ]);

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
      <div dir={dir}>
        <Panel defaultExpanded>
          <MyTable
            filters={filters()}
            columns={columns}
            data={normalizedResults}
            loading={loading || isFetching}
            page={page}
            rowsPerPage={size}
            totalCount={totalCount}
            onPageChange={(_, newPage) => setPage(newPage)}
            rowClassName={isSelected}
            onRowsPerPageChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            onRowClick={async (row: any) => {
              const orderTest = orderTestsMap[String(row.orderTestId)];
              const order = ordersMap[String(orderTest?.orderId)];

              const patientId = order?.patientId;
              if (!patientId) return;

              const rawPatient = patientsMap[String(patientId)];
              if (!rawPatient) return;

              setSelectedResultId(row.id);
              setPatient(rawPatient);

              const encounterId = order?.encounterId;
              if (!encounterId) {
                setEncounter({ ...newPatientEncounter });
                return;
              }
              console.log("Order's encounterId", encounterId);

              try {
                const encounter = await fetchEncounterById({ id: encounterId }).unwrap();

                setEncounter?.(encounter);
              } catch (err) {
                console.error('Failed to fetch encounter', err);
                setEncounter({ ...newPatientEncounter });
              }
            }}
          />

          <ChatModal
            open={openNotesModal}
            setOpen={setOpenNotesModal}
            title="Comments"
            list={openNotesModal ? notesResponse ?? [] : []}
            fieldShowName="note"
            handleSendMessage={{}}
            disabled
          />
        </Panel>
      </div>
    );
  }
);

export default ReviewResults;