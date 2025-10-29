import React, { useEffect, useMemo, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { MdDelete, MdMedicalServices, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import MyInput from '@/components/MyInput';
import Translate from '@/components/Translate';
import MyTable, { ColumnConfig } from '@/components/MyTable/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import ChildModal from '@/components/ChildModal';
import { useEnumOptions } from '@/services/enumsApi';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetServiceItemsByServiceQuery,
  useLazyGetServiceItemSourcesByFacilityQuery,
  useAddServiceItemMutation,
  useUpdateServiceItemMutation,
  useToggleServiceItemIsActiveMutation,
} from '@/services/setup/serviceService';
import type { ServiceItem, ServiceItemCreate, ServiceItemUpdate } from '@/types/model-types-new';
import { newServiceItem } from '@/types/model-types-constructor-new';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  serviceId: number | string;
  facilityId: number | string;
};

type Mode = 'create' | 'edit';

const LinkedItems: React.FC<Props> = ({ open, setOpen, serviceId, facilityId }) => {
  const dispatch = useAppDispatch();
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [mode, setMode] = useState<Mode>('create');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [sourcesLocal, setSourcesLocal] = useState<any[]>([]);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [rowToToggle, setRowToToggle] = useState<any | null>(null);
  const [formItem, setFormItem] = useState<ServiceItem>({
    ...newServiceItem,
    serviceId: Number(serviceId) || undefined,
  });

  // -------- Mutations --------
  const [addServiceItem, { isLoading: isAdding }] = useAddServiceItemMutation();
  const [updateServiceItem, { isLoading: isUpdating }] = useUpdateServiceItemMutation();
  const [toggleServiceItemIsActive, { isLoading: isToggling }] = useToggleServiceItemIsActiveMutation();

  // get enum options for ServiceItemsType
  const serviceItemsTypeOptions = useEnumOptions('ServiceItemsType');

  // get linked items for the service 
  const {
    data: itemsPage,
    isFetching: isLoadingItems,
    refetch: refetchItems,
  } = useGetServiceItemsByServiceQuery(
    {
      serviceId: Number(serviceId),
      page: 0,
      size: 200,
      sort: 'id,asc',
    },
    { skip: !open || !serviceId || !facilityId }
  );

  // get sources based on type and facility
  const [triggerFetchSources, { isFetching: isLoadingSources }] =
    useLazyGetServiceItemSourcesByFacilityQuery();

  // map of sourceId to sourceName for table display
  const sourceNameById = useMemo(() => {
    const map = new Map<number, string>();
    (sourcesLocal ?? []).forEach((d: any) => {
      if (d?.id != null) map.set(Number(d.id), d?.name ?? String(d.id));
    });
    return map;
  }, [sourcesLocal]);

  // get table data
  const tableData = useMemo(() => {
    const rows = itemsPage?.data ?? [];
    return rows.map((row: any) => ({
      ...row,
      name: sourceNameById.get(Number(row.sourceId)) ?? row.sourceId,
    }));
  }, [itemsPage, sourceNameById]);
  // Table columns
  const tableColumns: ColumnConfig[] = [
    { key: 'type', title: <Translate>Type</Translate> },
    { key: 'name', title: <Translate>Name</Translate>, align: 'center' },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 100,
      align: 'center',
      render: (row: any) => (
        <MyBadgeStatus
          contant={row?.isActive ? 'Active' : 'Inactive'}
          color={row?.isActive ? '#546cf4ff' : '#b1acacff'}
        />
      ),
    },
    {
      key: 'icons',
      title: <Translate>Action</Translate>,
      width: 120,
      render: (row: any) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => openEdit(row)}
            style={{ cursor: isUpdating ? 'not-allowed' : 'pointer', opacity: isUpdating ? 0.6 : 1 }}
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={22}
              fill="var(--primary-pink)"
              onClick={() => {
                setStateOfDeleteService('deactivate');
                setRowToToggle(row);
                setOpenConfirmDeleteService(true);
              }}
              style={{ cursor: isToggling ? 'not-allowed' : 'pointer', opacity: isToggling ? 0.6 : 1 }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={22}
              fill="var(--primary-gray)"
              onClick={() => {
                setStateOfDeleteService('reactivate');
                setRowToToggle(row);
                setOpenConfirmDeleteService(true);
              }}
              style={{ cursor: isToggling ? 'not-allowed' : 'pointer', opacity: isToggling ? 0.6 : 1 }}
            />
          )}
        </div>
      ),
      align: 'right',
    },
  ];
  // Handlers
  // open create or edit modals
  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setFormItem({ ...newServiceItem, serviceId: Number(serviceId) || undefined });
    setOpenChildModal(true);
  };

  const openEdit = (row: any) => {
    setMode('edit');
    setEditingId(Number(row.id));
    setFormItem({
      id: Number(row.id),
      type: String(row.type),
      sourceId: Number(row.sourceId),
      serviceId: Number(serviceId) || undefined,
      createdBy: row.createdBy ?? '',
      createdDate: row.createdDate ?? null,
      lastModifiedBy: row.lastModifiedBy ?? null,
      lastModifiedDate: row.lastModifiedDate ?? null,
      isActive: !!row.isActive,
    });
    setOpenChildModal(true);
  };
  // handle deactivate and reactivate
  const handleDeactivate = async () => {
    if (!rowToToggle?.id || !serviceId) return;
    try {
      await toggleServiceItemIsActive({ id: Number(rowToToggle.id), serviceId: Number(serviceId) }).unwrap();
      dispatch(notify({ msg: 'Item deactivated successfully', sev: 'success' }));
      await refetchItems();
    } catch {
      dispatch(notify({ msg: 'Failed to deactivate item', sev: 'error' }));
    } finally {
      setOpenConfirmDeleteService(false);
      setRowToToggle(null);
    }
  };

  const handleReactivate = async () => {
    if (!rowToToggle?.id || !serviceId) return;
    try {
      await toggleServiceItemIsActive({ id: Number(rowToToggle.id), serviceId: Number(serviceId) }).unwrap();
      dispatch(notify({ msg: 'Item activated successfully', sev: 'success' }));
      await refetchItems();
    } catch {
      dispatch(notify({ msg: 'Failed to activate item', sev: 'error' }));
    } finally {
      setOpenConfirmDeleteService(false);
      setRowToToggle(null);
    }
  };
  // reset child form
  const resetChildForm = () =>
    setFormItem({ ...newServiceItem, serviceId: Number(serviceId) || undefined });
  // handle save for create and edit
  const handleSave = async () => {
    if (!formItem.type || !formItem.sourceId || !serviceId) {
      dispatch(notify({ msg: 'Please select type and item first', sev: 'warning' }));
      return;
    }

    const isCreate = mode === 'create';

    const payload = isCreate
      ? ({
        type: String(formItem.type),
        sourceId: Number(formItem.sourceId),
        serviceId: Number(serviceId),
        isActive: true,
        createdBy: formItem.createdBy ?? '',
      } as ServiceItemCreate)
      : ({
        id: Number(editingId),
        serviceId: Number(serviceId),
        type: String(formItem.type),
        sourceId: Number(formItem.sourceId),
        isActive: formItem.isActive ?? undefined,
        lastModifiedBy: formItem.lastModifiedBy ?? undefined,
      } as ServiceItemUpdate);

    try {
      if (isCreate) {
        await addServiceItem(payload as ServiceItemCreate).unwrap();
        dispatch(notify({ msg: 'Item linked successfully', sev: 'success' }));
      } else {
        await updateServiceItem(payload as ServiceItemUpdate).unwrap();
        dispatch(notify({ msg: 'Item updated successfully', sev: 'success' }));
      }

      // Reset UI after success
      resetChildForm();
      setOpenChildModal(false);
      setEditingId(null);
      await refetchItems();
    } catch (err: any) {
      console.error('Error saving service item:', err);

      const status = err?.status;
      const backendMsg =
        err?.data?.message || err?.data?.detail || err?.data?.title || '';

      if (status === 409) {
        // Duplicate detected (like existing ServiceItem with same type + source)
        dispatch(
          notify({
            msg: 'An item with the same type and source already exists in this service.',
            sev: 'warning',
          })
        );
      } else if (status === 400) {
        dispatch(
          notify({
            msg: backendMsg || 'Bad request. Please check the entered data.',
            sev: 'error',
          })
        );
      } else if (status === 404) {
        dispatch(
          notify({
            msg: backendMsg || 'Service or linked item not found.',
            sev: 'error',
          })
        );
      } else {
        dispatch(
          notify({
            msg: backendMsg || 'Unexpected error occurred. Please try again.',
            sev: 'error',
          })
        );
      }
    }
  };


  // Child and Main content for ChildModal
  const conjureFormMainContent = () => (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="140px"
          disabled={!serviceId}
        >
          <Translate>Link Item</Translate>
        </MyButton>
      </div>

      <MyTable height={450} loading={isLoadingItems} data={tableData} columns={tableColumns} />
    </div>
  );
  // Child content
  const conjureFormChildContent = () => (
    <Form fluid>
      <div style={{ display: 'grid', gap: 12 }}>
        <MyInput
          required
          width="100%"
          fieldName="type"
          selectDataValue="value"
          selectDataLabel="label"
          fieldLabel="Select Item type"
          fieldType="select"
          selectData={serviceItemsTypeOptions ?? []}
          record={formItem}
          setRecord={(r: any) => {
            setFormItem({ ...r, sourceId: undefined });
          }}
          placeholder="Choose type"
        />
        <MyInput
          required
          key={String(formItem.type) || 'no-type'}
          width="100%"
          fieldName="sourceId"
          fieldLabel="Select Item"
          fieldType="select"
          selectDataValue="value"
          selectDataLabel="label"
          selectData={(sourcesLocal ?? []).map((d: any) => ({
            label: d?.name ?? String(d?.id),
            value: d?.id,
          }))}
          record={formItem}
          setRecord={setFormItem}
          placeholder={
            !formItem.type
              ? 'Choose type first'
              : isLoadingSources
                ? 'Loading...'
                : (sourcesLocal?.length ?? 0) === 0
                  ? 'No items found'
                  : 'Choose item'
          }
          disabled={!formItem.type || isLoadingSources || (sourcesLocal?.length ?? 0) === 0}
        />
      </div>
    </Form>
  );

  // Effects 
  useEffect(() => {
    let ignore = false;
    const run = async () => {
      if (openChildModal && formItem.type && facilityId != null) {
        setSourcesLocal([]);
        try {
          const res = await triggerFetchSources(
            { type: String(formItem.type), facilityId: Number(facilityId) },
            false
          ).unwrap();
          if (!ignore) {
            setSourcesLocal(Array.isArray(res) ? res : []);
          }
        } catch {
          if (!ignore) setSourcesLocal([]);
        }
      } else {
        setSourcesLocal([]);
      }
    };

    run();
    return () => {
      ignore = true;
    };
  }, [openChildModal, formItem.type, facilityId, triggerFetchSources]);

  useEffect(() => {
    setFormItem(prev => ({
      ...prev,
      sourceId: undefined,
    }));
  }, [formItem.type]);


  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Linked Items"
        mainContent={conjureFormMainContent}
        actionChildButtonFunction={handleSave}
        hideActionBtn
        childTitle={mode === 'create' ? 'Link New Item to Service' : 'Edit Linked Item'}
        childContent={conjureFormChildContent}
        mainSize="sm"
        actionButtonLabel='Link'
        mainStep={[{ title: 'Linked Items', icon: <MdMedicalServices /> }]}
        childStep={[{ title: mode === 'create' ? 'Item' : 'Edit', icon: <MdMedicalServices /> }]}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteService}
        setOpen={setOpenConfirmDeleteService}
        itemToDelete="Service Item"
        actionButtonFunction={stateOfDeleteService === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={stateOfDeleteService}
      />
    </>
  );
};

export default LinkedItems;
