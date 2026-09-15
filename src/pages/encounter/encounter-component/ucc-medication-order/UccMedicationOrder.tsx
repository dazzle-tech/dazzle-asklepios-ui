import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import UccMedicationOrderAddModal from './UccMedicationOrderAddModal';
import CancellationModal from '@/components/CancellationModal';
import PlusIcon from '@rsuite/icons/Plus';
import { Checkbox, Tooltip, Whisper } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { faPenToSquare, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useEnumOptions } from '@/services/enumsApi';
import {
  useFilterGroupedUccMedicationOrdersQuery,
  useSubmitUccMedicationOrderGroupMutation,
  useCancelUccMedicationOrderMutation,
  useCreateUccMedicationOrderMutation,
  useUpdateUccMedicationOrderMutation,
  useSubmitUccMedicationOrderMutation
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';
import { formatEnumString } from '@/utils';
import clsx from 'clsx';
import './styles.less';

const UccMedicationOrder = (props: any) => {
  const location = useLocation();
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const viewMode = location.state?.viewMode;
  const edit = viewMode === 'readOnly';
  const dispatch = useAppDispatch();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null);
  const [editRow, setEditRow] = useState<any>(null);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 10,
    sort: 'createdDate,desc'
  });

  const [sortColumn, setSortColumn] = useState('createdDate');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('desc');

  const { data: unitLov } = useGetLovValuesByCodeQuery('UOM');
  const roaOptions = useEnumOptions('RouteOfAdministration');

  const [cancelObject, setCancelObject] = useState({ cancelReason: '' });

