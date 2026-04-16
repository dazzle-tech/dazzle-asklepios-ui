import React, { useMemo, useState } from 'react';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import Translate from '@/components/Translate';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import UccMedicationOrderAddModal from './UccMedicationOrderAddModal';
import CancellationModal from '@/components/CancellationModal';
import PlusIcon from '@rsuite/icons/Plus';
import { Checkbox } from 'rsuite';
import CheckRoundIcon from '@rsuite/icons/CheckRound';
import WarningRoundIcon from '@rsuite/icons/WarningRound';
import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLocation } from 'react-router-dom';

import {
  useFilterUccMedicationOrdersQuery,
  useSubmitUccMedicationOrderMutation,
  useCancelUccMedicationOrderMutation,
  useCreateUccMedicationOrderMutation
} from '@/services/medicalsheetsEncounter/uccMedicationOrder/uccMedicationOrderService';
import { useGetActiveIngredientsQuery } from '@/services/setup/activeIngredients/activeIngredientsService';

const UccMedicationOrder = (props: any) => {
  const location = useLocation();
  const patient = props.patient || location.state?.patient;
  const encounter = props.encounter || location.state?.encounter;
  const dispatch = useAppDispatch();

  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [openAdd, setOpenAdd] = useState(false);
  const [openCancel, setOpenCancel] = useState(false);
  const [selectedCancelId, setSelectedCancelId] = useState<number | null>(null);

  const [cancelObject, setCancelObject] = useState({
    cancelReason: ''
  });

  const {
    data: ordersResponse,
    isLoading,
    isFetching,
    refetch
  } = useFilterUccMedicationOrdersQuery(
    {
      encounterId: encounter?.id,
      page: 0,
      size: 10,
      sort: 'createdDate,desc'
    },
    { skip: !encounter?.id }
  );

  const [submitOrder] = useSubmitUccMedicationOrderMutation();
  const [cancelOrder] = useCancelUccMedicationOrderMutation();
  const [createOrder] = useCreateUccMedicationOrderMutation();

  const { data: activeIngredientsAll } = useGetActiveIngredientsQuery({
    page: 0,
    size: 1000
  });

  const rows = useMemo<any[]>(() => {
    if (Array.isArray(ordersResponse)) return ordersResponse;
    if (Array.isArray(ordersResponse?.data)) return ordersResponse.data;
    if (Array.isArray((ordersResponse as any)?.content)) return (ordersResponse as any).content;
    if (Array.isArray((ordersResponse as any)?.data?.content)) return (ordersResponse as any).data.content;
    return [];
  }, [ordersResponse]);

  const ingredientMap = useMemo(() => {
    const map: Record<number, string> = {};
    const list = Array.isArray(activeIngredientsAll?.data) ? activeIngredientsAll.data : [];

    list.forEach((item: any) => {
      if (item?.id != null) {
        map[Number(item.id)] = item.name ?? item.activeIngredientName ?? '';
      }
    });

    return map;
  }, [activeIngredientsAll]);

  const handleAdd = async (data: any) => {
    try {
      await createOrder(data).unwrap();

      setOpenAdd(false);
      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Create failed',
          sev: 'error'
        })
      );
    }
  };

  const handleSubmit = async (row: any) => {
    try {
      await submitOrder({
        id: row.id,
        isHighAlert: !!row.isHighAlert
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication submitted successfully',
          sev: 'success'
        })
      );

      setSelectedIds(prev => prev.filter(id => id !== row.id));
      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Submit failed',
          sev: 'error'
        })
      );
    }
  };

  const handleCancel = async () => {
    if (!selectedCancelId) return;

    try {
      await cancelOrder({
        id: selectedCancelId,
        cancellationReason: cancelObject.cancelReason
      }).unwrap();

      dispatch(
        notify({
          msg: 'Medication cancelled successfully',
          sev: 'success'
        })
      );

      setOpenCancel(false);
      setCancelObject({ cancelReason: '' });
      setSelectedCancelId(null);
      setSelectedIds(prev => prev.filter(id => id !== selectedCancelId));
      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: error?.data?.detail || error?.data?.message || 'Cancel failed',
          sev: 'error'
        })
      );
    }
  };

  const toggleRow = (row: any, checked: boolean) => {
    if (row?.status !== 'NEW') return;

    setSelectedIds(prev =>
      checked ? [...prev, row.id] : prev.filter(id => id !== row.id)
    );
  };

  const selectableRows = useMemo(() => rows.filter((r: any) => r?.status === 'NEW'), [rows]);

  const selectableIds = useMemo(
    () => selectableRows.map((r: any) => r.id).filter((id: any) => id != null),
    [selectableRows]
  );

  const isAllSelected =
    selectableIds.length > 0 &&
    selectableIds.every((id: number) => selectedIds.includes(id));

  const isIndeterminate =
    selectedIds.length > 0 &&
    selectableIds.length > 0 &&
    !isAllSelected;

  const toggleAll = (checked: boolean) => {
    setSelectedIds(checked ? selectableIds : []);
  };

  const columns = useMemo(
    () => [
      {
        key: 'select',
        title: (
          <Checkbox
            checked={isAllSelected}
            indeterminate={isIndeterminate}
            disabled={!selectableIds.length}
            onChange={(_, checked) => toggleAll(checked)}
          />
        ),
        align: 'center' as const,
        width: 60,
        render: (row: any) => (
          <Checkbox
            checked={selectedIds.includes(row.id)}
            disabled={row?.status !== 'NEW'}
            onChange={(_, checked) => toggleRow(row, checked)}
            onClick={e => e.stopPropagation()}
          />
        )
      },
      {
        key: 'medicationName',
        title: <Translate>MEDICATION NAME</Translate>,
        flexGrow: 2,
        render: (row: any) => {
          const medicationId =
            row?.medicationId ??
            row?.activeIngredientId ??
            row?.activeIngredient?.id ??
            row?.medicationsId ??
            row?.genericMedicationsId;

          return (
            ingredientMap[Number(medicationId)] ||
            row?.medicationName ||
            row?.activeIngredientName ||
            row?.activeIngredient?.name ||
            row?.name ||
            '-'
          );
        }
      },
      {
        key: 'isHighAlert',
        title: <Translate>HIGH_RISK_MED</Translate>,
        align: 'center' as const,
        width: 120,
        render: (row: any) =>
          row?.isHighAlert ? <FontAwesomeIcon icon={faTriangleExclamation} /> : ''
      },
      {
        key: 'instructions',
        title: <Translate>INSTRUCTIONS</Translate>,
        flexGrow: 2,
        render: (row: any) =>
          String(
            row?.instructions ??
              row?.instructionText ??
              row?.doseText ??
              ''
          )
      },
      {
        key: 'status',
        title: <Translate>STATUS</Translate>,
        align: 'center' as const,
        width: 120,
        render: (row: any) => {
          return (
            <span>
              {row?.status}
            </span>
          );
        }
      },
      {
        key: 'actions',
        title: <Translate>ACTIONS</Translate>,
        align: 'center' as const,
        width: 120,
        render: (row: any) => {
          const canSubmit = row?.status === 'NEW';
          const canCancel = row?.status === 'NEW';

          return (
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <CheckRoundIcon
                style={{
                  cursor: canSubmit ? 'pointer' : 'not-allowed',
                  opacity: canSubmit ? 1 : 0.4
                }}
                onClick={() => canSubmit && handleSubmit(row)}
              />

              <WarningRoundIcon
                style={{
                  cursor: canCancel ? 'pointer' : 'not-allowed',
                  opacity: canCancel ? 1 : 0.4
                }}
                onClick={() => {
                  if (!canCancel) return;
                  setSelectedCancelId(row.id);
                  setOpenCancel(true);
                }}
              />
            </div>
          );
        }
      }
    ],
    [ingredientMap, isAllSelected, isIndeterminate, selectableIds.length, selectedIds]
  );

console.log('ordersResponse', ordersResponse);
console.log('rows', rows);

  return (
    <div>
      <MyTable
        height={450}
        data={rows}
        loading={isLoading || isFetching}
        columns={columns}
        tableButtons={
          <MyButton onClick={() => setOpenAdd(true)} prefixIcon={() => <PlusIcon />}>
            Add
          </MyButton>
        }
      />

      <UccMedicationOrderAddModal
        open={openAdd}
        setOpen={setOpenAdd}
        onAdd={handleAdd}
        encounter={encounter}
        patient={patient || encounter?.patient}
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