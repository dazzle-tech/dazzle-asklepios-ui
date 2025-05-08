import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import {
  useGetCdtsQuery,
  useSaveCdtMutation,
  useGetLovValuesByCodeQuery,
} from '@/services/setupService';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MyTable from '@/components/MyTable';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import EditIcon from '@rsuite/icons/Edit';
import TrashIcon from '@rsuite/icons/Trash';
import { ApCdt } from '@/types/model-types';
import { newApCdt } from '@/types/model-types-constructor';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { addFilterToListRequest, fromCamelCaseToDBName } from '@/utils';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyButton from '@/components/MyButton/MyButton';
import MyModal from '@/components/MyModal/MyModal';
import { faTooth } from '@fortawesome/free-solid-svg-icons';
import LinkedServices from './LinkedServices';
const CDTSetup = () => {
  const dispatch = useAppDispatch();
  const [cdt, setCdt] = useState<ApCdt>({ ...newApCdt });
  const [popupOpen, setPopupOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [saveCdt, saveCdtMutation] = useSaveCdtMutation();
  // Initial table request with default filter 
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });

  // State to handle the filter form inputs
  const [record, setRecord] = useState({ filter: '', value: '' });

  // Header page setUp
  const divContent = (
    <div style={{ display: 'flex' }}>
      <h5>CDT Codes</h5>
    </div>
  );
  const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
  dispatch(setPageCode('CDT_Codes'));
  dispatch(setDivContent(divContentHTML));

  // Fetch cdt List Response
  const { data: cdtListResponse, isLoading } = useGetCdtsQuery(listRequest);
  // Fetch LOV data for various fields
  const { data: cdtTypeLovQueryResponse } = useGetLovValuesByCodeQuery('CDT_TYPE');
  const { data: cdtClassLovQueryResponse } = useGetLovValuesByCodeQuery('CDT_CLASS');
  // Function to check if the current row is the selected one
  const isSelected = rowData => {
    if (rowData && cdt && rowData.key === cdt.key) {
      return 'selected-row';
    } else return '';
  };
  //Handle New Cdt Object
  const handleNew = () => {
    setCdt({ ...newApCdt });
    setPopupOpen(true);
  };
  // Handle Save Cdt Object
  const handleSave = () => {
    setPopupOpen(false);
    saveCdt(cdt).unwrap();
  };
  // Handle changes in filter fields
  const handleFilterChange = (fieldName, value) => {
    if (value) {
      // Add new filter to the list request
      setListRequest(
        addFilterToListRequest(
          fromCamelCaseToDBName(fieldName),
          'startsWithIgnoreCase',
          value,
          listRequest
        )
      );
    } else {
      // Reset to default filter if value is empty
      setListRequest({
        ...listRequest, filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
      });
    }
  };

  // Change page event handler
  const handlePageChange = (_: unknown, newPage: number) => {
    setListRequest({ ...listRequest, pageNumber: newPage + 1 });
  };
  // Change number of rows per page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setListRequest({
      ...listRequest,
      pageSize: parseInt(event.target.value, 10),
      pageNumber: 1 // Reset to first page
    });
  };

  // Available fields for filtering
  const filterFields = [
    { label: 'Code', value: 'cdtCode' },
    { label: 'Description', value: 'description' },
    { label: 'Class', value: 'classLkey' }
  ];
  // Table columns definition
  const columns = [
    {
      key: 'cdtCode',
      title: 'Code',
      render: (rowData) => rowData?.cdtCode ?? 'N/A',
    },
    {
      key: 'description',
      title: 'Description',
      render: (rowData) => rowData?.description ?? 'N/A',
    },
    {
      key: 'classLkey',
      title: 'Class',
      render: (rowData) =>
        rowData.classLvalue
          ? rowData.classLvalue.lovDisplayVale
          : rowData.classLkey,
    }
  ];
  // Filter form rendered above the table
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={record}
        setRecord={(updatedRecord) => {
          setRecord({
            ...record,
            filter: updatedRecord.filter,
            value: '' // Clear the text input whenever filter is changed
          });
        }}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
      />

      <MyInput
        fieldName="value"
        fieldType="text"
        record={record}
        setRecord={setRecord}
        showLabel={false}
        placeholder="Search"
      />
    </Form>
  );

  // Pagination values
  const pageIndex = listRequest.pageNumber - 1;
  const rowsPerPage = listRequest.pageSize;
  const totalCount = cdtListResponse?.extraNumeric ?? 0;

  // MyModal content 
  const modalContent = (
    <Form fluid layout='inline'>
      <MyInput
        width={350}
        column
        fieldName="typeLkey"
        fieldType="select"
        selectData={cdtTypeLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={cdt}
        setRecord={setCdt}
      />
      <MyInput
        width={350}
        column
        fieldLabel="CDT Code"
        fieldName="cdtCode"
        record={cdt}
        setRecord={setCdt}
      />
      <MyInput
        width={350}
        column
        fieldName="classLkey"
        fieldType="select"
        selectData={cdtClassLovQueryResponse?.object ?? []}
        selectDataLabel="lovDisplayVale"
        selectDataValue="key"
        record={cdt}
        setRecord={setCdt}
      />
      <MyInput
        width={350}
        column
        fieldType="textarea"
        fieldName="description"
        record={cdt}
        setRecord={setCdt}
      />
    </Form>
  );

  // Effects
  useEffect(() => {
    if (record['filter']) {
      handleFilterChange(record['filter'], record['value']);
    } else {
      // reset the listRequest if filter is cleared
      setListRequest({
        ...initialListRequest,
        filters: [
          {
            fieldName: 'deleted_at',
            operator: 'isNull',
            value: undefined
          }
        ],
        pageSize: listRequest.pageSize,
        pageNumber: 1
      });
    }
  }, [record]);
  useEffect(() => {
    if (saveCdtMutation.data) {
      setListRequest({ ...listRequest, timestamp: new Date().getTime() });
    }
  }, [saveCdtMutation.data]);
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent("  "));
    };
  }, [location.pathname, dispatch])
  return (
    <div>
      <div className='bt-div'>
        <MyButton prefixIcon={() => <AddOutlineIcon />} backgroundColor="var(--deep-blue)" onClick={handleNew}>
          Add New
        </MyButton>
        <MyButton disabled={!cdt.key} onClick={() => setPopupOpen(true)} backgroundColor="var(--deep-blue)" prefixIcon={() => <EditIcon />}>
          Edit Selected
        </MyButton>
        <MyButton disabled={true || !cdt.key} backgroundColor="var(--primary-pink)" prefixIcon={() => <TrashIcon />}>
          Delete Selected
        </MyButton>
        <MyButton disabled={!cdt.key} onClick={() => setServicesOpen(true)} backgroundColor="var(--light-blue)">
          Linked Services
        </MyButton>
      </div>
      <hr />
      <MyTable
        data={cdtListResponse?.object ?? []}
        columns={columns}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowClassName={isSelected}
        onRowClick={rowData => { setCdt(rowData) }}
        loading={isLoading}
      />
      <MyModal
        open={popupOpen}
        setOpen={setPopupOpen}
        title={<Translate>New/Edit Cdt</Translate>}
        content={modalContent}
        hideBack={true}
        actionButtonLabel="Save"
        actionButtonFunction={handleSave}
        size="xs"
        position='right'
        bodyheight={550}
        steps={[{ title: 'CDT', icon:<FontAwesomeIcon icon={ faTooth }/>}]}
      />
      <LinkedServices open={servicesOpen} setOpen={setServicesOpen} cdt={cdt} setCdt={setCdt} />
    </div>
  );
};

export default CDTSetup;
