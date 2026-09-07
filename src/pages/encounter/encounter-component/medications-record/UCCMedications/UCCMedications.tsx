import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import SectionContainer from '@/components/SectionsoContainer';
import Translate from '@/components/Translate';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { formatDateWithoutSeconds, formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckDouble,
  faXmark
} from '@fortawesome/free-solid-svg-icons';
import CheckRoundIcon from '@rsuite/icons/CheckRound';

import { useGetMedicationCategoryClassByClassIdQuery } from '@/services/setup/medication-categories/MedicationCategoriesClassService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';

import {
  useFilterUccMedicationOrdersQuery,
  useDiscardUccMedicationOrderMutation,
  useDoubleCheckUccMedicationOrderMutation
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';

import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
// import './styles.less';
import CancellationModal from '@/components/CancellationModal';
import { useGetUserFullNameByLoginQuery } from '@/services/userService';
import { skipToken } from '@reduxjs/toolkit/query';
import MedicationAdministrationModal from '@/pages/encounter/urgent-care/MedicationAdministrationModal';
import MedicationAdministrationLogs from '@/pages/encounter/urgent-care/MedicationAdministrationLogs';
import { Tooltip, Whisper } from 'rsuite';

type Props = {
  patient: any;
};

type MedicationOrderRow = {
  id: number;
  patientId?: number;
  patient?: {
    id?: number;
  };

  activeIngredientId?: number;
  instructionText?: string;
  status?: string;
  isHighAlert?: boolean;

  createdBy?: string;
  createdDate?: string;

  administeredBy?: string;
  administeredDate?: string;

  cancelledBy?: string;
  cancelledDate?: string;
  cancellationReason?: string;

  medications?: MedicationOrderRow[];
};

const UserFullName = ({ login }: { login?: string }) => {
  const { data } = useGetUserFullNameByLoginQuery(
    login || skipToken
  );

  return <>{data || login || '-'}</>;
};

const MedicationClassCell = ({
  drugClassId
}: {
  drugClassId?: number;
}) => {
  const { data } =
    useGetMedicationCategoryClassByClassIdQuery(
      drugClassId as number,
      {
        skip: !drugClassId
      }
    );

  return <>{data?.name || '-'}</>;
};

const InstructionsCell = ({
  text,
  unitMap,
  frequencyMap,
  roaMap
}: any) => {
  const parsed = useMemo(() => {
    if (!text) return '-';

    const parts = text.split(',').map((x: string) => x.trim());

    return parts
      .map((part: string, index: number) => {
        if (index === 1) return unitMap[part] || part;
        if (index === 2) return frequencyMap[part] || part;
        if (index === 3) return roaMap[part] || part;
        return part;
      })
      .join(', ');
  }, [text]);

  return <>{parsed}</>;
};

const formatDate = (date: any) => {
  if (!date) return undefined;

  const d = new Date(date);

  if (isNaN(d.getTime())) return undefined;

  return d.toISOString().split('T')[0];
};

const UCCMedications = ({ patient }: Props) => {
  const dispatch = useAppDispatch();
  const [administrationModalOpen, setAdministrationModalOpen] =
    useState(false);

  const [selectedOrderId, setSelectedOrderId] =
    useState<number | null>(null);
  const user = useAppSelector(
    (state: any) => state.auth.user
  );

  const today = new Date();

  const weekAgo = new Date();
  weekAgo.setDate(today.getDate() - 7);

  const [orderedParams, setOrderedParams] = useState({
    page: 0,
    size: 10,
    sort: 'createdDate,desc'
  });

  const [adminParams, setAdminParams] = useState({
    page: 0,
    size: 10,
    sort: 'createdDate,desc'
  });

  const {
    data: orderedResponse,
    isLoading: orderedLoading,
    isFetching: orderedFetching,
    refetch: refetchOrdered
  } = useFilterUccMedicationOrdersQuery({
    page: orderedParams.page,
    size: orderedParams.size,
    sort: orderedParams.sort,

    patientIds: patient?.id ? [patient.id] : undefined,

    orderDateFrom: formatDate(weekAgo),
    orderDateTo: formatDate(today),

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

    patientIds: patient?.id ? [patient.id] : undefined,

    statusIn: [
      'ADMINISTERED',
      'WAITING_DOUBLE_CHECK',
      'DISCARDED'
    ]
  });

  const orderedRows = orderedResponse?.data || [];
  const administeredRows = adminResponse?.data || [];
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

  const activeIngredients = activeIngredientsRes?.data || [];

  const { data: unitLov } =
    useGetLovValuesByCodeQuery('UOM');

  const { data: frequencyLov } =
    useGetLovValuesByCodeQuery('MED_FREQUENCY');

  const roaOptions =
    useEnumOptions('RouteOfAdministration');

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



  const [
    discardOrder,
    { isLoading: discarding }
  ] = useDiscardUccMedicationOrderMutation();

  const [
    doubleCheckOrder,
    { isLoading: doubleChecking }
  ] = useDoubleCheckUccMedicationOrderMutation();

  const [openDiscardModal, setOpenDiscardModal] =
    useState(false);

  const [selectedRow, setSelectedRow] =
    useState<MedicationOrderRow | null>(null);

  const [cancelObject, setCancelObject] =
    useState({
      discardReason: ''
    });


  const handleDiscard = async () => {
    if (!selectedRow) return;

    try {
      await discardOrder({
        id: selectedRow.id,
        discardReason:
          cancelObject.discardReason
      }).unwrap();

      dispatch(
        notify({
          msg:
            'Medication discarded successfully',
          sev: 'success'
        })
      );

      setOpenDiscardModal(false);
      refetchOrdered();
      refetchAdmin();
    } catch (e: any) {
      dispatch(
        notify({
          msg:
            e?.data?.detail ||
            'Discard failed',
          sev: 'error'
        })
      );
    }
  };

  const handleDoubleCheck = async (
    row: MedicationOrderRow
  ) => {
    try {
      await doubleCheckOrder(row.id).unwrap();

      dispatch(
        notify({
          msg:
            'Medication double checked successfully',
          sev: 'success'
        })
      );

      refetchOrdered();
      refetchAdmin();
    } catch (e: any) {
      dispatch(
        notify({
          msg:
            e?.data?.detail ||
            'Double check failed',
          sev: 'error'
        })
      );
    }
  };

  const nestedMedicationColumns = [
    {
      key: 'medication',
      title: (
        <Translate>MEDICATION_NAME</Translate>
      ),
      minWidth: 220,
      render: (row: MedicationOrderRow) =>
        activeIngredientMap[
          row.activeIngredientId || 0
        ]?.name || '-'
    },
    {
      key: 'class',
      title: (
        <Translate>CLASS</Translate>
      ),
      minWidth: 180,
      render: (row: MedicationOrderRow) => (
        <MedicationClassCell
          drugClassId={
            activeIngredientMap[
              row.activeIngredientId || 0
            ]?.drugClassId
          }
        />
      )
    },
    {
      key: 'instructions',
      title: (
        <Translate>INSTRUCTIONS</Translate>
      ),
      minWidth: 300,
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
      key: 'prescribed',
      title: (
        <Translate>PRESCRIBED_BY_AT</Translate>
      ),
      minWidth: 220,
      render: (row: MedicationOrderRow) => (
        <>
          <UserFullName
            login={row.createdBy}
          />
          <br />
          {row.createdDate &&
            formatDateWithoutSeconds(
              row.createdDate
            )}
        </>
      )
    },
    {
      key: 'status',
      title: (
        <Translate>STATUS</Translate>
      ),
      minWidth: 140,
      render: (row: MedicationOrderRow) =>
        formatEnumString(row.status)
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      width: 120,
      align: 'center',
      render: (row: MedicationOrderRow) => {
        return (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 12
            }}
          >
            {row.status === 'SUBMITTED' && (
              <>
                <Whisper
                  placement="top"
                  speaker={
                    <Tooltip>
                      <Translate>Administer</Translate>
                    </Tooltip>
                  }
                >
                  <CheckRoundIcon
                    className="medication-record-order-icons-size"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedOrderId(row.id);
                      setAdministrationModalOpen(true);
                    }}
                  />
                </Whisper>


                <Whisper
                  placement="top"
                  speaker={
                    <Tooltip>
                      <Translate>Discard</Translate>
                    </Tooltip>
                  }
                >
                  <FontAwesomeIcon
                    icon={faXmark}
                    className="medication-record-order-icons-size"
                    style={{ cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedRow(row);
                      setCancelObject({
                        discardReason: ''
                      });
                      setOpenDiscardModal(true);
                    }}
                  />
                </Whisper>

              </>
            )}

            {row.status === 'WAITING_DOUBLE_CHECK' && (
              <Whisper
                placement="top"
                speaker={
                  <Tooltip>
                    <Translate>Double Check</Translate>
                  </Tooltip>
                }
              >
                <FontAwesomeIcon
                  icon={faCheckDouble}
                  className="medication-record-order-icons-size"
                  style={{
                    cursor: 'pointer'
                  }}
                  onClick={() => handleDoubleCheck(row)}
                />
              </Whisper>

            )}

            <MedicationAdministrationLogs
              order={row}
            />
          </div>
        );
      }
    }
  ];

  const tableLoading =
    orderedLoading ||
    orderedFetching ||
    adminLoading ||
    adminFetching ||

    discarding ||
    doubleChecking;

  console.log('patient', patient);
  console.log('patient.id', patient?.id);
  console.log('patient.key', patient?.key);


  return (
    <>
      <SectionContainer
        title="Ordered Medications"
        content={
          <MyTable
            autoHeight
            data={orderedRows}
            columns={nestedMedicationColumns}
            loading={tableLoading}
            page={orderedParams.page}
            rowsPerPage={orderedParams.size}
            totalCount={
              orderedResponse?.totalCount || 0
            }
            onPageChange={(_, page) =>
              setOrderedParams(prev => ({
                ...prev,
                page
              }))
            }
            onRowsPerPageChange={(e: any) =>
              setOrderedParams(prev => ({
                ...prev,
                page: 0,
                size: Number(e.target.value)
              }))
            }
          />
        }
      />

      <SectionContainer
        title="Administered Medications"
        content={
          <MyTable
            autoHeight
            data={administeredRows}
            columns={nestedMedicationColumns}
            loading={tableLoading}
            page={adminParams.page}
            rowsPerPage={adminParams.size}
            totalCount={
              adminResponse?.totalCount || 0
            }
            onPageChange={(_, page) =>
              setAdminParams(prev => ({
                ...prev,
                page
              }))
            }
            onRowsPerPageChange={(e: any) =>
              setAdminParams(prev => ({
                ...prev,
                page: 0,
                size: Number(e.target.value)
              }))
            }
          />
        }
      />
      <MedicationAdministrationModal
        orderId={selectedOrderId}
        open={administrationModalOpen}
        setOpen={setAdministrationModalOpen}
        onSuccess={async () => {
          await refetchOrdered();
          await refetchAdmin();
        }}
      />
      <CancellationModal
        open={openDiscardModal}
        setOpen={setOpenDiscardModal}
        handleCancle={handleDiscard}
        object={cancelObject}
        setObject={setCancelObject}
        fieldName="discardReason"
        fieldLabel="DISCARD_REASON"
        title="Discard Medication"
        required
      />
    </>
  );
};

export default UCCMedications;