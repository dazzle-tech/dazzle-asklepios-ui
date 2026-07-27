import React, { useMemo, useState } from 'react';
import xTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
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
import { useGetPatientsByIdsQuery, useLazyGetPatientsByFullNameQuery } from '@/services/patient/patientService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import './styles.less';
import CancellationModal from '@/components/CancellationModal';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { skipToken } from '@reduxjs/toolkit/query';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import MyNestedTable from '@/components/MyNestedTable';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';

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

  medications?: MedicationOrderRow[];
};

type MedicationPatientRow = {
  patientId?: number;
  patient?: {
    id?: number;
  };
  medications: MedicationOrderRow[];
};

const UserFullName = ({ login }: { login?: string }) => {
  const { data } = useGetUserFullNameByLoginQuery(
    login || skipToken
  );

  return <>{data || login || '-'}</>;
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

const formatDate = (date: any) => {
  if (!date) return undefined;

  const d = date instanceof Date ? date : new Date(date);

  if (isNaN(d.getTime())) return undefined;

  return d.toISOString().split('T')[0];
};

const MedicationRecord = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state: any) => state?.auth?.user);


  const today = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const [getPatientsByFullName] =
    useLazyGetPatientsByFullNameQuery();

  const [searchRecord, setSearchRecord] = useState({
    patientName: '',
    activeIngredientId: null,
    orderDateFrom: weekAgo,
    orderDateTo: today
  });

  const [appliedFilters, setAppliedFilters] = useState<{
    patientIds?: number[];
    activeIngredientId?: number | null;
    orderDateFrom?: Date | null;
    orderDateTo?: Date | null;
  }>({
    orderDateFrom: weekAgo,
    orderDateTo: today
  });
  const [openDiscardModal, setOpenDiscardModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState<MedicationOrderRow | null>(null);
  const [cancelObject, setCancelObject] = useState({
    discardReason: ''
  });

  const [orderedParams, setOrderedParams] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc'
  });

  const [orderedSortColumn, setOrderedSortColumn] = useState('createdDate');
  const [orderedSortType, setOrderedSortType] = useState<'asc' | 'desc'>('desc');

  const [adminParams, setAdminParams] = useState({
    page: 0,
    size: 5,
    sort: 'createdDate,desc'
  });




  const [adminSortColumn, setAdminSortColumn] = useState('createdDate');
  const [adminSortType, setAdminSortType] = useState<'asc' | 'desc'>('desc');

  const {
    data: orderedResponse,
    isLoading: orderedLoading,
    isFetching: orderedFetching,
    refetch: refetchOrdered
  } = useFilterUccMedicationOrdersQuery({
    page: orderedParams.page,
    size: orderedParams.size,
    sort: orderedParams.sort,

    patientIds: appliedFilters?.patientIds,
    activeIngredientId:
      appliedFilters?.activeIngredientId ?? undefined,

    orderDateFrom: formatDate(appliedFilters?.orderDateFrom),
    orderDateTo: formatDate(appliedFilters?.orderDateTo),
    statusIn: ['SUBMITTED']
  });

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


  const handleSearch = async () => {
    let patientIds: number[] | undefined;

    if (searchRecord.patientName?.trim()) {
      const result = await getPatientsByFullName({
        keyword: searchRecord.patientName.trim(),
        page: 0,
        size: 1000
      }).unwrap();

      patientIds = result.data.map(patient => patient.id);
    }

    setAppliedFilters({
      patientIds,
      activeIngredientId:
        searchRecord.activeIngredientId || undefined,
      orderDateFrom:
        searchRecord.orderDateFrom || undefined,
      orderDateTo:
        searchRecord.orderDateTo || undefined
    });

    setOrderedParams(prev => ({
      ...prev,
      page: 0
    }));
  };


  const orderedRows: MedicationOrderRow[] = useMemo(() => {
    return (orderedResponse?.data || [])
      .filter((r: any) => r?.id)
      .map((r: any) => ({
        ...r,
        id: r.id as number
      }));
  }, [orderedResponse]);

  const orderedDisplayRows = useMemo(() => {
    const grouped = new Map<number, MedicationPatientRow>();

    orderedRows.forEach(row => {
      const patientId = row.patient?.id || row.patientId;

      if (!patientId) return;

      if (!grouped.has(patientId)) {
        grouped.set(patientId, {
          patientId,
          patient: row.patient,
          medications: []
        });
      }

      grouped.get(patientId)!.medications.push(row);
    });

    return Array.from(grouped.values());
  }, [orderedRows]);


  const administeredRows: MedicationOrderRow[] = useMemo(() => {
    return (adminResponse?.data || [])
      .filter((r: any) => r?.id)
      .map((r: any) => ({
        ...r,
        id: r.id as number
      }));
  }, [adminResponse]);

  const administeredDisplayRows = useMemo(() => {
    const grouped = new Map<number, MedicationPatientRow>();

    administeredRows.forEach(row => {
      const patientId = row.patient?.id || row.patientId;

      if (!patientId) return;

      if (!grouped.has(patientId)) {
        grouped.set(patientId, {
          patientId,
          patient: row.patient,
          medications: []
        });
      }

      grouped.get(patientId)!.medications.push(row);
    });

    return Array.from(grouped.values());
  }, [administeredRows]);

  const orderedTotalCount = orderedResponse?.totalCount || 0;
  const administeredTotalCount = adminResponse?.totalCount || 0;

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

  const activeIngredients =
    activeIngredientsRes?.data ?? [];

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

  const patientColumns = useMemo(
    () => [
      {
        key: 'patientName',
        title: <Translate>PATIENT_NAME</Translate>,
        minWidth: 200,
        render: (row: MedicationPatientRow) => {
          const patient =
            patientsMap[row.patientId || 0];

          if (!patient) return '-';

          return [
            patient.firstName,
            patient.secondName,
            patient.lastName
          ]
            .filter(Boolean)
            .join(' ');
        }
      }
    ],
    [patientsMap]
  );

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

  const [administerOrder, { isLoading: administering }] =
    useAdministerUccMedicationOrderMutation();

  const [discardOrder, { isLoading: discarding }] =
    useDiscardUccMedicationOrderMutation();

  const [doubleCheckOrder, { isLoading: doubleChecking }] =
    useDoubleCheckUccMedicationOrderMutation();

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

  const nestedMedicationColumns = useMemo(
    () => [
      {
        key: 'medicationName',
        title: <Translate>MEDICATION NAME</Translate>,
        minWidth: 180,
        render: (row: MedicationOrderRow) =>
          activeIngredientMap[row?.activeIngredientId || 0]?.name || '-'
      },
      {
        key: 'class',
        title: <Translate>MEDICATION CLASS</Translate>,
        minWidth: 160,
        render: (row: MedicationOrderRow) => (
          <MedicationClassCell
            drugClassId={
              activeIngredientMap[row?.activeIngredientId || 0]?.drugClassId
            }
          />
        )
      },
      {
        key: 'prescribedByAt',
        title: <Translate>PRESCRIBED_BY_AT</Translate>,
        minWidth: 180,
        render: (row: MedicationOrderRow) => (
          <>
            <UserFullName login={row.createdBy} />
            <br />
            <span className="date-table-style">
              {row.createdDate
                ? formatDateWithoutSeconds(row.createdDate)
                : '-'}
            </span>
          </>
        )
      },
      {
        key: 'instructions',
        title: <Translate>INSTRUCTIONS</Translate>,
        minWidth: 260,
        render: (row: MedicationOrderRow) => (
          <InstructionsCell
            text={row.instructionText}
            unitMap={unitMap}
            frequencyMap={frequencyMap}
            roaMap={roaMap}
          />
        )
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        minWidth: 120,
        render: (row: any) =>
          formatEnumString(row.status)
      },
      {
        key: 'actions',
        title: <Translate>ACTIONS</Translate>,
        width: 120,
        align: 'center',
        render: (row: MedicationOrderRow) => {

          if (row.status === 'SUBMITTED') {
            return (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 12
                }}
              >

                <CheckRoundIcon
                  className="medication-record-order-icons-size"
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() => handleAdminister(row)}
                />

                <FontAwesomeIcon
                  icon={faXmark}
                  className="medication-record-order-icons-size"
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    setSelectedRow(row);
                    setCancelObject({
                      discardReason: ''
                    });
                    setOpenDiscardModal(true);
                  }}
                />

              </div>
            );
          }


          if (row.status === 'WAITING_DOUBLE_CHECK') {

            const currentUser = user?.login || user?.username;

            const isSameUser =
              row.administeredBy &&
              currentUser &&
              row.administeredBy.toLowerCase() ===
              currentUser.toLowerCase();


            return (
              <FontAwesomeIcon
                icon={faCheckDouble}
                className="medication-record-order-icons-size"
                style={{
                  cursor: isSameUser
                    ? 'not-allowed'
                    : 'pointer',
                  opacity: isSameUser ? 0.4 : 1
                }}
                onClick={() => {
                  if (isSameUser) {
                    dispatch(
                      notify({
                        msg:
                          'Double check must be done by another user',
                        sev: 'warning'
                      })
                    );
                    return;
                  }

                  handleDoubleCheck(row);
                }}
              />
            );
          }


          return null;
        }
      }

    ],
    [
      activeIngredientMap,
      roaMap,
      frequencyMap,
      unitMap,
      user,
      dispatch
    ]
  );

  const tableLoading =
    orderedLoading ||
    orderedFetching ||
    adminLoading ||
    adminFetching ||
    administering ||
    discarding ||
    doubleChecking;

  const filters = (
    <div>
      <Form fluid className="medication-record-search-form">
        <MyInput
          fieldName="patientName"
          record={searchRecord}
          setRecord={setSearchRecord}
          width={180}
        />

        <MyInput
          fieldName="orderDateFrom"
          fieldType="date"
          record={searchRecord}
          setRecord={setSearchRecord}
          width={150}
        />

        <MyInput
          fieldName="orderDateTo"
          fieldType="date"
          record={searchRecord}
          setRecord={setSearchRecord}
          width={150}
        />

        <MyInput
          fieldName="activeIngredientId"
          fieldType="select"
          record={searchRecord}
          setRecord={setSearchRecord}
          selectData={activeIngredients}
          selectDataLabel="name"
          selectDataValue="id"
          width={220}
        />

        <MyButton
          appearance="primary"
          onClick={handleSearch}
        >
          <Translate>SEARCH</Translate>
        </MyButton>
        <MyButton
          appearance="subtle"
          onClick={() => {
            setSearchRecord({
              patientName: '',
              activeIngredientId: null,
              orderDateFrom: weekAgo,
              orderDateTo: today
            });

            setAppliedFilters({
              orderDateFrom: weekAgo,
              orderDateTo: today
            });

            setOrderedParams(prev => ({
              ...prev,
              page: 0
            }));
          }}
        >
          <Translate>CLEAR</Translate>
        </MyButton>
      </Form>
    </div>)


  return (
    <div>
      <div className="medication-record-container-main">
        <SectionContainer
          title="Ordered Medications"
          action={filters}
          content={
            <MyNestedTable
              enableRowSelection
              autoHeight
              data={orderedDisplayRows}
              columns={patientColumns}
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
              getNestedTable={(row) => ({
                columns: nestedMedicationColumns,
                data: row.medications || []
              })}
            />
          }
        />

        <SectionContainer
          title="Administered Medications"
          content={
            <MyNestedTable
              enableRowSelection
              autoHeight
              data={administeredDisplayRows}
              columns={patientColumns}
              loading={tableLoading}
              page={adminParams.page}
              rowsPerPage={adminParams.size}
              totalCount={administeredTotalCount}
              onPageChange={handleAdminPageChange}
              getNestedTable={(row) => ({
                columns: nestedMedicationColumns,
                data: row.medications || []
              })}
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