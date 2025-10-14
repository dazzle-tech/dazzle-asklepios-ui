// src/features/services/ServiceSetup.tsx
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
import { useEnumOptions} from '@/services/enumsApi';

const ServiceSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  // ---------------- state ----------------
  const [service, setService] = useState<Service>({ ...newService });
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const serviceCategoryOptions = useEnumOptions('ServiceCategory');

  // فلترة
  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);

  // ترقيم الصفحات/الفرز
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now(),
  });

  // --------------- Header ----------------
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

  // --------------- window resize ----------
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // --------------- Data -------------------
  const { data: servicesPage, isFetching } = useGetServicesQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
  });

  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : servicesPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, servicesPage?.totalCount]
  );
  const tableData = useMemo(
    () => (isFiltered ? filteredData : servicesPage?.data ?? []),
    [isFiltered, filteredData, servicesPage?.data]
  );

  // --------------- Mutations --------------
  const [addService, addServiceMutation] = useAddServiceMutation();
  const [updateService, updateServiceMutation] = useUpdateServiceMutation();
  const [toggleServiceIsActive] = useToggleServiceIsActiveMutation();

  // Lazy queries للفلاتر
  const [fetchByCategory] = useLazyGetServicesByCategoryQuery();
  const [fetchByCode] = useLazyGetServicesByCodeQuery();
  const [fetchByName] = useLazyGetServicesByNameQuery();

  // بعد الإضافة/التحديث رجّع حمّل الصفحة
  useEffect(() => {
    if (addServiceMutation.data || updateServiceMutation.data) {
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
    }
  }, [addServiceMutation.data, updateServiceMutation.data]);

  // --------------- Helpers ----------------
  const filterFields = [
    { label: 'Category', value: 'category' },
    { label: 'Name', value: 'name' },
    { label: 'Code', value: 'code' },
  ];

  const handleNew = () => {
    setService({ ...newService });
    setPopupOpen(true);
  };

  const handleSave = () => {
    setPopupOpen(false);

    const isUpdate = !!service.id;
    // Coerce price if it arrives as string from MyInput(number)
    const payload: any = {
      ...service,
      price: typeof (service as any).price === 'string' ? Number((service as any).price) : (service as any).price,
    };

    (isUpdate ? updateService(payload) : addService(payload))
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: isUpdate ? 'Service updated successfully' : 'Service added successfully',
            sev: 'success',
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: isUpdate ? 'Failed to update service' : 'Failed to add service',
            sev: 'error',
          })
        );
      });
  };

  const handleDeactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id) return;
    toggleServiceIsActive(service.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Service deactivated successfully', sev: 'success' }));
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate service', sev: 'error' }));
      });
  };

  const handleReactivate = () => {
    setOpenConfirmDeleteService(false);
    if (!service?.id) return;
    toggleServiceIsActive(service.id)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Service reactivated successfully', sev: 'success' }));
        setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate service', sev: 'error' }));
      });
  };

  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      return;
    }
    try {
      let resp: { data: any[]; totalCount: number } | undefined;

      if (fieldName === 'category') {
        resp = await fetchByCategory({
          category: String(value).toUpperCase(),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'code') {
        resp = await fetchByCode({
          code: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      } else if (fieldName === 'name') {
        resp = await fetchByName({
          name: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort,
        }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setIsFiltered(true);
    } catch (e) {
      // reset لو صار خطأ
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
    }
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now(),
    }));
  };

  const isSelected = (rowData: any) => (rowData?.id === service?.id ? 'selected-row' : '');

  const iconsForActions = (rowData: Service) => (
    <div className="container-of-icons">
      <MdMedicalServices
        className="icons-style"
        title="Linked Items"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setService(rowData);
          setProceduresOpen(true);
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
      flexGrow: 2,
      render: (row: any) => (row?.isActive ? 'Active' : 'Inactive'),
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => iconsForActions(row),
    },
  ];

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

      {/* لو كان category، خليه select بقيم enum عندك */}
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
      >
        Search
      </MyButton>
    </Form>
  );

  return (
    <Panel>
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

      <LinkedItems open={proceduresOpen} setOpen={setProceduresOpen} />
    </Panel>
  );
};

export default ServiceSetup;
