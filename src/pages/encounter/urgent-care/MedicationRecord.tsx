import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { formatDate, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckDouble,
  faTriangleExclamation,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import { useGetMedicationCategoryClassByClassIdQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import {
  useFilterUccMedicationOrdersQuery,
  useAdministerUccMedicationOrderMutation,
  useDiscardUccMedicationOrderMutation,
  useDoubleCheckUccMedicationOrderMutation
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useGetPatientsByIdsQuery } from '@/services/patient/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import './styles.less';
import CancellationModal from '@/components/CancellationModal';

type MedicationOrderRow = {
  id: number;
  patientId?: number;
  patient?: { id?: number };
  activeIngredientId?: number;
  instructionText?: string;
  status?: string;
  isHighAlert?: boolean;

  createdBy?: string;
  createdDate?: string;

  submittedBy?: string;
  submittedDate?: string;

  administeredBy?: string;
  administeredDate?: string;

  doubleCheckedBy?: string;
  doubleCheckedDate?: string;

  cancelledBy?: string;
  cancelledDate?: string;
  cancellationReason?: string;

  discardedBy?: string;
  discardedDate?: string;
  discardReason?: string;
};

const formatUserAt = (user?: string, date?: string) => {
  return (
    <>
      {user || ' '}
      <br />
      <span className="date-table-style">
        {date ? formatDate(new Date(date)) : ' '}
      </span>
    </>
  );
};

const MedicationClassCell = ({ drugClassId }: { drugClassId?: number }) => {
  const { data, isFetching } = useGetMedicationCategoryClassByClassIdQuery(
    drugClassId as number,
    {
      skip: !drugClassId
    }
  );

  if (!drugClassId) return <>-</>;
  if (isFetching) return <>...</>;

  return <>{data?.name || ' '}</>;
};

const InstructionsCell = ({
  text,
  unitMap,
  frequencyMap,
  roaMap
}: {
  text?: string;
  unitMap: Record<string, string>;
  frequencyMap: Record<string, string>;
  roaMap: Record<string, string>;
}) => {
  const [expanded, setExpanded] = useState(false);

  const parsedText = useMemo(() => {
    if (!text) return ' ';

    const parts = text.split(',').map((p: string) => String(p).trim());

    return parts
      .map((part: string, index: number) => {
        if (index === 1) return unitMap[part] || part;
        if (index === 2) return frequencyMap[part] || part;
        if (index === 3) return roaMap[part] || part;
        return part;
      })
      .join(', ');
  }, [text, unitMap, frequencyMap, roaMap]);

  if (!text) return <>-</>;

  return (
    <div style={{ maxWidth: 320 }}>
      <div
        style={
          expanded
            ? {}
            : {
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                whiteSpace: 'normal',
                wordBreak: 'break-word'
              }
        }
      >
        {parsedText}
      </div>

      {parsedText.length > 90 && (
        <span
          style={{
            color: 'var(--primary-blue)',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 600
          }}
          onClick={() => setExpanded(prev => !prev)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </span>
      )}
    </div>
  );
};

const MedicationRecord = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state?.auth?.user);

  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MedicationOrderRow | null>(null);
  const [cancelObject, setCancelObject] = useState({
    discardReason: ''
  });

  // =========================
  // ORDERED TABLE PAGINATION
  // =========================
  const [orderedParams, setOrderedParams] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc'
  });

  const [orderedSortColumn, setOrderedSortColumn] = useState('createdDate');
  const [orderedSortType, setOrderedSortType] = useState<'asc' | 'desc'>('desc');

  // =============================
  // ADMINISTERED TABLE PAGINATION
  // =============================
  const [adminParams, setAdminParams] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc'
  });

  const [adminSortColumn, setAdminSortColumn] = useState('createdDate');
  const [adminSortType, setAdminSortType] = useState<'asc' | 'desc'>('desc');

  // =========================
  // ORDERED QUERY
  // =========================
  const {
    data: orderedResponse,
    isLoading: orderedLoading,
    isFetching: orderedFetching,
    refetch: refetchOrdered
  } = useFilterUccMedicationOrdersQuery({
    page: orderedParams.page,
    size: orderedParams.size,
    sort: orderedParams.sort,
    statusIn: ['SUBMITTED']
  });

  // =========================
  // ADMIN QUERY
  // =========================
  const {
    data: adminResponse,
    isLoading: adminLoading,
    isFetching: adminFetching,
    refetch: refetchAdmin
  } = useFilterUccMedicationOrdersQuery({
    page: adminParams.page,
    size: adminParams.size,
    sort: adminParams.sort,
    statusIn: ['ADMINISTERED', 'DISCARDED', 'WAITING_DOUBLE_CHECK']
  });

  const orderedRows: MedicationOrderRow[] = useMemo(() => {
    return (orderedResponse?.data || [])
      .filter((r: any) => r?.id)
      .map((r: any) => ({
        ...r,
        id: r.id as number
      }));
  }, [orderedResponse]);

  const administeredRows: MedicationOrderRow[] = useMemo(() => {
    return (adminResponse?.data || [])
      .filter((r: any) => r?.id)
      .map((r: any) => ({
        ...r,
        id: r.id as number
      }));
  }, [adminResponse]);

  const orderedTotalCount = orderedResponse?.totalCount || 0;
  const administeredTotalCount = adminResponse?.totalCount || 0;

  // =========================
  // ACTIVE INGREDIENTS
  // =========================
  const { data: activeIngredientsRes } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const activeIngredientMap = useMemo(() => {
    const map: Record<number, any> = {};
    (activeIngredientsRes?.data || []).forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [activeIngredientsRes]);

  // =========================
  // PATIENT IDS FROM BOTH TABLES
  // =========================
  const patientIds = useMemo(() => {
    return [...orderedRows, ...administeredRows]
      .map(row => row?.patient?.id || row?.patientId)
      .filter(Boolean) as number[];
  }, [orderedRows, administeredRows]);

  const { data: patientsData } = useGetPatientsByIdsQuery(
    { ids: patientIds },
    { skip: !patientIds.length }
  );

  const patientsMap = useMemo(() => {
    const map: Record<number, any> = {};

    (patientsData || []).forEach((p: any) => {
      map[p.id] = p;
    });

    return map;
  }, [patientsData]);

  // =========================
  // LOVS / ENUMS
  // =========================
  const { data: unitLov } = useGetLovValuesByCodeQuery('UOM');
  const { data: frequencyLov } = useGetLovValuesByCodeQuery('MED_FREQUENCY');
  const roaOptions = useEnumOptions('RouteOfAdministration');

  const unitMap = useMemo(() => {
    const map: Record<string, string> = {};
    (unitLov?.object || []).forEach((item: any) => {
      map[String(item.key)] = item.lovDisplayVale;
    });
    return map;
  }, [unitLov]);

  const frequencyMap = useMemo(() => {
    const map: Record<string, string> = {};
    (frequencyLov?.object || []).forEach((item: any) => {
      map[String(item.key)] = item.lovDisplayVale;
    });
    return map;
  }, [frequencyLov]);

  const roaMap = useMemo(() => {
    const map: Record<string, string> = {};
    (roaOptions || []).forEach((item: any) => {
      map[String(item.value)] = item.label;
    });
    return map;
  }, [roaOptions]);

  // =========================
  // MUTATIONS
  // =========================
  const [administerOrder, { isLoading: administering }] =
    useAdministerUccMedicationOrderMutation();

  const [discardOrder, { isLoading: discarding }] =
    useDiscardUccMedicationOrderMutation();

  const [doubleCheckOrder, { isLoading: doubleChecking }] =
    useDoubleCheckUccMedicationOrderMutation();

  // =========================
  // ACTIONS
  // =========================
  const handleAdminister = async (row: MedicationOrderRow) => {
    try {
      const isHighAlert = Boolean(
        row?.isHighAlert ?? activeIngredientMap[row?.activeIngredientId || 0]?.highAlert
      );

      await administerOrder(row.id).unwrap();

      dispatch(
        notify({
          msg: isHighAlert
            ? 'Medication moved to Waiting Double Check successfully'
            : 'Medication administered successfully',
          sev: 'success'
        })
      );

      await refetchOrdered();
      await refetchAdmin();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Administer failed',
          sev: 'error'
        })
      );
    }
  };

  const handleDiscard = async () => {
    if (!selectedRow?.id) return;

    try {
      await discardOrder({
        id: selectedRow.id,
        discardReason: cancelObject.discardReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication discarded successfully',
          sev: 'success'
        })
      );

      setOpenDiscardModal(false);
      setSelectedRow(null);
      setCancelObject({ discardReason: '' });

      await refetchOrdered();
      await refetchAdmin();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Discard failed',
          sev: 'error'
        })
      );
    }
  };

  const handleDoubleCheck = async (row: MedicationOrderRow) => {
    try {
      const currentUser = user?.login || user?.username;

      if (
        row.administeredBy &&
        currentUser &&
        row.administeredBy.toLowerCase() === currentUser.toLowerCase()
      ) {
        dispatch(
          notify({
            msg: 'Double check must be done by another user',
            sev: 'warning'
          })
        );
        return;
      }

      await doubleCheckOrder(row.id!).unwrap();

      dispatch(
        notify({
          msg: 'Medication double checked and administered successfully',
          sev: 'success'
        })
      );

      await refetchOrdered();
      await refetchAdmin();
    } catch (error: any) {
      dispatch(
        notify({
          msg:
            error?.data?.detail ||
            'Double check failed. It must be done by a different user.',
          sev: 'error'
        })
      );
    }
  };

  // =========================
  // PAGINATION HANDLERS
  // =========================
  const handleOrderedPageChange = (_: any, newPage: number) => {
    setOrderedParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleAdminPageChange = (_: any, newPage: number) => {
    setAdminParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleOrderedSortChange = (col: string, type: 'asc' | 'desc') => {
    setOrderedSortColumn(col);
    setOrderedSortType(type);

    setOrderedParams(prev => ({
      ...prev,
      page: 0,
      sort: `${col},${type}`
    }));
  };

  const handleAdminSortChange = (col: string, type: 'asc' | 'desc') => {
    setAdminSortColumn(col);
    setAdminSortType(type);

    setAdminParams(prev => ({
      ...prev,
      page: 0,
      sort: `${col},${type}`
    }));
  };

  // =========================
  // COMMON COLUMNS
  // =========================
  const commonColumns = useMemo(
    () => [
      {
        key: 'patientName',
        title: <Translate>PATIENT NAME</Translate>,
        minWidth: 180,
        render: (row: MedicationOrderRow) => {
          const patient = patientsMap[row?.patient?.id || row?.patientId || 0];
          if (!patient) return ' ';

          return [patient.firstName, patient.secondName, patient.lastName]
            .filter(Boolean)
            .join(' ');
        }
      },
      {
        key: 'prescribedByAt',
        title: <Translate>PRESCRIBED_BY_AT</Translate>,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          formatUserAt(row.submittedBy || row.createdBy, row.submittedDate || row.createdDate)
      },
      {
        key: 'medicationName',
        title: <Translate>MEDICATION NAME</Translate>,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          activeIngredientMap[row?.activeIngredientId || 0]?.name || ' '
      },
      {
        key: 'class',
        title: <Translate>Medication Class</Translate>,
        minWidth: 160,
        render: (row: MedicationOrderRow) => (
          <MedicationClassCell
            drugClassId={activeIngredientMap[row?.activeIngredientId || 0]?.drugClassId}
          />
        )
      },
      {
        key: 'isHighAlert',
        title: <Translate>IS HIGH ALERT</Translate>,
        align: 'center',
        width: 130,
        render: (row: MedicationOrderRow) => {
          const isHighAlert = Boolean(
            row?.isHighAlert ??
              activeIngredientMap[row?.activeIngredientId || 0]?.highAlert
          );

          return isHighAlert ? (
            <FontAwesomeIcon icon={faTriangleExclamation} color="red" />
          ) : (
            ' '
          );
        }
      },
      {
        key: 'instructions',
        title: <Translate>INSTRUCTIONS</Translate>,
        minWidth: 260,
        render: (row: MedicationOrderRow) => (
          <InstructionsCell
            text={row?.instructionText}
            unitMap={unitMap}
            frequencyMap={frequencyMap}
            roaMap={roaMap}
          />
        )
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        minWidth: 140,
        render: (row: any) => formatEnumString(row?.status)
      }
    ],
    [patientsMap, activeIngredientMap, unitMap, frequencyMap, roaMap]
  );

  // =========================
  // ORDERED COLUMNS
  // =========================
  const orderedColumns = useMemo(
    () => [
      ...commonColumns,
      {
        key: 'actions',
        title: <Translate>ACTIONS</Translate>,
        align: 'center',
        width: 140,
        render: (row: MedicationOrderRow) => {
          const canAdminister = row.status === 'SUBMITTED';

          return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <CheckRoundIcon
                className="medication-record-order-icons-size"
                style={{
                  cursor: canAdminister ? 'pointer' : 'not-allowed',
                  opacity: canAdminister ? 1 : 0.4
                }}
                onClick={() => {
                  if (!canAdminister) return;
                  handleAdminister(row);
                }}
              />

              <FontAwesomeIcon
                icon={faXmark}
                className="medication-record-order-icons-size"
                style={{
                  cursor: canAdminister ? 'pointer' : 'not-allowed',
                  opacity: canAdminister ? 1 : 0.4
                }}
                onClick={() => {
                  if (!canAdminister) return;

                  setSelectedRow(row);
                  setCancelObject({ discardReason: '' });
                  setOpenDiscardModal(true);
                }}
              />
            </div>
          );
        }
      }
    ],
    [commonColumns]
  );

  // =========================
  // ADMIN COLUMNS
  // =========================
  const administeredColumns = useMemo(
    () => [
      ...commonColumns,
      {
        key: 'actions',
        title: <Translate>ACTIONS</Translate>,
        align: 'center',
        width: 120,
        render: (row: MedicationOrderRow) => {
          const currentUser = user?.login || user?.username;

          const isSameUser =
            row.administeredBy &&
            currentUser &&
            row.administeredBy.toLowerCase() === currentUser.toLowerCase();

          const canDoubleCheck = row.status === 'WAITING_DOUBLE_CHECK';

          return (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              {canDoubleCheck && (
                <FontAwesomeIcon
                  icon={faCheckDouble}
                  className="medication-record-order-icons-size"
                  style={{
                    cursor: isSameUser ? 'not-allowed' : 'pointer',
                    opacity: isSameUser ? 0.4 : 1
                  }}
                  onClick={() => {
                    if (isSameUser) {
                      dispatch(
                        notify({
                          msg: 'Double check must be done by another user',
                          sev: 'warning'
                        })
                      );
                      return;
                    }

                    handleDoubleCheck(row);
                  }}
                />
              )}
            </div>
          );
        }
      },
      {
        key: 'administeredByAt',
        title: <Translate>ADMINISTERED_BY_AT</Translate>,
        expandable: true,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          formatUserAt(row.administeredBy, row.administeredDate)
      },
      {
        key: 'witnessByAt',
        title: <Translate>WITNESS_BY_AT</Translate>,
        expandable: true,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          formatUserAt(row.doubleCheckedBy, row.doubleCheckedDate)
      },
      {
        key: 'cancelledByAt',
        title: <Translate>CANCELLED_BY_AT</Translate>,
        expandable: true,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          formatUserAt(
            row.cancelledBy || row.discardedBy,
            row.cancelledDate || row.discardedDate
          )
      },
      {
        key: 'cancellationReason',
        title: <Translate>CANCELLATION_REASON</Translate>,
        expandable: true,
        minWidth: 200,
        render: (row: MedicationOrderRow) =>
          row.cancellationReason || row.discardReason || ' '
      }
    ],
    [commonColumns, user, dispatch]
  );

  const tableLoading =
    orderedLoading ||
    orderedFetching ||
    adminLoading ||
    adminFetching ||
    administering ||
    discarding ||
    doubleChecking;

  return (
    <div>
      <div className="medication-record-container-main">
        <SectionContainer
          title="Ordered Medications"
          content={
            <MyTable
              autoHeight
              data={orderedRows}
              columns={orderedColumns}
              loading={tableLoading}
              page={orderedParams.page}
              rowsPerPage={orderedParams.size}
              totalCount={orderedTotalCount}
              onPageChange={handleOrderedPageChange}
              onRowsPerPageChange={(e: any) => {
                const newSize = Number(e.target.value);

                setOrderedParams(prev => ({
                  ...prev,
                  size: newSize,
                  page: 0
                }));
              }}
              onSortChange={handleOrderedSortChange}
              sortColumn={orderedSortColumn}
              sortType={orderedSortType}
            />
          }
        />

        <SectionContainer
          title="Administered Medications"
          content={
            <MyTable
              autoHeight
              data={administeredRows}
              columns={administeredColumns}
              loading={tableLoading}
              page={adminParams.page}
              rowsPerPage={adminParams.size}
              totalCount={administeredTotalCount}
              onPageChange={handleAdminPageChange}
              onRowsPerPageChange={(e: any) => {
                const newSize = Number(e.target.value);

                setAdminParams(prev => ({
                  ...prev,
                  size: newSize,
                  page: 0
                }));
              }}
              onSortChange={handleAdminSortChange}
              sortColumn={adminSortColumn}
              sortType={adminSortType}
            />
          }
        />
      </div>

      <CancellationModal
        open={openDiscardModal}
        setOpen={setOpenDiscardModal}
        handleCancle={handleDiscard}
        object={cancelObject}
        setObject={setCancelObject}
        fieldName="discardReason"
        fieldLabel="DISCARD_REASON"
        title="Discard Medication"
        required={true}
      />
    </div>
  );
  };

export default MedicationRecord;