const {
  data: ordersResponse,
  isLoading,
  isFetching,
  refetch
} = useFilterGroupedUccMedicationOrdersQuery(
  {
    encounterId: encounter?.id,
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  },
  { skip: !encounter?.id }
);
  const [submitOrderGroup] = useSubmitUccMedicationOrderGroupMutation();
  const [submitOrder] = useSubmitUccMedicationOrderMutation();
  const [cancelOrder] = useCancelUccMedicationOrderMutation();
  const [createOrder] = useCreateUccMedicationOrderMutation();
  const [updateOrder] = useUpdateUccMedicationOrderMutation();

  const { data: activeIngredientsAll } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const rows = ordersResponse?.data || [];
  const totalCount = ordersResponse?.totalCount || 0;

  const ingredientMap = useMemo(() => {
    const map: Record<number, any> = {};
    (activeIngredientsAll?.data || []).forEach((item: any) => {
      map[item.id] = item;
    });
    return map;
  }, [activeIngredientsAll]);

  const handleAdd = async (data: any) => {
    try {
      if (data?.isEdit && data?.id) {
        const { id, isEdit, ...payload } = data;

const updatePayload = {
  id,
  activeIngredientId: payload.activeIngredientId,
  instructionType: payload.instructionType,
  instructionText: payload.instructionText,
  dose: payload.dose,
  doseUnit: payload.doseUnit,
  route: payload.route,
  frequencyNumber: payload.frequencyNumber,
  frequencyUnit: payload.frequencyUnit,
  duration: payload.duration,
  startTime: payload.startTime
};
        await updateOrder({
          id,
          data: updatePayload
        }).unwrap();

        dispatch(
          notify({
            msg: 'Medication Updated Successfully',
            sev: 'success'
          })
        );
      } else {
        await createOrder(data).unwrap();
        dispatch(
          notify({
            msg: 'Medication Added Successfully',
            sev: 'success'
          })
        );
      }

      setOpenAdd(false);
      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || 'Operation failed',
          sev: 'error'
        })
      );
    }
  };

  const handleSubmit = async (row: any) => {
    try {
      await submitOrderGroup({
        orderGroupId: row.orderGroupId,
        isHighAlert: !!row.isHighAlert
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication Order Submitted Successfully',
          sev: 'success'
        })
      );

      setSelectedIds(prev =>
        prev.filter(id => id !== row.orderGroupId)
      );

      await refetch();
    } catch (error: any) {
      console.log(error);

      dispatch(
        notify({
          msg: error?.data?.detail || 'Submit failed',
          sev: 'error'
        })
      );
    }
  };

  const handleCancel = async () => {
    if (!selectedCancelId) return;

    if (!cancelObject.cancelReason?.trim()) {
      dispatch(notify({ msg: 'Please enter a cancellation reason', sev: 'warning' }));
      return;
    }

    try {
      await cancelOrder({
        id: selectedCancelId,
        cancellationReason: cancelObject.cancelReason.trim()
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication Cancelled Successfully',
          sev: 'success'
        })
      );
      setOpenCancel(false);
      setSelectedCancelId(null);
      setCancelObject({ cancelReason: '' });
      await refetch();
    } catch {
      dispatch(notify({ msg: 'Cancel failed', sev: 'error' }));
    }
  };

  const selectableRows = rows.filter((r: any) => r?.status === 'NEW');
  const selectableIds = selectableRows.map((r: any) => r.id);

  const isAllSelected =
    selectableIds.length > 0 && selectableIds.every(id => selectedIds.includes(id));

  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableIds : []);
  };

  const toggleRow = (row: any, checked: boolean) => {
    if (row?.status !== 'NEW') return;
    setSelectedIds(prev => (checked ? [...prev, row.id] : prev.filter(id => id !== row.id)));
  };

  const handlePageChange = (_: any, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));

    setSelectedIds([]);
  };

  const handleSortChange = (col: string, type: 'asc' | 'desc') => {
    setSortColumn(col);
    setSortType(type);

    setPaginationParams(prev => ({
      ...prev,
      page: 0,
      sort: `${col},${type}`
    }));
  };

  const unitMap = useMemo(() => {
    const map: Record<string, string> = {};
    (unitLov?.object || []).forEach((item: any) => {
      map[item.key] = item.lovDisplayVale;
    });
    return map;
  }, [unitLov]);


  const roaMap = useMemo(() => {
    const map: Record<string, string> = {};
    (roaOptions || []).forEach((item: any) => {
      map[item.value] = item.label;
    });
    return map;
  }, [roaOptions]);

  const columns = [
    {
      key: 'medicationName',
      title: <Translate>MEDICATION NAME</Translate>,
      flexGrow: 2,
      render: (row: any) => ingredientMap[row?.activeIngredientId]?.name || '-'
    },
    {
      key: 'highAlert',
      title: <Translate>HIGH ALERT</Translate>,
      align: 'center',
      width: 120,
      render: (row: any) =>
        ingredientMap[row?.activeIngredientId]?.highAlert && (
          <FontAwesomeIcon icon={faTriangleExclamation} color="red" />
        )
    },
    {
      key: 'instructions',
      title: <Translate>INSTRUCTIONS</Translate>,
      flexGrow: 2,
      render: (row: any) => {
        if (!row?.instructionText) return '-';

        const parts = row.instructionText.split(',').map((p: string) => p.trim());

        return parts
          .map((part: string, index: number) => {
            if (index === 1) return unitMap[part] || part;
            if (index === 3) return roaMap[part] || part;
            return part;
          })
          .join(', ');
      }
    },
    {
      key: 'status',
      title: <Translate>STATUS</Translate>,
      align: 'center',
      width: 120,
      render: (row: any) => formatEnumString(row?.status)
    },
    {
      key: 'createdByAt',
      title: <Translate>CREATED BY/AT</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (row: any) => (
        <div>
          <div>{row?.createdByFullName || row?.createdBy || '-'}</div>
          <div className="text-muted small">
            {row?.createdDate
              ? new Date(row.createdDate).toLocaleString()
              : '-'}
          </div>
        </div>
      )
    },
    {
      key: 'discardByAt',
      title: <Translate>DISCARD BY/AT</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (row: any) => (
        <div>
          <div>{row?.discardedByFullName || row?.discardedBy || '-'}</div>
          <div className="text-muted small">
            {row?.discardedDate
              ? new Date(row.discardedDate).toLocaleString()
              : '-'}
          </div>
        </div>
      )
    },
    {
      key: 'discardReason',
      title: <Translate>DISCARD REASON</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (row: any) => row?.discardReason || '-'
    },
    {
      key: 'cancelByAt',
      title: <Translate>CANCEL BY/AT</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (row: any) => (
        <div>
          <div>{row?.cancelledByFullName || row?.cancelledBy || '-'}</div>
          <div className="text-muted small">
            {row?.cancelledDate
              ? new Date(row.cancelledDate).toLocaleString()
              : '-'}
          </div>
        </div>
      )
    },
    {
      key: 'cancellationReason',
      title: <Translate>CANCELLATION REASON</Translate>,
      flexGrow: 2,
      expandable: true,
      render: (row: any) => row?.cancellationReason || '-'
    },
    {
      key: 'actions',
      title: <Translate>ACTIONS</Translate>,
      align: 'center',
      width: 120,
      render: (row: any) => (
        <div style={{ display: 'flex', gap: 10 }}>
          <Whisper
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Edit</Translate>
              </Tooltip>
            }
          >
            <FontAwesomeIcon
              icon={faPenToSquare}
              className="ucc-medication-order-icons-size"
              style={{
                cursor: row?.status === 'NEW' ? 'pointer' : 'not-allowed',
                opacity: row?.status === 'NEW' ? 1 : 0.4
              }}
              onClick={() => {
                if (row?.status !== 'NEW') return;
                setEditRow(row);

                setTimeout(() => {
                  setOpenAdd(true);
                }, 0);
              }}
            />
          </Whisper>

          <Whisper
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Submit</Translate>
              </Tooltip>
            }
          >
            <CheckRoundIcon
            className="ucc-medication-order-icons-size"
            style={{
              cursor: row?.status === 'NEW' ? 'pointer' : 'not-allowed',
              opacity: row?.status === 'NEW' ? 1 : 0.4
            }}
            onClick={() => {
              if (row?.status !== 'NEW') return;
              handleSubmit(row);
            }}
          />
          </Whisper>

          <Whisper
            placement="top"
            speaker={
              <Tooltip>
                <Translate>Cancel</Translate>
              </Tooltip>
            }
          >
            <WarningRoundIcon
            className="ucc-medication-order-icons-size"
            style={{
              cursor: row?.status === 'NEW' ? 'pointer' : 'not-allowed',
              opacity: row?.status === 'NEW' ? 1 : 0.4
            }}
            onClick={() => {
              if (row?.status !== 'NEW') return;
              setSelectedCancelId(row.id);
              setOpenCancel(true);
            }}
          />
          </Whisper>
        </div>
      )
    }
  ];

  
  return (
    <div className={clsx({ 'disabled-panel': edit })} style={edit ? { pointerEvents: 'none', opacity: 0.6 } : {}}>
      <MyTable
        height={450}
        data={rows}
        totalCount={totalCount}
        loading={isLoading || isFetching}
        columns={columns}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        tableButtons={
          <MyButton onClick={() => setOpenAdd(true)} prefixIcon={() => <PlusIcon />}>
            Add
          </MyButton>
        }
        onPageChange={handlePageChange}
        onRowsPerPageChange={(e: any) => {
          const newSize = Number(e.target.value);

          setPaginationParams(prev => ({
            ...prev,
            size: newSize,
            page: 0
          }));

          setSelectedIds([]);
        }}
        onSortChange={handleSortChange}
        sortColumn={sortColumn}
        sortType={sortType}
      />

      <UccMedicationOrderAddModal
        open={openAdd}
        setOpen={val => {
          setOpenAdd(val);
          if (!val) setEditRow(null);
        }}
        onAdd={handleAdd}
        encounter={encounter}
        patient={patient}
        editRow={editRow}
      />

      <CancellationModal
        open={openCancel}
        setOpen={setOpenCancel}
        handleCancle={handleCancel}
        object={cancelObject}
        setObject={setCancelObject}
        fieldName="cancelReason"
        fieldLabel="CANCELLATION_REASON"
        title="Cancel Medication"
        required
      />
    </div>
  );
};

export default UccMedicationOrder;
