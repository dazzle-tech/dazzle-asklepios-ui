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
  useGetProcedureItemsByProcedureQuery,
  useLazyGetProcedureItemSourcesByFacilityQuery,
  useAddProcedureItemMutation,
  useUpdateProcedureItemMutation,
  useToggleProcedureItemIsActiveMutation
} from '@/services/setup/procedure/procedureService';
import type {
  ProcedureItem,
  ProcedureItemCreate,
  ProcedureItemUpdate
} from '@/types/model-types-new';
import { newProcedureItem } from '@/types/model-types-constructor-new';
import { useGetDepartmentsBulkMutation } from '@/services/security/departmentService';
import {
  useLazyGetSpecialtiesByDepartmentQuery,
  useLazyGetSpecialistPractitionersByDepartmentQuery
} from '@/services/setup/practitioner/PractitionerService';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

/**
 * Links a procedure to departments + specialties. Active links are the
 * default procedures ordered and billed when a visit is registered in that
 * department and specialty (same principle as the service Linked Items).
 */

const DEPARTMENTS_TYPE = 'DEPARTMENTS';
const SPECIALTY_PAGE_SIZE = 20;
const INITIAL_PRACTITIONER_PAGINATION = { page: 0, size: 10, sort: 'id,asc' };

const formatSpecialtyLabel = (value?: string | null) => {
  if (!value) return '-';
  return value
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  procedureId: number | string;
  facilityId: number | string;
};

type Mode = 'create' | 'edit';
type ToggleAction = 'deactivate' | 'reactivate';
type PractitionerPagination = typeof INITIAL_PRACTITIONER_PAGINATION & { timestamp: number };

const newPractitionerPagination = (): PractitionerPagination => ({
  ...INITIAL_PRACTITIONER_PAGINATION,
  timestamp: Date.now()
});

const practitionerColumns: ColumnConfig[] = [
  { key: 'firstName', title: 'First Name', render: (row: any) => row.firstName || '-' },
  { key: 'lastName', title: 'Last Name', render: (row: any) => row.lastName || '-' },
  { key: 'specialty', title: 'Specialty', render: (row: any) => row.specialty || '-' }
];

