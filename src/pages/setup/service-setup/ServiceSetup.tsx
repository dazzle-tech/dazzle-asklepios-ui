import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit, MdDelete, MdMedicalServices, MdLocalOffer } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditService from './AddEditService';
import PriceListPrompt, { usePriceListPrompt } from '@/components/PriceListPrompt';
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
  // Mutations
  useAddServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceIsActiveMutation
} from '@/services/setup/serviceService';
import { newService } from '@/types/model-types-constructor-new';
import { PolicyAssignment, Service } from '@/types/model-types-new';
import { useEnumOptions, useEnumCapitalized } from '@/services/enumsApi';
import { formatEnumString, conjureValueBasedOnIDFromList } from '@/utils';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import PolicyAssignmentManager from '@/components/PolicyAssignment/PolicyAssignmentManager';
import { faClipboardList } from '@fortawesome/free-solid-svg-icons';

const ServiceSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // Draft model (facilityId comes from modal)
  const [service, setService] = useState<Service>({ ...newService });

  // UI state
  const [popupOpen, setPopupOpen] = useState(false);
  const priceListPrompt = usePriceListPrompt();
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const [openPolicyAssignmentModal, setOpenPolicyAssignmentModal] = useState<boolean>(false);
  const [selectedServiceForPolicyAssignment, setSelectedServiceForPolicyAssignment] = useState<PolicyAssignment>(null);
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = {
    facilityId: '',
    name: '',
    abbreviation: '',
    code: '',
    category: '',
    price: '',
    currency: '',
  };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
  });

  // Mutations / Lazy Queries
  const [addService] = useAddServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [toggleServiceIsActive] = useToggleServiceIsActiveMutation();

  // Enums + Facilities
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');
  const currencyOptions = useEnumCapitalized('Currency');
  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  // Main list: ALL services (no facility filter)
  const { data: pageData, isFetching, refetch } = useGetAllServicesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    isActive: activeFilter,
    ...appliedFilters,
  });

  const totalCount = pageData?.totalCount ?? 0;
  const tableData = useMemo(() => pageData?.data ?? [], [pageData?.data]);

  // New
  const handleNew = () => {
    setService({ ...newService });
    setPopupOpen(true);
  };

  // ===== Save (add/update) — reads facilityId from modal object =====
  const handleSave = async () => {
    const isUpdate = !!service.id;

    const resolvedFacilityIdRaw = service.facilityId ?? (appliedFilters.facilityId || undefined);

    const effectiveFacilityId = Number(resolvedFacilityIdRaw);

    if (!Number.isFinite(effectiveFacilityId)) {
      dispatch(notify({ msg: 'Please select a facility.', sev: 'warning' }));
      return;
    }


    const fieldLabels = {
      name: 'Name',
      code: 'Code',
      category: 'Category',
    };

    const missingFields = Object.keys(fieldLabels).filter((key) => !service[key]);
    let messages = [];
    if (missingFields.length > 0) {
      messages = missingFields.map(
        (key) => `Field '${fieldLabels[key]}' is required`
      );
    }

    const isEmpty = (val) => val === null || val === undefined || val === '';
    const isNotEmpty = (val) => val !== null && val !== undefined && val !== '';
    if (
      service?.parallelCapacityValue === null ||
      service?.parallelCapacityValue === undefined ||
      service?.parallelCapacityValue < 1
    ) {
      messages.push(
        'Field Parallel Capacity Value is required and should be greater than or equal to 1'
      );
    }
    if (service?.appointable) {
      if (isEmpty(service?.defaultDurationMinutes) || service?.defaultDurationMinutes <= 0) {
        messages.push('Field Default Duration Minutes is required and should be greater than 0')
      }
      if (isEmpty(service?.defaultBufferBeforeMinutes) || service?.defaultBufferBeforeMinutes < 0) {
        messages.push('Field Default Buffer Before Minutes is required and should be greater then or equal 0')
      }
      if (isEmpty(service?.defaultBufferAfterMinutes) || service?.defaultBufferAfterMinutes < 0) {
        messages.push('Field Default Buffer After Minutes is required and should be greater then or equal 0')
      }
    }
    else {
      if (isNotEmpty(service?.defaultDurationMinutes) && service?.defaultDurationMinutes <= 0) {
        messages.push('Field Default Duration Minutes should be greater than 0')
      }
      if (isNotEmpty(service?.defaultBufferBeforeMinutes) && service?.defaultBufferBeforeMinutes < 0) {
        messages.push('Field Default Buffer Before Minutes should be greater then or equal 0')
      }
      if (isNotEmpty(service?.defaultBufferAfterMinutes) && service?.defaultBufferAfterMinutes < 0) {
        messages.push('Field Default Buffer After Minutes should be greater then or equal 0')
      }
    }
    if (messages.length > 0) {
      dispatch(
        notify({
          msg: messages.join(', '),
          sev: 'warning',
        })
      );

      return;
    }

    const payloadBody: any = {
      ...service,
      facilityId: effectiveFacilityId,
      price:
        typeof (service as any).price === 'string'
          ? Number((service as any).price)
          : (service as any).price,
      parallelCapacityValue: service.parallelCapacityValue ?? 1,
      defaultDurationMinutes: service?.defaultDurationMinutes,
      defaultBufferBeforeMinutes: service.defaultBufferBeforeMinutes ?? 0,
      defaultBufferAfterMinutes: service.defaultBufferAfterMinutes ?? 0,
    };

    try {
      let saved: Service;
      if (isUpdate) {
        saved = await updateService({
          id: service.id!,
          facilityId: effectiveFacilityId,
          parallelCapacityValue: service.parallelCapacityValue ?? 1,
          defaultDurationMinutes: service?.defaultDurationMinutes,
          defaultBufferBeforeMinutes: service.defaultBufferBeforeMinutes ?? 0,
          defaultBufferAfterMinutes: service.defaultBufferAfterMinutes ?? 0,
          ...payloadBody,
        }).unwrap();
        setPopupOpen(false);
        dispatch(notify({ msg: 'Service updated successfully', sev: 'success' }));
      } else {
        saved = await addService({
          facilityId: effectiveFacilityId,
          ...payloadBody,
        }).unwrap();
        setPopupOpen(false);
        dispatch(notify({ msg: 'Service added successfully', sev: 'success' }));
      }

      priceListPrompt.prompt({
        itemType: 'SERVICE',
        sourceId: saved?.id ?? service.id!,
        itemCode: payloadBody.code,
        itemName: payloadBody.name,
        unitPrice: payloadBody.price,
        facilityId: effectiveFacilityId,
        currency: payloadBody.currency
      });

      // Reload the list with the current filters
      refetch();
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
      .then(() => {
        dispatch(notify({ msg: 'Service deactivated successfully', sev: 'success' }));
        setService(prev => (prev?.id === service.id ? { ...prev, isActive: false } : prev));
        refetch();
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
      .then(() => {
        dispatch(notify({ msg: 'Service reactivated successfully', sev: 'success' }));
        setService(prev => (prev?.id === service.id ? { ...prev, isActive: true } : prev));
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate service', sev: 'error' }));
      });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
  };

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: HeaderFilterField, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  };

  const headerSearch = (field: HeaderFilterField, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field],
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field]),
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options],
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

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
      <MdLocalOffer
        className="icons-style"
        title="Price Lists"
        size={24}
        fill="var(--primary-gray)"
        onClick={() =>
          priceListPrompt.view({
            itemType: 'SERVICE',
            sourceId: rowData.id,
            itemCode: rowData.code,
            itemName: rowData.name,
            unitPrice: rowData.price,
            facilityId: rowData.facilityId,
            currency: rowData.currency
          })
        }
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
      <FontAwesomeIcon
        icon={faClipboardList}
        title="Policy Assignment"
        className="icons-style"
        style={{ color: 'var(--deep-blue)', cursor: 'pointer' }}
        size="lg"
        onClick={() => {
          setSelectedServiceForPolicyAssignment(rowData);
          setOpenPolicyAssignmentModal(true);
        }}
      />
    </div>
  );

  // Table columns (with Facility name)
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      width: 180,
      ...headerSelect(
        'facilityId',
        (facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) }))
      ),
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(facilityListResponse ?? [], row?.facilityId, 'name')}
        </span>
      ),
    },
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      width: 200,
      ...headerSearch('name', 'Search name'),
    },
    {
      key: 'abbreviation',
      title: <Translate>Abbreviation</Translate>,
      width: 140,
      ...headerSearch('abbreviation', 'Search'),
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      width: 130,
      ...headerSearch('code', 'Search code'),
    },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      width: 160,
      ...headerSelect('category', serviceCategoryOptions ?? []),
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : ''),
    },
    {
      key: 'price',
      title: <Translate>Price</Translate>,
      width: 110,
      ...headerSearch('price', 'Price'),
    },
    {
      key: 'currency',
      title: <Translate>Currency</Translate>,
      width: 120,
      ...headerSelect('currency', currencyOptions ?? []),
      render: (row: any) => row?.currency || '',
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' },
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
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

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={row => setService(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
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
      <PriceListPrompt prompt={priceListPrompt} />
      <MyModal
        open={openPolicyAssignmentModal}
        setOpen={setOpenPolicyAssignmentModal}
        title="Service Policy Assignment"
        bodyheight="70vh"
        size="70vw"
        hideBack
        hideActionBtn
        content={
          selectedServiceForPolicyAssignment ? (
            <PolicyAssignmentManager
              resourceType="SERVICE"
              resourceId={selectedServiceForPolicyAssignment.id ?? 0}
              facilityId={selectedServiceForPolicyAssignment.facilityId ?? 0}
              showHeader={false}
            />
          ) : null
        }
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
