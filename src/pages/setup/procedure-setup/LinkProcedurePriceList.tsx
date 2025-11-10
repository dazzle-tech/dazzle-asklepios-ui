import React, { useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { MdDelete, MdMedicalServices } from 'react-icons/md';

import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { useEnumCapitalized, useEnumOptions } from '@/services/enumsApi';

// Service hooks (RTK Query)
import {
  useGetProcedurePriceListByProcedureQuery,
  useAddProcedurePriceListMutation,
  useDeleteProcedurePriceListMutation,
} from '@/services/setup/procedure/procedurePriceListService';

// Types (unified)
import type { ProcedurePriceList } from '@/types/model-types-new';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  procedureId: number | string;
};

type FormState = {
  currency?: string;
  price?: number | string; // keep as number or string until submit
};

const emptyForm: FormState = {
  currency: undefined,
  price: undefined,
};

const LinkProcedurePriceList: React.FC<Props> = ({ open, setOpen, procedureId }) => {
  const dispatch = useAppDispatch();

  const [openChildModal, setOpenChildModal] = useState<boolean>(false);

  // Delete confirm
  const [openConfirmDelete, setOpenConfirmDelete] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<ProcedurePriceList | null>(null);

  const [formItem, setFormItem] = useState<FormState>({ ...emptyForm });

  // Enum options (currencies)
  const currencyOptions = useEnumCapitalized('Currency'); 

  // ===== Query: price list by procedure (paged) =====
  const {
    data: pagePrices,
    isFetching: isLoadingPrices,
    refetch: refetchPrices,
  } = useGetProcedurePriceListByProcedureQuery(
    {
      procedureId: Number(procedureId),
      page: 0,
      size: 200,
      sort: 'id,asc',
    },
    { skip: !open || !procedureId }
  );

  // ===== Mutations =====
  const [addPrice, { isLoading: isAdding }] = useAddProcedurePriceListMutation();
  const [deletePrice, { isLoading: isDeleting }] = useDeleteProcedurePriceListMutation();

  // Table data
  const tableData = useMemo(() => pagePrices?.data ?? [], [pagePrices]);

  // Columns
  const columns: ColumnConfig[] = [
    { key: 'currency', title: <Translate>Currency</Translate>, align: 'center' },
    { key: 'price', title: <Translate>Price</Translate>, align: 'center' },
    {
      key: 'icons',
      title: <Translate>Action</Translate>,
      width: 100,
      align: 'right',
      render: (row: any) => (
        <div className="container-of-icons">
          <MdDelete
            className="icons-style"
            title="Delete"
            size={22}
            fill="var(--primary-pink)"
            onClick={() => {
              setRowToDelete(row);
              setOpenConfirmDelete(true);
            }}
            style={{ cursor: isDeleting ? 'not-allowed' : 'pointer', opacity: isDeleting ? 0.6 : 1 }}
          />
        </div>
      ),
    },
  ];

  // ===== Handlers =====
  const openCreate = () => {
    setFormItem({ ...emptyForm });
    setOpenChildModal(true);
  };

  const resetChildForm = () => setFormItem({ ...emptyForm });

  const handleSave = async () => {
    // close child modal before trying
    setOpenChildModal(false);

    // basic validation
    if (!procedureId) {
      dispatch(notify({ msg: 'Please choose a procedure before saving.', sev: 'error' }));
      setOpenChildModal(true);
      return;
    }
    if (!formItem.currency) {
      dispatch(notify({ msg: 'Please select a currency.', sev: 'warning' }));
      setOpenChildModal(true);
      return;
    }
    if (formItem.price === undefined || formItem.price === null || formItem.price === '' || isNaN(Number(formItem.price))) {
      dispatch(notify({ msg: 'Please enter a valid price.', sev: 'warning' }));
      setOpenChildModal(true);
      return;
    }

    const createPayload = {
      procedureId: Number(procedureId),
      currency: String(formItem.currency),
      price: Number(formItem.price),
    };

    try {
      await addPrice(createPayload).unwrap();
      dispatch(notify({ msg: 'Price added successfully', sev: 'success' }));
      resetChildForm();
      await refetchPrices();
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      // Bean Validation errors
      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          currency: 'Currency',
          price: 'Price',
          procedureId: 'Procedure',
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank') || m.includes('must not be empty')) return 'must not be blank';
          if (m.includes('must be greater than')) return 'value is too small';
          if (m.includes('must be less than')) return 'value is too large';
          if (m.includes('size must be between')) return 'length is out of range';
          return msg || 'invalid value';
        };
        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });
        const humanMsg = `Please fix the following fields:\n${lines.join('\n')}`;
        dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
        setOpenChildModal(true);
        return;
      }

      // Extract custom error keys
      let errorKey: string | undefined;
      if (data?.errorKey) {
        errorKey = data.errorKey;
      } else {
        const messageProp: string = data?.message || '';
        const entityName: string = data?.entityName || 'procedurePriceList';
        if (messageProp) {
          if (messageProp.startsWith(entityName + '.')) {
            errorKey = messageProp.substring(entityName.length + 1);
          } else if (messageProp.startsWith('error.')) {
            errorKey = messageProp.substring(6);
          } else if (messageProp.includes('.')) {
            const parts = messageProp.split('.');
            if (parts[0] === 'error' && parts.length > 1) {
              errorKey = parts.slice(1).join('.');
            } else {
              errorKey = parts.slice(-2).join('.'); // e.g., "procedureid.required"
            }
          }
        }
      }

      // Map back-end keys to friendly strings (align with your service)
      const keyMap: Record<string, string> = {
        'procedureid.required': 'Procedure id is required.',
        'payload.required': 'Price payload is required.',
        'price.required': 'Price is required.',
        'currency.required': 'Currency is required.',
        'unique.procedurepricelist': 'This price with the selected currency already exists for this procedure.',
        'db.constraint': 'Database constraint violated. Please check unique or required fields.',
        // NotFoundAlertException
        'notfound': 'Procedure not found.',
      };

      let humanMsg: string;
      if (errorKey && keyMap[errorKey]) {
        humanMsg = keyMap[errorKey];
      } else if (data?.detail) {
        humanMsg = data.detail;
      } else if (data?.title) {
        humanMsg = data.title;
      } else {
        humanMsg = 'Failed to add price. Please try again.';
      }

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
      setOpenChildModal(true);
    }
  };

  const handleDelete = async () => {
    if (!rowToDelete?.id) return;
    try {
      await deletePrice({ id: Number(rowToDelete.id) }).unwrap();
      dispatch(notify({ msg: 'Price deleted successfully', sev: 'success' }));
      await refetchPrices();
    } catch {
      dispatch(notify({ msg: 'Failed to delete price', sev: 'error' }));
    } finally {
      setOpenConfirmDelete(false);
      setRowToDelete(null);
    }
  };

  // ===== UI builders =====
  const conjureFormMainContent = () => (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="160px"
          disabled={!procedureId}
        >
          <Translate>Add Price</Translate>
        </MyButton>
      </div>

      <MyTable height={450} loading={isLoadingPrices} data={tableData} columns={columns} />
    </div>
  );

  const conjureFormChildContent = () => (
    <Form fluid>
      <div style={{ display: 'grid', gap: 12 }}>
        <MyInput
          required
          width="100%"
          fieldName="price"
          fieldLabel="Price"
          fieldType="number"
          record={formItem}
          setRecord={setFormItem}
          placeholder="Enter price"
        />
        <MyInput
          required
          width="100%"
          fieldName="currency"
          selectDataValue="value"
          selectDataLabel="label"
          fieldLabel="Currency"
          fieldType="select"
          selectData={currencyOptions ?? []}
          record={formItem}
          setRecord={setFormItem}
          placeholder="Choose currency"
        />
      </div>
    </Form>
  );

  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Procedure Prices"
        mainContent={conjureFormMainContent}
        actionChildButtonFunction={handleSave}
        hideActionBtn
        childTitle="Add Price"
        childContent={conjureFormChildContent}
        mainSize="sm"
        actionButtonLabel="Save"
        mainStep={[{ title: 'Price List', icon: <MdMedicalServices /> }]}
        childStep={[{ title: 'Price', icon: <MdMedicalServices /> }]}
      />

      <DeletionConfirmationModal
        open={openConfirmDelete}
        setOpen={setOpenConfirmDelete}
        itemToDelete="Procedure Price"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </>
  );
};

export default LinkProcedurePriceList;
