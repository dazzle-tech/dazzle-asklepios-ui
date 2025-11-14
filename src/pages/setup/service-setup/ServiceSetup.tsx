import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete, MdMedicalServices } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditService from './AddEditService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import LinkedItems from './LinkedItems';
import './styles.less';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import {
  // Main list (no facility)
  useGetAllServicesQuery,
  // By facility
  useGetServicesQuery,
  useLazyGetServicesQuery,
  // Mutations
  useAddServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceIsActiveMutation,
  // Filters
  useLazyGetServicesByCategoryQuery,
  useLazyGetServicesByCodeQuery,
  useLazyGetServicesByNameQuery,
} from '@/services/setup/serviceService';
import { newService } from '@/types/model-types-constructor-new';
import { Service } from '@/types/model-types-new';
import { useEnumOptions } from '@/services/enumsApi';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { formatEnumString, conjureValueBasedOnIDFromList } from '@/utils';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

const ServiceSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Draft model (facilityId comes from modal)
  const [service, setService] = useState<Service>({ ...newService });

  // UI state
  const [popupOpen, setPopupOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  // Filter state (AgeGroup-style)
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  // Unfiltered pagination (main list via Link headers)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // Filtered pagination (independent state)
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 15,
    sort: 'id,desc',
  });

  // Mutations / Lazy Queries
  const [addService] = useAddServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [toggleServiceIsActive] = useToggleServiceIsActiveMutation();
  const [fetchByCategory] = useLazyGetServicesByCategoryQuery();
  const [fetchByCode] = useLazyGetServicesByCodeQuery();
  const [fetchByName] = useLazyGetServicesByNameQuery();
  const [fetchByFacility] = useLazyGetServicesQuery(); // lazy for /by-facility/{facilityId}

  // Enums + Facilities
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  // Main list: ALL services (no facility filter)
  const { data: pageData, isFetching, refetch } = useGetAllServicesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
  });

  // ===== Helpers to keep filtered list in sync after add/update/toggle =====
  /**
   * Checks if a service matches the currently selected filter.
   * Used to decide whether to render an upserted/updated service in the filtered view.
   */
  const matchesCurrentFilter = (svc: Service, filter: string, value: any) => {
    if (!filter && value !== 0 && !value) return true;
    switch (filter) {
      case 'facilityId':
        return Number(svc.facilityId) === Number(value);
      case 'category':
        return String(svc.category || '').toUpperCase() === String(value).toUpperCase();
      case 'code':
        return (svc.code || '').toLowerCase().includes(String(value).toLowerCase());
      case 'name':
        return (svc.name || '').toLowerCase().includes(String(value).toLowerCase());
      default:
        return true;
    }
  };

  /**
   * Inserts or updates a service inside the filtered array, keeping the current sort order.
   * Returns the new array and whether this was a brand-new addition.
   */
  const upsertIntoFiltered = (
    item: Service,
    current: Service[],
    sort: string,
    filterKey: string,
    filterVal: any
  ): { data: Service[]; added: boolean } => {
    // If it does not match the current filter, do not add it.
    if (!matchesCurrentFilter(item, filterKey, filterVal)) return { data: current, added: false };

    const idx = current.findIndex(r => r.id === item.id);
    let next = [...current];

    if (idx >= 0) {
      next[idx] = { ...next[idx], ...item };
      return { data: next, added: false };
    }

    const sortLower = (sort || '').toLowerCase();
    if (sortLower.startsWith('id,desc')) {
      next = [item, ...next];
    } else if (sortLower.startsWith('id,asc')) {
      next = [...next, item];
    } else {
      // Fallback: prepend if sort is unknown
      next = [item, ...next];
    }
    return { data: next, added: true };
  };

  /**
   * Patches a single filtered row by id (e.g., toggling isActive) without refetch.
   */
  const patchFilteredRow = (id: number, patch: Partial<Service>, current: Service[]) => {
    const idx = current.findIndex(r => r.id === id);
    if (idx < 0) return current;
    const next = [...current];
    next[idx] = { ...next[idx], ...patch };
    return next;
  };

  // ===== Derived table values =====
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : pageData?.totalCount ?? 0),
    [isFiltered, filteredTotal, pageData?.totalCount]
  );
  const links = (isFiltered ? filteredLinks : pageData?.links) || {};
  const tableData = useMemo(
    () => (isFiltered ? filteredData : pageData?.data ?? []),
    [isFiltered, filteredData, pageData?.data]
  );

  // Filters available
  const filterFields = [
    { label: 'Facility', value: 'facilityId' },
    { label: 'Category', value: 'category' },
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
  ];

  // New
  const handleNew = () => {
    setService({ ...newService });
    setPopupOpen(true);
  };

  // ===== Save (add/update) — reads facilityId from modal object =====
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!service.id;

    const resolvedFacilityIdRaw =
      service.facilityId ??
      (recordOfFilter.filter === 'facilityId' && recordOfFilter.value != null
        ? recordOfFilter.value
        : undefined);

    const effectiveFacilityId = Number(resolvedFacilityIdRaw);

    if (!Number.isFinite(effectiveFacilityId)) {
      dispatch(notify({ msg: 'Please select a facility.', sev: 'error' }));
      return;
    }

    const payloadBody: any = {
      ...service,
      facilityId: effectiveFacilityId,
      price:
        typeof (service as any).price === 'string'
          ? Number((service as any).price)
          : (service as any).price,
    };

    try {
      let saved: Service;
      if (isUpdate) {
        saved = await updateService({
          id: service.id!,
          facilityId: effectiveFacilityId,
          ...payloadBody,
        }).unwrap();

        dispatch(notify({ msg: 'Service updated successfully', sev: 'success' }));
      } else {
        saved = await addService({
          facilityId: effectiveFacilityId,
          ...payloadBody,
        }).unwrap();

        dispatch(notify({ msg: 'Service added successfully', sev: 'success' }));
      }

      if (isFiltered) {
        const { data: nextData, added } = upsertIntoFiltered(
          saved,
          filteredData,
          filterPagination.sort || 'id,desc',
          recordOfFilter.filter,
          recordOfFilter.value
        );
        setFilteredData(nextData);
        if (added) setFilteredTotal(prev => prev + 1);
      } else {
        setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
        refetch();
      }
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          name: 'Name',
          code: 'Code',
          category: 'Category',
          price: 'Price',
          currency: 'Currency',
          abbreviation: 'Abbreviation',
          isActive: 'Active',
          facilityId: 'Facility',
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater')) return 'value is too small';
          if (m.includes('must be less')) return 'value is too large';
          return msg || 'invalid value';
        };
        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });
        const humanMsg = `Please fix the following fields:\n${lines.join('\n')}`;
        dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;
      const keyMap: Record<string, string> = {
        facilityrequired: 'Facility id is required.',
        'payload.required': 'Service payload is required.',
        'unique.facility.name': 'Service name already exists in this facility.',
        'fk.facility.notfound': 'Facility not found.',
        'db.constraint': 'Database constraint violation.',
      };
      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        'Unexpected error';
      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };


  // ===== Activate/Deactivate (keeps filtered list updated locally) =====
  const handleDeactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id) return;
    toggleServiceIsActive({ id: service.id })
      .unwrap()
      .then((toggled: Service | void) => {
        dispatch(notify({ msg: 'Service deactivated successfully', sev: 'success' }));

        if (isFiltered) {
          // If API returns the updated entity, upsert it; otherwise patch isActive locally.
          if (toggled && typeof (toggled as any).id !== 'undefined') {
            const { data: nextData } = upsertIntoFiltered(
              toggled as Service,
              filteredData,
              filterPagination.sort || 'id,desc',
              recordOfFilter.filter,
              recordOfFilter.value
            );
            setFilteredData(nextData);
          } else {
            setFilteredData(prev => patchFilteredRow(service.id!, { isActive: false }, prev));
          }
        } else {
          refetch();
        }
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate service', sev: 'error' }));
      });
  };

  const handleReactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id) return;
    toggleServiceIsActive({ id: service.id })
      .unwrap()
      .then((toggled: Service | void) => {
        dispatch(notify({ msg: 'Service reactivated successfully', sev: 'success' }));

        if (isFiltered) {
          if (toggled && typeof (toggled as any).id !== 'undefined') {
            const { data: nextData } = upsertIntoFiltered(
              toggled as Service,
              filteredData,
              filterPagination.sort || 'id,desc',
              recordOfFilter.filter,
              recordOfFilter.value
            );
            setFilteredData(nextData);
          } else {
            setFilteredData(prev => patchFilteredRow(service.id!, { isActive: true }, prev));
          }
        } else {
          refetch();
        }
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate service', sev: 'error' }));
      });
  };

  // ===== Filtering (Facility/Category/Name/Code) =====
  const runFilterQuery = async (
    fieldName: string,
    value: any,
    page = 0,
    size = paginationParams.size,
    sort?: string
  ) => {
    if (!value && value !== 0) return undefined;
    const effectiveSort = sort ?? (isFiltered ? filterPagination.sort : paginationParams.sort);

    if (fieldName === 'facilityId') {
      // by facility (uses getServices endpoint)
      return await fetchByFacility({
        facilityId: Number(value),
        page,
        size,
        sort: effectiveSort,
      }).unwrap();
    } else if (fieldName === 'category') {
      return await fetchByCategory({
        category: String(value).toUpperCase(),
        page,
        size,
        sort: effectiveSort,
      }).unwrap();
    } else if (fieldName === 'code') {
      return await fetchByCode({ code: value, page, size, sort: effectiveSort }).unwrap();
    } else if (fieldName === 'name') {
      return await fetchByName({ name: value, page, size, sort: effectiveSort }).unwrap();
    }
    return undefined;
  };

  // Reset to main list (Link headers)
  const resetToUnfiltered = () => {
    setIsFiltered(false);
    setFilteredData([]);
    setFilteredTotal(0);
    setFilteredLinks(undefined);
    setFilterPagination(prev => ({ ...prev, page: 0, sort: 'id,desc' }));
    setPaginationParams(prev => ({ ...prev, page: 0, sort: 'id,asc', timestamp: Date.now() }));
    refetch();
  };

  // Apply/Clear filters
  const handleFilterChange = async (
    fieldName: string,
    value: any,
    page = 0,
    size = filterPagination.size,
    sort = filterPagination.sort
  ) => {
    if (!value && value !== 0) {
      resetToUnfiltered();
      return;
    }
    try {
      const resp = await runFilterQuery(fieldName, value, page, size, sort);
      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setFilterPagination(prev => ({ ...prev, page, size, sort }));
    } catch {
      resetToUnfiltered();
    }
  };

  // Pagination
  const handlePageChange = (_: unknown, newPage: number) => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        recordOfFilter.value,
        newPage,
        filterPagination.size,
        filterPagination.sort
      );
      return;
    }

    const currentPage = paginationParams.page;
    const linksMap = links || {};
    let targetLink: string | null | undefined = null;
    if (newPage > currentPage && linksMap.next) targetLink = linksMap.next;
    else if (newPage < currentPage && linksMap.prev) targetLink = linksMap.prev;
    else if (newPage === 0 && linksMap.first) targetLink = linksMap.first;
    else if (newPage > currentPage + 1 && linksMap.last) targetLink = linksMap.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({ ...prev, page, size, timestamp: Date.now() }));
    }
  };

  // Rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    if (isFiltered) {
      setFilterPagination(prev => ({ ...prev, size: newSize, page: 0 }));
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize, filterPagination.sort);
    } else {
      setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
    }
  };

  // Selected row class
  const isSelected = (rowData: any) => (rowData?.id === service?.id ? 'selected-row' : '');

  // Row action icons
  const iconsForActions = (rowData: Service) => (
    <div className="container-of-icons">
      <MdMedicalServices
        className="icons-style"
        title="Linked Items"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setService(rowData);
          setAddItemOpen(true);
        }}
      />
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setService(rowData);
          setPopupOpen(true);
        }}
      />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setService(rowData);
            setStateOfDeleteService('deactivate');
            setOpenConfirmDeleteService(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setService(rowData);
            setStateOfDeleteService('reactivate');
            setOpenConfirmDeleteService(true);
          }}
        />
      )}
    </div>
  );

  // Table columns (with Facility name)
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      flexGrow: 4,
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(facilityListResponse ?? [], row?.facilityId, 'name')}
        </span>
      ),
    },
    { key: 'name', title: <Translate>Service Name</Translate>, flexGrow: 4 },
    { key: 'abbreviation', title: <Translate>Abbreviation</Translate>, flexGrow: 3 },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 3 },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      flexGrow: 3,
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : ''),
    },
    { key: 'price', title: <Translate>Price</Translate>, flexGrow: 2 },
    {
      key: 'currency',
      title: <Translate>Currency</Translate>,
      flexGrow: 2,
      render: (row: any) => row?.currency || '',
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 100,
      render: (row: any) => (
        <MyBadgeStatus
          contant={row?.isActive ? 'Active' : 'Inactive'}
          color={row?.isActive ? '#415be7' : '#b1acacff'}
        />
      ),
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => iconsForActions(row),
    },
  ];

  // Filters UI
  const filters = () => {
    const selectedFilter = recordOfFilter.filter;
    let dynamicInput: React.ReactNode;

    if (selectedFilter === 'facilityId') {
      dynamicInput = (
        <MyInput
          width={250}
          fieldLabel=""
          fieldName="value"
          fieldType="select"
          selectData={facilityListResponse ?? []}
          selectDataLabel="name"
          selectDataValue="id"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
        />
      );
    } else if (selectedFilter === 'category') {
      dynamicInput = (
        <MyInput
          width={220}
          fieldName="value"
          fieldLabel=""
          fieldType="select"
          selectData={serviceCategoryOptions ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          searchable={false}
        />
      );
    } else {
      dynamicInput = (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Value"
          width={220}
        />
      );
    }

    return (
      <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
        <MyInput
          selectDataValue="value"
          selectDataLabel="label"
          selectData={filterFields}
          fieldName="filter"
          fieldType="select"
          record={recordOfFilter}
          setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
          showLabel={false}
          placeholder="Select Filter"
          searchable={false}
          width="170px"
        />
        {dynamicInput}
        <MyButton
          color="var(--deep-blue)"
          onClick={() => {
            if (!recordOfFilter.value && recordOfFilter.value !== 0) {
              resetToUnfiltered();
            } else {
              handleFilterChange(
                recordOfFilter.filter,
                recordOfFilter.value,
                0,
                filterPagination.size,
                filterPagination.sort || 'id,desc'
              );
            }
          }}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );
  };

  // Effects
  useEffect(() => {
    const divContent = 'Services';
    dispatch(setPageCode('Services'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Auto revert if filter value cleared
  useEffect(() => {
    if (!recordOfFilter.value && recordOfFilter.value !== 0 && isFiltered) {
      resetToUnfiltered();
    }
  }, [recordOfFilter.value]);


  return (
    <Panel>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={row => setService(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="109px"
            >
              Add New
            </MyButton>
          </div>
        }
      />
      <AddEditService
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        service={service}
        setService={setService}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteService}
        setOpen={setOpenConfirmDeleteService}
        itemToDelete="Service"
        actionButtonFunction={stateOfDeleteService === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={stateOfDeleteService}
      />
      <LinkedItems
        open={addItemOpen}
        setOpen={setAddItemOpen}
        serviceId={service?.id}
        facilityId={service?.facilityId}
      />
    </Panel>
  );
};

export default ServiceSetup;
