import React, { useEffect, useMemo, useState } from 'react';
import { Form, Panel } from 'rsuite';
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
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import {
  useGetSpecialistPractitionersByDepartmentQuery,
  useGetPractitionersBulkMutation,
  useGetPractitionerByIdQuery,
} from '@/services/setup/practitioner/PractitionerService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { formatEnumString, conjureValueBasedOnKeyFromList } from '@/utils';
import { PaginationPerPage } from '@/utils/paginationPerPage';

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
  const [departmentsMap, setDepartmentsMap] = useState<Record<number, string>>({});
  const [practitionersMap, setPractitionersMap] = useState<Record<number, string>>({});
  const [selectedPractitioner, setSelectedPractitioner] = useState<any | null>(null);
  const [practitionerPagination, setPractitionerPagination] = useState({
    page: 0,
    size: 10,
    sort: 'id,asc',
    timestamp: Date.now(),
  });
  const [formItem, setFormItem] = useState<ServiceItem>({
    ...newServiceItem,
    serviceId: Number(serviceId) || undefined,
  });

  const isDepartmentsType = String(formItem.type) === 'DEPARTMENTS';
  const departmentId = useMemo(() => {
    if (!isDepartmentsType) return undefined;
    const id = Number(formItem.sourceId);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [isDepartmentsType, formItem.sourceId]);

  // -------- Mutations / Queries --------
  const [addServiceItem, { isLoading: isAdding }] = useAddServiceItemMutation();
  const [updateServiceItem, { isLoading: isUpdating }] = useUpdateServiceItemMutation();
  const [toggleServiceItemIsActive, { isLoading: isToggling }] = useToggleServiceItemIsActiveMutation();
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();
  const [getPractitionersBulk] = useGetPractitionersBulkMutation();
  const serviceItemsTypeOptions = useEnumOptions('ServiceItemsType');
  const { data: subSpecialityLovQueryResponse } = useGetLovValuesByCodeQuery('PRACT_SUB_SPECIALTY');

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

  const {
    data: specialistsPage,
    isFetching: isLoadingSpecialists,
  } = useGetSpecialistPractitionersByDepartmentQuery(
    {
      departmentId: departmentId!,
      page: practitionerPagination.page,
      size: practitionerPagination.size,
      sort: practitionerPagination.sort,
      timestamp: practitionerPagination.timestamp,
    },
    { skip: !openChildModal || !departmentId }
  );

  const { data: practitionerDetail } = useGetPractitionerByIdQuery(
    Number(formItem.practitionerId),
    { skip: !openChildModal || !formItem.practitionerId }
  );

  const departmentIds = useMemo(() => {
    const rows = itemsPage?.data ?? [];
    const ids = rows
      .filter((r: any) => r.type === 'DEPARTMENTS')
      .map((r: any) => r.sourceId)
      .filter(Boolean);
    return Array.from(new Set(ids));
  }, [itemsPage]);

  const practitionerIds = useMemo(() => {
    const rows = itemsPage?.data ?? [];
    const ids = rows
      .filter((r: any) => r.type === 'DEPARTMENTS' && r.practitionerId)
      .map((r: any) => r.practitionerId)
      .filter(Boolean);
    return Array.from(new Set(ids)) as number[];
  }, [itemsPage]);

  const [triggerFetchSources, { isFetching: isLoadingSources }] =
    useLazyGetServiceItemSourcesByFacilityQuery();

  const sourceNameById = useMemo(() => {
    const map = new Map<number, string>();
    (sourcesLocal ?? []).forEach((d: any) => {
      if (d?.id != null) map.set(Number(d.id), d?.name ?? String(d.id));
    });
    return map;
  }, [sourcesLocal]);

  const tableData = useMemo(() => {
    const rows = itemsPage?.data ?? [];
    return rows.map((row: any) => {
      let name = row.sourceId;
      if (row.type === 'DEPARTMENTS') {
        const deptName = departmentsMap[row.sourceId] ?? row.sourceId;
        const practName = row.practitionerId
          ? practitionersMap[row.practitionerId] ?? row.practitionerId
          : null;
        name = practName ? `${deptName} - ${practName}` : deptName;
      } else {
        name = sourceNameById.get(Number(row.sourceId)) ?? row.sourceId;
      }
      return { ...row, name };
    });
  }, [itemsPage, sourceNameById, departmentsMap, practitionersMap]);

  const specialistTableData = useMemo(() => {
    return (specialistsPage?.data ?? []).map((p: any) => ({
      ...p,
      fullName: `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim(),
    }));
  }, [specialistsPage]);

  const practitionerColumns: ColumnConfig[] = [
    {
      key: 'fullName',
      title: 'Name',
      render: (row: any) => row.fullName || '-',
    },
    {
      key: 'specialty',
      title: 'Specialty',
      align: 'center',
      render: (row: any) => formatEnumString(row.specialty) || '-',
    },
    {
      key: 'subSpecialty',
      title: 'Sub Specialty',
      align: 'center',
      render: (row: any) => {
        if (!row.subSpecialty) return '-';
        const value = conjureValueBasedOnKeyFromList(
          subSpecialityLovQueryResponse?.object ?? [],
          row.subSpecialty,
          'lovDisplayVale'
        );
        return value ?? row.subSpecialty ?? '-';
      },
    },
    {
      key: 'select',
      title: 'Select',
      width: 90,
      align: 'center',
      render: (row: any) => (
        <MyButton
          width="70px"
          color={formItem.practitionerId === row.id ? 'var(--deep-blue)' : 'var(--primary-gray)'}
          onClick={() => handleSelectPractitioner(row)}
        >
          {formItem.practitionerId === row.id ? 'Selected' : 'Select'}
        </MyButton>
      ),
    },
  ];

  const tableColumns: ColumnConfig[] = [
    {
      key: 'type',
      title: 'Type',
      render: (row: any) => formatEnumString(row.type),
    },
    { key: 'name', title: 'Name', align: 'center' },
    {
      key: 'isActive',
      title: 'Status',
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

  const handleSelectPractitioner = (practitioner: any) => {
    setFormItem(prev => ({ ...prev, practitionerId: practitioner.id }));
    setSelectedPractitioner(practitioner);
  };

  const openCreate = () => {
    setMode('create');
    setEditingId(null);
    setSelectedPractitioner(null);
    setPractitionerPagination({ page: 0, size: 10, sort: 'id,asc', timestamp: Date.now() });
    setFormItem({ ...newServiceItem, serviceId: Number(serviceId) || undefined });
    setOpenChildModal(true);
  };

  const openEdit = (row: any) => {
    setMode('edit');
    setEditingId(Number(row.id));
    setPractitionerPagination({ page: 0, size: 10, sort: 'id,asc', timestamp: Date.now() });
    setFormItem({
      id: Number(row.id),
      type: String(row.type),
      sourceId: Number(row.sourceId),
      practitionerId: row.practitionerId ? Number(row.practitionerId) : undefined,
      serviceId: Number(serviceId) || undefined,
      createdBy: row.createdBy ?? '',
      createdDate: row.createdDate ?? null,
      lastModifiedBy: row.lastModifiedBy ?? null,
      lastModifiedDate: row.lastModifiedDate ?? null,
      isActive: !!row.isActive,
    });
    setSelectedPractitioner(null);
    setOpenChildModal(true);
  };

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

  const resetChildForm = () => {
    setSelectedPractitioner(null);
    setPractitionerPagination({ page: 0, size: 10, sort: 'id,asc', timestamp: Date.now() });
    setFormItem({ ...newServiceItem, serviceId: Number(serviceId) || undefined });
  };

  const handleSave = async () => {
    if (!formItem.type || !formItem.sourceId || !serviceId) {
      dispatch(notify({ msg: 'Please select type and item first', sev: 'warning' }));
      return;
    }
    if (isDepartmentsType && !formItem.practitionerId) {
      dispatch(notify({ msg: 'Please select a specialist practitioner', sev: 'warning' }));
      return;
    }

    const isCreate = mode === 'create';

    const payload = isCreate
      ? ({
          type: String(formItem.type),
          sourceId: Number(formItem.sourceId),
          practitionerId: isDepartmentsType ? Number(formItem.practitionerId) : undefined,
          serviceId: Number(serviceId),
          isActive: true,
          createdBy: formItem.createdBy ?? '',
        } as ServiceItemCreate)
      : ({
          id: Number(editingId),
          serviceId: Number(serviceId),
          type: String(formItem.type),
          sourceId: Number(formItem.sourceId),
          practitionerId: isDepartmentsType ? Number(formItem.practitionerId) : undefined,
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

      resetChildForm();
      setOpenChildModal(false);
      setEditingId(null);
      await refetchItems();
    } catch (err: any) {
      console.error('Error saving service item:', err);

      const status = err?.status;
      const backendMsg = err?.data?.message || err?.data?.detail || err?.data?.title || '';

      if (status === 409) {
        dispatch(
          notify({
            msg: 'An item with the same type, source and practitioner already exists in this service.',
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

  const handlePractitionerPageChange = (_: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      _,
      newPage,
      practitionerPagination,
      specialistsPage?.links ?? {},
      setPractitionerPagination
    );
  };

  const handlePractitionerRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setPractitionerPagination(prev => ({
      ...prev,
      page: 0,
      size: newSize,
      timestamp: Date.now(),
    }));
  };

  const renderPractitionerDetails = () => {
    if (!selectedPractitioner) return null;
    const p = selectedPractitioner;
    return (
      <Panel bordered header="Practitioner Details" style={{ marginTop: 12 }}>
        <div className="linked-item-practitioner-details">
          <div><strong>Name:</strong> {p.fullName || `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()}</div>
          <div><strong>Email:</strong> {p.email || '-'}</div>
          <div><strong>Phone:</strong> {p.phoneNumber || '-'}</div>
          <div><strong>Specialty:</strong> {formatEnumString(p.specialty) || '-'}</div>
          <div>
            <strong>Sub Specialty:</strong>{' '}
            {p.subSpecialty
              ? conjureValueBasedOnKeyFromList(
                  subSpecialityLovQueryResponse?.object ?? [],
                  p.subSpecialty,
                  'lovDisplayVale'
                ) ?? p.subSpecialty
              : '-'}
          </div>
          <div><strong>Medical License:</strong> {p.defaultMedicalLicense || '-'}</div>
          <div><strong>Job Role:</strong> {formatEnumString(p.jobRole) || '-'}</div>
        </div>
      </Panel>
    );
  };

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

  const conjureFormChildContent = () => (
    <Form fluid>
      <div className="linked-items-child-form">
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
            setFormItem({ ...r, sourceId: undefined, practitionerId: undefined });
            setSelectedPractitioner(null);
            setPractitionerPagination(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          }}
          placeholder="Choose type"
        />

        <MyInput
          required
          key={String(formItem.type) || 'no-type'}
          width="100%"
          fieldName="sourceId"
          fieldLabel={isDepartmentsType ? 'Select Department' : 'Select Item'}
          fieldType="select"
          selectDataValue="value"
          selectDataLabel="label"
          selectData={(sourcesLocal ?? []).map((d: any) => ({
            label: d?.name ?? String(d?.id),
            value: d?.id,
          }))}
          record={formItem}
          setRecord={(r: any) => {
            setFormItem({ ...r, practitionerId: undefined });
            setSelectedPractitioner(null);
            setPractitionerPagination(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
          }}
          placeholder={
            !formItem.type
              ? 'Choose type first'
              : isLoadingSources
                ? 'Loading...'
                : (sourcesLocal?.length ?? 0) === 0
                  ? 'No items found'
                  : isDepartmentsType
                    ? 'Choose department'
                    : 'Choose item'
          }
          disabled={!formItem.type || isLoadingSources || (sourcesLocal?.length ?? 0) === 0}
        />

        {isDepartmentsType && departmentId && (
          <div className="linked-items-practitioner-section">
            <div className="linked-items-section-title">
              <Translate>Select Specialist Practitioner</Translate>
              <span className="linked-items-section-required">*</span>
            </div>
            <MyTable
              height={240}
              loading={isLoadingSpecialists}
              data={specialistTableData}
              columns={practitionerColumns}
              page={practitionerPagination.page}
              rowsPerPage={practitionerPagination.size}
              totalCount={specialistsPage?.totalCount ?? 0}
              onPageChange={handlePractitionerPageChange}
              onRowsPerPageChange={handlePractitionerRowsPerPageChange}
            />
            {!isLoadingSpecialists && (specialistsPage?.totalCount ?? 0) === 0 && (
              <div className="linked-items-empty-practitioners">
                <Translate>No specialist practitioners found for this department</Translate>
              </div>
            )}
            {renderPractitionerDetails()}
          </div>
        )}

        {isDepartmentsType && !departmentId && (
          <div className="linked-items-practitioner-hint">
            <Translate>Select a department to load specialist practitioners</Translate>
          </div>
        )}
      </div>
    </Form>
  );

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
      practitionerId: undefined,
    }));
    setSelectedPractitioner(null);
  }, [formItem.type]);

  useEffect(() => {
    if (!departmentIds.length) return;

    getDepartmentsBulk(departmentIds)
      .unwrap()
      .then(res => {
        const map: Record<number, string> = {};
        res.forEach((d: any) => {
          map[d.id] = d.name;
        });
        setDepartmentsMap(map);
      })
      .catch(() => {
        setDepartmentsMap({});
      });
  }, [departmentIds, getDepartmentsBulk]);

  useEffect(() => {
    if (!practitionerIds.length) return;

    getPractitionersBulk(practitionerIds)
      .unwrap()
      .then(res => {
        const map: Record<number, string> = {};
        (Array.isArray(res) ? res : []).forEach((p: any) => {
          map[p.id] = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
        });
        setPractitionersMap(map);
      })
      .catch(() => {
        setPractitionersMap({});
      });
  }, [practitionerIds, getPractitionersBulk]);

  useEffect(() => {
    if (!openChildModal || !formItem.practitionerId) return;

    const fromPage = specialistsPage?.data?.find((p: any) => p.id === formItem.practitionerId);
    const source = fromPage ?? practitionerDetail;

    if (source && source.id === formItem.practitionerId) {
      setSelectedPractitioner({
        ...source,
        fullName: `${source.firstName ?? ''} ${source.lastName ?? ''}`.trim(),
      });
    }
  }, [openChildModal, formItem.practitionerId, specialistsPage?.data, practitionerDetail]);

  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';
  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <>
      <ChildModal
        open={open}
        setOpen={setOpen}
        showChild={openChildModal}
        setShowChild={setOpenChildModal}
        title="Linked Items"
        mainContent={<div dir={dir}>{conjureFormMainContent()}</div>}
        actionChildButtonFunction={handleSave}
        hideActionBtn
        childTitle={mode === 'create' ? 'Link New Item to Service' : 'Edit Linked Item'}
        childContent={<div dir={dir}>{conjureFormChildContent()}</div>}
        mainSize="sm"
        childSize="lg"
        childBodyHeight="80vh"
        actionChildButtonLabel="Save"
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