const LinkProcedureItems: React.FC<Props> = ({ open, setOpen, procedureId, facilityId }) => {
  const dispatch = useAppDispatch();
  const [openChildModal, setOpenChildModal] = useState(false);
  const [mode, setMode] = useState<Mode>('create');
  const [sources, setSources] = useState<any[]>([]);
  const [openConfirmToggle, setOpenConfirmToggle] = useState(false);
  const [toggleAction, setToggleAction] = useState<ToggleAction>('deactivate');
  const [rowToToggle, setRowToToggle] = useState<any | null>(null);
  const [departmentsMap, setDepartmentsMap] = useState<Record<number, string>>({});
  const [specialtyPage, setSpecialtyPage] = useState(0);
  const [specialtyOptions, setSpecialtyOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [practitionerPagination, setPractitionerPagination] =
    useState<PractitionerPagination>(newPractitionerPagination);
  const [practitionerRows, setPractitionerRows] = useState<any[]>([]);
  const [practitionerTotalCount, setPractitionerTotalCount] = useState(0);
  const [practitionerLinks, setPractitionerLinks] = useState<Record<string, string | null>>({});
  const emptyItem = (): ProcedureItem => ({
    ...newProcedureItem,
    procedureId: Number(procedureId) || undefined
  });
  const [formItem, setFormItem] = useState<ProcedureItem>(emptyItem);

  const isDepartmentsType = String(formItem.type) === DEPARTMENTS_TYPE;
  const departmentId = useMemo(() => {
    if (!isDepartmentsType) return undefined;
    const id = Number(formItem.sourceId);
    return Number.isFinite(id) && id > 0 ? id : undefined;
  }, [isDepartmentsType, formItem.sourceId]);

  const [addProcedureItem] = useAddProcedureItemMutation();
  const [updateProcedureItem, { isLoading: isUpdating }] = useUpdateProcedureItemMutation();
  const [toggleProcedureItemIsActive, { isLoading: isToggling }] =
    useToggleProcedureItemIsActiveMutation();
  const [getDepartmentsBulk] = useGetDepartmentsBulkMutation();
  const procedureItemsTypeOptions = useEnumOptions('ProcedureItemsType');
  const [triggerSpecialtiesByDept, { data: specialtiesList, isFetching: isLoadingSpecialties }] =
    useLazyGetSpecialtiesByDepartmentQuery();
  const [triggerPractitionersBySpecialty, { isFetching: isLoadingPractitioners }] =
    useLazyGetSpecialistPractitionersByDepartmentQuery();
  const [triggerFetchSources, { isFetching: isLoadingSources }] =
    useLazyGetProcedureItemSourcesByFacilityQuery();

  const specialtyHasMore = Boolean(specialtiesList?.links?.next);

  const {
    data: itemsPage,
    isFetching: isLoadingItems,
    refetch: refetchItems
  } = useGetProcedureItemsByProcedureQuery(
    {
      procedureId: Number(procedureId),
      page: 0,
      size: 200,
      sort: 'id,asc'
    },
    { skip: !open || !procedureId }
  );

  const mergeSpecialtyOptions = (rows: string[]) => {
    if (!rows?.length) return;
    setSpecialtyOptions(previousOptions => {
      const seen = new Set(previousOptions.map(option => option.value));
      const merged = [...previousOptions];
      rows.forEach(specialty => {
        if (!specialty || seen.has(specialty)) return;
        seen.add(specialty);
        merged.push({ value: String(specialty), label: formatSpecialtyLabel(specialty) });
      });
      return merged;
    });
  };

  const applyPractitionerPage = (
    rows: any[],
    totalCount: number,
    links: Record<string, string | null> = {}
  ) => {
    setPractitionerRows(rows);
    setPractitionerTotalCount(totalCount);
    setPractitionerLinks(links);
  };

  const resetPractitioners = () => {
    applyPractitionerPage([], 0);
    setPractitionerPagination(newPractitionerPagination());
  };

  const resetSpecialties = () => {
    setSpecialtyPage(0);
    setSpecialtyOptions([]);
    resetPractitioners();
  };

  const practitionerTableData = useMemo(
    () =>
      practitionerRows.map((practitioner: any) => ({
        id: practitioner.id,
        firstName: practitioner.firstName ?? '-',
        lastName: practitioner.lastName ?? '-',
        specialty: formatSpecialtyLabel(practitioner.specialty)
      })),
    [practitionerRows]
  );

  const handlePractitionerPageChange = (event: unknown, newPage: number) => {
    PaginationPerPage.handlePageChange(
      event,
      newPage,
      practitionerPagination,
      practitionerLinks,
      setPractitionerPagination
    );
  };

  const handlePractitionerRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPractitionerPagination(previous => ({
      ...previous,
      page: 0,
      size: Number(event.target.value),
      timestamp: Date.now()
    }));
  };

  const departmentIds = useMemo(() => {
    const ids = (itemsPage?.data ?? [])
      .filter((row: any) => row.type === DEPARTMENTS_TYPE)
      .map((row: any) => row.sourceId)
      .filter(Boolean);
    return Array.from(new Set(ids)) as number[];
  }, [itemsPage]);

  const tableData = useMemo(
    () =>
      (itemsPage?.data ?? []).map((row: any) => {
        const departmentName = departmentsMap[row.sourceId] ?? row.sourceId;
        const specialtyName = row.specialty ? formatSpecialtyLabel(row.specialty) : null;
        return {
          ...row,
          name: specialtyName ? `${departmentName} - ${specialtyName}` : departmentName
        };
      }),
    [itemsPage, departmentsMap]
  );

  const openCreate = () => {
    setMode('create');
    resetSpecialties();
    setFormItem(emptyItem());
    setOpenChildModal(true);
  };

  const openEdit = (row: any) => {
    setMode('edit');
    resetSpecialties();
    setFormItem({
      id: Number(row.id),
      type: String(row.type),
      sourceId: Number(row.sourceId),
      specialty: row.specialty ?? undefined,
      procedureId: Number(procedureId) || undefined,
      isActive: !!row.isActive
    });
    setOpenChildModal(true);
  };

  const confirmToggle = (row: any, action: ToggleAction) => {
    setToggleAction(action);
    setRowToToggle(row);
    setOpenConfirmToggle(true);
  };

  const handleToggle = async () => {
    if (!rowToToggle?.id || !procedureId) return;
    const activated = toggleAction === 'reactivate';
    try {
      await toggleProcedureItemIsActive({
        id: Number(rowToToggle.id),
        procedureId: Number(procedureId)
      }).unwrap();
      dispatch(
        notify({
          msg: activated ? 'Item activated successfully' : 'Item deactivated successfully',
          sev: 'success'
        })
      );
      await refetchItems();
    } catch {
      dispatch(
        notify({
          msg: activated ? 'Failed to activate item' : 'Failed to deactivate item',
          sev: 'error'
        })
      );
    } finally {
      setOpenConfirmToggle(false);
      setRowToToggle(null);
    }
  };

  const handleSave = async () => {
    if (!formItem.type || !formItem.sourceId || !procedureId) {
      dispatch(notify({ msg: 'Please select type and department first', sev: 'warning' }));
      return;
    }
    if (isDepartmentsType && !formItem.specialty) {
      dispatch(notify({ msg: 'Please select a specialty', sev: 'warning' }));
      return;
    }

    const linkPayload = {
      type: String(formItem.type),
      sourceId: Number(formItem.sourceId),
      specialty: isDepartmentsType ? formItem.specialty : undefined,
      procedureId: Number(procedureId)
    };

    try {
      if (mode === 'create') {
        await addProcedureItem({ ...linkPayload, isActive: true } as ProcedureItemCreate).unwrap();
        dispatch(notify({ msg: 'Item linked successfully', sev: 'success' }));
      } else {
        await updateProcedureItem({
          ...linkPayload,
          id: Number(formItem.id),
          isActive: formItem.isActive ?? true
        } as ProcedureItemUpdate).unwrap();
        dispatch(notify({ msg: 'Item updated successfully', sev: 'success' }));
      }

      resetSpecialties();
      setFormItem(emptyItem());
      setOpenChildModal(false);
      await refetchItems();
    } catch (err: any) {
      const backendMsg = err?.data?.message || err?.data?.detail || err?.data?.title || '';
      dispatch(
        notify({
          msg:
            backendMsg ||
            (err?.status === 404
              ? 'Procedure or linked item not found.'
              : 'Unexpected error occurred. Please try again.'),
          sev: 'error'
        })
      );
    }
  };

  const tableColumns: ColumnConfig[] = [
    { key: 'type', title: 'Type', render: (row: any) => row.type },
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
      )
    },
    {
      key: 'icons',
      title: <Translate>Action</Translate>,
      width: 120,
      align: 'right',
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
              onClick={() => confirmToggle(row, 'deactivate')}
              style={{ cursor: isToggling ? 'not-allowed' : 'pointer', opacity: isToggling ? 0.6 : 1 }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={22}
              fill="var(--primary-gray)"
              onClick={() => confirmToggle(row, 'reactivate')}
              style={{ cursor: isToggling ? 'not-allowed' : 'pointer', opacity: isToggling ? 0.6 : 1 }}
            />
          )}
        </div>
      )
    }
  ];

  const conjureFormMainContent = () => (
    <div>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={openCreate}
          width="140px"
          disabled={!procedureId}
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
          selectData={procedureItemsTypeOptions ?? []}
          record={formItem}
          setRecord={(record: any) => {
            setFormItem({ ...record, sourceId: undefined, specialty: undefined });
            resetSpecialties();
          }}
          placeholder="Choose type"
        />

        <MyInput
          required
          key={String(formItem.type) || 'no-type'}
          width="100%"
          fieldName="sourceId"
          fieldLabel="Select Department"
          fieldType="select"
          selectDataValue="value"
          selectDataLabel="label"
          selectData={sources.map((department: any) => ({
            label: department?.name ?? String(department?.id),
            value: department?.id
          }))}
          record={formItem}
          setRecord={(record: any) => {
            setFormItem({ ...record, specialty: undefined });
            resetSpecialties();
          }}
          placeholder={
            !formItem.type
              ? 'Choose type first'
              : isLoadingSources
                ? 'Loading...'
                : sources.length === 0
                  ? 'No departments found'
                  : 'Choose department'
          }
          disabled={!formItem.type || isLoadingSources || sources.length === 0}
        />

        {isDepartmentsType && departmentId && (
          <MyInput
            required
            width="100%"
            fieldName="specialty"
            fieldLabel="Select Specialty"
            fieldType="selectPagination"
            selectDataValue="value"
            selectDataLabel="label"
            selectData={specialtyOptions}
            record={formItem}
            setRecord={(record: any) => {
              setFormItem({
                ...record,
                specialty: record.specialty != null ? String(record.specialty) : undefined
              });
              resetPractitioners();
            }}
            onSelectItem={(item: any) => {
              if (!item?.value) return;
              setFormItem(previous => ({ ...previous, specialty: String(item.value) }));
              resetPractitioners();
            }}
            placeholder={
              isLoadingSpecialties
                ? 'Loading specialties...'
                : specialtyOptions.length === 0
                  ? 'No specialties found'
                  : 'Choose specialty'
            }
            disabled={isLoadingSpecialties || specialtyOptions.length === 0}
            loading={isLoadingSpecialties}
            searchable
            hasMore={specialtyHasMore}
            onFetchMore={() => {
              if (specialtiesList?.links?.next) {
                const { page } = extractPaginationFromLink(specialtiesList.links.next);
                setSpecialtyPage(page);
              }
            }}
          />
        )}

        {isDepartmentsType && departmentId && formItem.specialty && (
          <div className="linked-items-practitioner-section">
            <div className="linked-items-section-title">
              <Translate>Practitioners</Translate>
              <span className="linked-items-section-readonly"> (Read only)</span>
            </div>
            <MyTable
              height={240}
              loading={isLoadingPractitioners}
              data={practitionerTableData}
              columns={practitionerColumns}
              page={practitionerPagination.page}
              rowsPerPage={practitionerPagination.size}
              totalCount={practitionerTotalCount}
              onPageChange={handlePractitionerPageChange}
              onRowsPerPageChange={handlePractitionerRowsPerPageChange}
            />
            {!isLoadingPractitioners && practitionerTotalCount === 0 && (
              <div className="linked-items-empty-practitioners">
                <Translate>No practitioners found for this specialty</Translate>
              </div>
            )}
          </div>
        )}

        {isDepartmentsType && !departmentId && (
          <div className="linked-items-practitioner-hint">
            <Translate>Select a department to load specialties</Translate>
          </div>
        )}
      </div>
    </Form>
  );

  useEffect(() => {
    let ignore = false;

    if (!openChildModal || !formItem.type || facilityId == null) {
      setSources([]);
      return;
    }

    setSources([]);
    triggerFetchSources({ type: String(formItem.type), facilityId: Number(facilityId) }, false)
      .unwrap()
      .then(res => {
        if (!ignore) setSources(Array.isArray(res) ? res : []);
      })
      .catch(() => {
        if (!ignore) setSources([]);
      });

    return () => {
      ignore = true;
    };
  }, [openChildModal, formItem.type, facilityId, triggerFetchSources]);

  useEffect(() => {
    resetSpecialties();
    if (!openChildModal || !departmentId) return;

    triggerSpecialtiesByDept({ departmentId, page: 0, size: SPECIALTY_PAGE_SIZE, sort: 'id,asc' })
      .unwrap()
      .then(res => mergeSpecialtyOptions(res?.data ?? []))
      .catch(() => setSpecialtyOptions([]));
  }, [openChildModal, departmentId, triggerSpecialtiesByDept]);

  useEffect(() => {
    if (!openChildModal || !departmentId || specialtyPage === 0) return;

    triggerSpecialtiesByDept({
      departmentId,
      page: specialtyPage,
      size: SPECIALTY_PAGE_SIZE,
      sort: 'id,asc'
    })
      .unwrap()
      .then(res => mergeSpecialtyOptions(res?.data ?? []))
      .catch(() => undefined);
  }, [specialtyPage, departmentId, openChildModal, triggerSpecialtiesByDept]);

  useEffect(() => {
    const specialty = String(formItem.specialty ?? '').trim();

    if (!openChildModal || !departmentId || !specialty) {
      applyPractitionerPage([], 0);
      return;
    }

    triggerPractitionersBySpecialty({
      departmentId,
      specialty,
      page: practitionerPagination.page,
      size: practitionerPagination.size,
      sort: practitionerPagination.sort
    })
      .unwrap()
      .then(res => applyPractitionerPage(res?.data ?? [], res?.totalCount ?? 0, res?.links ?? {}))
      .catch(() => {
        // Same fallback as the service Linked Items: load the department
        // practitioners and filter them by specialty on the client.
        triggerPractitionersBySpecialty({ departmentId, page: 0, size: 200, sort: 'id,asc' })
          .unwrap()
          .then(res => {
            const filtered = (res?.data ?? []).filter(
              (practitioner: any) => String(practitioner?.specialty ?? '') === specialty
            );
            const start = practitionerPagination.page * practitionerPagination.size;
            applyPractitionerPage(
              filtered.slice(start, start + practitionerPagination.size),
              filtered.length
            );
          })
          .catch(() => applyPractitionerPage([], 0));
      });
  }, [
    openChildModal,
    departmentId,
    formItem.specialty,
    practitionerPagination.page,
    practitionerPagination.size,
    practitionerPagination.sort,
    practitionerPagination.timestamp,
    triggerPractitionersBySpecialty
  ]);

  useEffect(() => {
    if (!departmentIds.length) return;

    getDepartmentsBulk(departmentIds)
      .unwrap()
      .then(res => {
        const map: Record<number, string> = {};
        res.forEach((department: any) => {
          map[department.id] = department.name;
        });
        setDepartmentsMap(map);
      })
      .catch(() => setDepartmentsMap({}));
  }, [departmentIds, getDepartmentsBulk]);

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

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
        childTitle={mode === 'create' ? 'Link New Item to Procedure' : 'Edit Linked Item'}
        childContent={<div dir={dir}>{conjureFormChildContent()}</div>}
        mainSize="sm"
        childSize="lg"
        childBodyHeight="80vh"
        actionChildButtonLabel="Save"
        mainStep={[{ title: 'Linked Items', icon: <MdMedicalServices /> }]}
        childStep={[{ title: mode === 'create' ? 'Item' : 'Edit', icon: <MdMedicalServices /> }]}
      />
      <DeletionConfirmationModal
        open={openConfirmToggle}
        setOpen={setOpenConfirmToggle}
        itemToDelete="Procedure Item"
        actionButtonFunction={handleToggle}
        actionType={toggleAction}
      />
    </>
  );
};

export default LinkProcedureItems;
