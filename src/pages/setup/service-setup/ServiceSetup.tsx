import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdMedicalServices } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import {
  useGetServicesQuery,
  useSaveServiceMutation,
} from '@/services/setupService';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { ApService } from '@/types/model-types';
import { newApService } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import AddEditService from './AddEditService';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { notify } from '@/utils/uiReducerActions';
import MyButton from '@/components/MyButton/MyButton';
import LinkedItems from './LinkedItems';
import './styles.less';
const ServiceSetup = () => {
  const dispatch = useAppDispatch();
  const [service, setService] = useState<ApService>({ ...newApService });
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteService, setOpenConfirmDeleteService] = useState<boolean>(false);
  const [stateOfDeleteService, setStateOfDeleteService] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 15
  });
  // Fetch service list response
  const { data: serviceListResponse, isFetching } = useGetServicesQuery(listRequest);
  // save service
  const [saveService, saveServiceMutation] = useSaveServiceMutation();
   // Header page setUp
  const divContent = (
    <div className='title-service'>
      <h5>Services</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('Services'));
  dispatch(setDivContent(divContentHTML));
  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = serviceListResponse?.extraNumeric ?? 0;
  // Available fields for filtering
  const filterFields = [
    { label: 'Type', value: 'typeLkey' },
    { label: 'Service Name', value: 'name' },
    { label: 'Abbreviation', value: 'abbreviation' },
    { label: 'Code', value: 'code' },
    { label: 'Category', value: 'categoryLkey' },
    { label: 'Price', value: 'price' },
    { label: 'Currency', value: 'currencyLkey' }
  ];
   // class name for selected row
   const isSelected = rowData => {
    if (rowData && service && rowData.key === service.key) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit,Linked Items, reactive/Deactivate)
  const iconsForActions = (rowData: ApService) => (
    <>
      <MdMedicalServices
        className="icons-service"
        title="Linked Items"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setProceduresOpen(true)}
      />
      <MdModeEdit
        className="icons-service"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isValid ? (
        <MdDelete
          className="icons-service"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteService('deactivate');
            setOpenConfirmDeleteService(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-service"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteService('reactivate');
            setOpenConfirmDeleteService(true);
          }}
        />
      )}
      </>
  );
  //Table columns
  const tableColumns = [
    {
      key: 'typeLkey',
      title: <Translate>Type</Translate>,
      flexGrow: 4,
      render: rowData => (rowData.typeLvalue ? rowData.typeLvalue.lovDisplayVale : rowData.typeLkey)
    },
    {
      key: 'name',
      title: <Translate>Service Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'abbreviation',
      title: <Translate>Abbreviation</Translate>,
      flexGrow: 4
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      flexGrow: 4
    },
    {
      key: 'categoryLkey',
      title: <Translate>Category</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.categoryLvalue ? rowData.categoryLvalue.lovDisplayVale : rowData.categoryLkey
    },
    {
      key: 'price',
      title: <Translate>Price</Translate>,
      flexGrow: 4
    },
    {
      key: 'currencyLkey',
      title: <Translate>Currency</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.currencyLvalue ? rowData.currencyLvalue.lovDisplayVale : rowData.currencyLkey
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  // Filter table
  const filters = () => (
    <Form layout="inline" fluid className="container-of-filter-fields-service ">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={updatedRecord => {
          setRecordOfFilter({
            ...recordOfFilter,
            filter: updatedRecord.filter,
            value: ''
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />
      <MyInput
        fieldName="value"
        fieldType="text"
        record={recordOfFilter}
        setRecord={setRecordOfFilter}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  // Handle page change in navigation
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Handle change rows per page in navigation
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1
    });
  };
   // handle save service
   const handleSave = () => {
    setPopupOpen(false);
    saveService(service)
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Service has been saved successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Service', sev: 'error' }));
      });
  };

  // handle deactivate service
  const handleDeactivate = () => {
    setOpenConfirmDeleteService(false);
    saveService({ ...service, isValid: false })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Service was successfully Deactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Deactivate this Service',
            sev: 'error'
          })
        );
      });
  };
  // handle reactivate service
  const handleReactivate = () => {
    setOpenConfirmDeleteService(false);
    saveService({ ...service, isValid: true })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The Service was successfully Reactivated',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Faild to Reactivate this Service',
            sev: 'error'
          })
        );
      });
  };

  // handle click on add new button
  const handleNew = () => {
    setService({ ...newApService });
    setPopupOpen(true);
  };

  // handle filter change
   const handleFilterChange = (fieldName, value) => {
    if (value) {
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      setListRequest({ ...listRequest, filters: [] });
    }
  };

  //Effects
   // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  // update list when the service is saved
  useEffect(() => {
    if (saveServiceMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveServiceMutation.data]);
  // update list when the filter is changed
  useEffect(() => {
    if (recordOfFilter['filter']) {
      handleFilterChange(recordOfFilter['filter'], recordOfFilter['value']);
    } else {
      setListRequest({
        ...initialListRequest,
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [recordOfFilter]);

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>
      <div className="container-of-add-new-button-service">
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
        height={450}
        data={serviceListResponse?.object ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setService(rowData);
        }}
        sortColumn={listRequest.sortBy}
        sortType={listRequest.sortType}
        onSortChange={(sortBy, sortType) => {
          if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
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
        actionButtonFunction={
          stateOfDeleteService == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteService}
      />
      <LinkedItems open={proceduresOpen} setOpen={setProceduresOpen} />
    </Panel>
  );
};

export default ServiceSetup;
