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
  useGetServicesQuery,
  useAddServiceMutation,
  useUpdateServiceMutation,
  useToggleServiceIsActiveMutation,
  useLazyGetServicesByCategoryQuery,
  useLazyGetServicesByCodeQuery,
  useLazyGetServicesByNameQuery,
} from '@/services/setup/serviceService';
import { newService } from '@/types/model-types-constructor-new';
import { Service } from '@/types/model-types-new';
import { useEnumOptions } from '@/services/enumsApi';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { formatEnumString } from '@/utils';
const ServiceSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  const [service, setService] = useState<Service>({ ...newService, facilityId });
  const [popupOpen, setPopupOpen] = useState(false);
  const [addItemOpen, setAddItemOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined); 

  const [addService] = useAddServiceMutation();
  const [updateService] = useUpdateServiceMutation();
  const [toggleServiceIsActive] = useToggleServiceIsActiveMutation();
  const [fetchByCategory] = useLazyGetServicesByCategoryQuery();
  const [fetchByCode] = useLazyGetServicesByCodeQuery();
  const [fetchByName] = useLazyGetServicesByNameQuery();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // get enum options for ServiceCategory
  const serviceCategoryOptions = useEnumOptions('ServiceCategory');

  // fetch services
  const { data: servicesPage, isFetching, refetch } = useGetServicesQuery(
    {
      facilityId,
      page: paginationParams.page,
      size: paginationParams.size,
      sort: paginationParams.sort,
    },
    { skip: !facilityId }
  );

  // total count
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : servicesPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, servicesPage?.totalCount]
  );

  // links 
  const links = (isFiltered ? filteredLinks : servicesPage?.links) || {};

  // table data
  const tableData = useMemo(
    () => (isFiltered ? filteredData : servicesPage?.data ?? []),
    [isFiltered, filteredData, servicesPage?.data]
  );

  // filter crateria options
  const filterFields = [
    { label: 'Category', value: 'category' },
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
  ];

  // new service
  const handleNew = () => {
    setService({ ...newService, facilityId });
    setPopupOpen(true);
  };

  // save service
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!service.id;

    const payload: any = {
      ...service,
      facilityId,
      price:
        typeof (service as any).price === 'string'
          ? Number((service as any).price)
          : (service as any).price,
    };

    try {
      if (isUpdate) {
        await updateService({ facilityId, ...payload, id: service.id! }).unwrap();
        dispatch(notify({ msg: 'Service updated successfully', sev: 'success' }));
      } else {
        await addService({ facilityId, ...payload }).unwrap();
        dispatch(notify({ msg: 'Service added successfully', sev: 'success' }));
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
          if (m.includes('must be greater than') || m.includes('must be greater than or equal to'))
            return 'value is too small';
          if (m.includes('must be less than') || m.includes('must be less than or equal to'))
            return 'value is too large';
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


  // deactivate service
  const handleDeactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id || !facilityId) return;
    toggleServiceIsActive({ id: service.id, facilityId })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Service deactivated successfully', sev: 'success' }));
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate service', sev: 'error' }));
      });
  };
  // reactivate service
  const handleReactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id || !facilityId) return;
    toggleServiceIsActive({ id: service.id, facilityId })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Service reactivated successfully', sev: 'success' }));
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate service', sev: 'error' }));
      });
  };

  // filter change 
  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!facilityId) return;
    if (!value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
      return;
    }
    try {
      let resp:
        | { data: any[]; totalCount: number; links?: any }
        | undefined;

      if (fieldName === 'category') {
        resp = await fetchByCategory({
          facilityId,
          category: String(value).toUpperCase(),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'code') {
        resp = await fetchByCode({
          facilityId,
          code: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'name') {
        resp = await fetchByName({
          facilityId,
          name: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  };

  // ───────── PAGINATION─────────
  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now(),
      }));

    }
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now(),
    }));
  };

  // row selection
  const isSelected = (rowData: any) => (rowData?.id === service?.id ? 'selected-row' : '');

  // icons for actions column
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

  // table columns
  const tableColumns = [
    { key: 'name', title: <Translate>Service Name</Translate>, flexGrow: 4 },
    { key: 'abbreviation', title: <Translate>Abbreviation</Translate>, flexGrow: 3 },
    { key: 'code', title: <Translate>Code</Translate>, flexGrow: 3 },
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      flexGrow: 3,
      render: (row: any) =>row?.category ?  formatEnumString(row?.category) : '',
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

  // filter component
  const filters = () => (
    <Form layout="inline" fluid style={{ display: 'flex', gap: 10 }}>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => {
          setRecordOfFilter({ filter: updated.filter, value: '' });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />
      {recordOfFilter.filter === 'category' ? (
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
        />
      ) : (
        <MyInput
          fieldName="value"
          fieldType="text"
          record={recordOfFilter}
          setRecord={setRecordOfFilter}
          showLabel={false}
          placeholder="Enter Value"
          width={220}
        />
      )}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
        disabled={!facilityId}
      >
        Search
      </MyButton>
    </Form>
  );

  // Effects
  useEffect(() => {
    if (!recordOfFilter.value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      if (facilityId) refetch();
    }
  }, [recordOfFilter.value, facilityId]);

  useEffect(() => {
    const divContent = (
      "Services"
    );
    dispatch(setPageCode('Services'));
    dispatch(setDivContent(divContent));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    if (addService || updateService) {
      refetch();
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
    }
  }, [addService, updateService]);

  console.log('tableData==>', tableData);

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
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
          disabled={!facilityId}
        >
          Add New
        </MyButton>
      </div>}
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
        facilityId={facilityId}
      />
    </Panel>
  );
};

export default ServiceSetup;
