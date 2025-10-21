import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import { MdModeEdit, MdDelete, MdMedicalServices } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReactDOMServer from 'react-dom/server';
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
  const [addService, addServiceMutation] = useAddServiceMutation();
  const [updateService, updateServiceMutation] = useUpdateServiceMutation();
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
    price: typeof (service as any).price === 'string'
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
    const status = err?.status;
    const backendMsg =
      err?.data?.message || err?.data?.detail || err?.data?.title || '';

    if (status === 409) {
      dispatch(
        notify({
          msg: 'A service with the same name already exists in this facility.',
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
          msg: backendMsg || 'Service or Facility not found.',
          sev: 'error',
        })
      );
    } else {
      dispatch(
        notify({
          msg: backendMsg || 'Unexpected error. Please try again.',
          sev: 'error',
        })
      );
    }
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
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      refetch();
      return;
    }
    try {
      let resp: { data: any[]; totalCount: number } | undefined;

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
      setIsFiltered(true);
      setPaginationParams(prev => ({ ...prev, page: 0 }));
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      refetch();
    }
  };
  // page change
  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };
  // rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
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
      render: (row: any) => row?.category ?? row?.categoryLkey ?? '',
    },
    { key: 'price', title: <Translate>Price</Translate>, flexGrow: 2 },
    {
      key: 'currency',
      title: <Translate>Currency</Translate>,
      flexGrow: 2,
      render: (row: any) => row?.currency ?? row?.currencyLkey ?? '',
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
      setPaginationParams(prev => ({ ...prev, page: 0 }));
      if (facilityId) refetch();
    }
  }, [recordOfFilter.value, facilityId]);
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>Services</h5>
      </div>
    );
    dispatch(setPageCode('Services'));
    dispatch(setDivContent(ReactDOMServer.renderToStaticMarkup(divContent)));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);
  useEffect(() => {
    if (addServiceMutation.data || updateServiceMutation.data) {
      refetch();
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
    }
  }, [addServiceMutation.data, updateServiceMutation.data]);
console.log("tableData==>",tableData);
  return (
    <Panel>
      <div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
          disabled={!facilityId}
        >
          Add New
        </MyButton>
      </div>
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
