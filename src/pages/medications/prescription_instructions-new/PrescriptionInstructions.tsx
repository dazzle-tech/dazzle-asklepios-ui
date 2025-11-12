import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import { formatEnumString } from '@/utils';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { useAppDispatch } from '@/hooks';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditPrescriptionInstructions from './AddEditPrescriptionInstructions';
import './styles.less';
import { prescriptionInstructions } from '@/types/model-types-new';
import { newPrescriptionInstructions } from '@/types/model-types-constructor-new';
import { useGetAllPrescriptionInstructionsQuery, useLazyGetPrescriptionInstructionsByCategoryQuery, useLazyGetPrescriptionInstructionsByFrequencyQuery, useLazyGetPrescriptionInstructionsByRouteQuery, useLazyGetPrescriptionInstructionsByUnitQuery } from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useEnumOptions } from '@/services/enumsApi';
import { PaginationPerPage } from '@/utils/paginationPerPage';
const PrescriptionInstructions = () => {
  const dispatch = useAppDispatch();
  const [prescriptionInstructions, setPrescriptionInstructions] =
    useState<prescriptionInstructions>({ ...newPrescriptionInstructions });
  const [popupOpen, setPopupOpen] = useState(false); 
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  // Fetch  prescription instruction list response
  
  const [isFiltered, setIsFiltered] = useState<boolean>(false);
  const categoryEnumList = useEnumOptions("AgeGroupType");
    const uomEnumList = useEnumOptions("UOM");
    const routEnumList = useEnumOptions("MedRoa");
    const frequencyEnumList = useEnumOptions("MedFrequency");
  const [fetchByCategory] = useLazyGetPrescriptionInstructionsByCategoryQuery();
  const [fetchByUnit] = useLazyGetPrescriptionInstructionsByUnitQuery();
  const [fetchByRoute] = useLazyGetPrescriptionInstructionsByRouteQuery();
  const [fetchByFrequency] = useLazyGetPrescriptionInstructionsByFrequencyQuery();
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
    const [paginationParams, setPaginationParams] = useState({
      page: 0,
      size: 5,
      sort: 'id,asc',
      timestamp: Date.now()
    });
     const {data: prescriptionInstructionListResponse, refetch: refetchPrescriotionInstructions, isFetching} = useGetAllPrescriptionInstructionsQuery(paginationParams);
  const [filteredList, setFilteredList] = useState<prescriptionInstructions[]>([]);
  // Pagination values
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;
  const [links, setLinks] = useState({});
  useEffect(() => {
      setLinks(prescriptionInstructionListResponse?.links || {});
  },[prescriptionInstructionListResponse]);
  useEffect(() => {
      console.log("links");
      console.log(links);
  },[links]);
  //  const links = prescriptionInstructionListResponse?.links || {};
  const totalCount = prescriptionInstructionListResponse?.totalCount ?? 0;
 
  // Available fields for filtering
  const filterFields = [
    { label: 'Category', value: 'category' },
    { label: 'Unit', value: 'unit' },
    { label: 'Rout', value: 'rout' },
    { label: 'Frequency', value: 'frequency' },
  ];
 // Header page setUp
  const divContent = (
      "Prescription Instructions"
  );
  dispatch(setPageCode('Prescription_Instructions'));
  dispatch(setDivContent(divContent));
   // class name for selected row
   const isSelected = rowData => {
    if (rowData && prescriptionInstructions && rowData?.id === prescriptionInstructions?.id) {
      return 'selected-row';
    } else return '';
  };

  // filter query runner
  const runFilterQuery = async (fieldName: string, value: any) => {
    if (!value && value !== 0) return undefined;
    if (fieldName === 'rout') {
      return await fetchByRoute({
        route: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    } else if (fieldName === 'category') {
      return await fetchByCategory({
        category: String(value).trim(),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    } else if (fieldName === 'unit') {
      return await fetchByUnit({
        unit: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    }
    else if (fieldName === 'frequency') {
      return await fetchByFrequency({
        frequency: String(value),
        page: 0,
        size: paginationParams.size,
        sort: paginationParams.sort,
      }).unwrap();
    }
    return undefined;
  };


    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setPaginationParams({
        ...paginationParams,
        size: parseInt(event.target.value, 10),
        page: 0,
        timestamp: Date.now()
      });
    };

    // ──────────────────────────── PAGINATION ────────────────────────────
     const handlePageChange = (event: unknown, newPage: number) => {
      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        links,
        setPaginationParams
      );
    };

  // filters
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
        
        {recordOfFilter['filter'] == 'category' ? (
          <MyInput
            fieldName="value"
            fieldType="select"
            selectData={categoryEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
          />
        ) : recordOfFilter['filter'] == 'rout' ? (
        <MyInput
            fieldName="value"
            fieldType="select"
            selectData={routEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
          />
        ) : recordOfFilter['filter'] == 'unit' ? (
        <MyInput
            fieldName="value"
            fieldType="select"
            selectData={uomEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
          />
        ) : recordOfFilter['filter'] == 'frequency' ? (
        <MyInput
            fieldName="value"
            fieldType="select"
            selectData={frequencyEnumList ?? []}
              selectDataLabel="label"
              selectDataValue="value"
            record={recordOfFilter}
            setRecord={setRecordOfFilter}
            showLabel={false}
            placeholder="Enter Value"
            width={220}
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
        )
      }
  
        <MyButton
          color="var(--deep-blue)"
          onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
          width="80px"
        >
          Search
        </MyButton>
      </Form>
    );

    // Handle filter change
  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!value && value !== 0) {
      setIsFiltered(false);
      setFilteredList([]);
      setFilteredTotal(0);
      // setFilteredLinks(undefined);
      // setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      // refetchPrescriotionInstructions();
      return;
    }
    try {
      console.log("in try 1");
      const resp = await runFilterQuery(fieldName, value);
      console.log("resp");
      console.log(resp);
      setFilteredList(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setLinks(resp?.links ?? {});
      // setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      console.log("in try 2");
      // setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      console.log("in in catch");
      setIsFiltered(false);
      setFilteredList([]);
      setFilteredTotal(0);
      setLinks(prescriptionInstructionListResponse?.links || {});
      // setFilteredLinks(undefined);
      // setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetchPrescriotionInstructions();
    }
  };

  // Icons column (Edit, reactive/Deactivate)
  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
    </div>
  );

  //Table columns
  const tableColumns = [
    {
      key: 'category',
      title: <Translate>Category</Translate>,
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : '')
    },
    {
      key: 'dose',
      title: <Translate>Dose</Translate>
    },
    {
      key: 'unit',
      title: <Translate>Unit</Translate>,
      render: (row: any) => (row?.unit ? formatEnumString(row?.unit) : '')
    },
    {
      key: 'rout',
      title: <Translate>Rout</Translate>,
      render: (row: any) => (row?.rout ? formatEnumString(row?.rout) : '')
    },
    {
      key: 'frequency',
      title: <Translate>Frequency</Translate>,
      render: (row: any) => (row?.frequency ? formatEnumString(row?.frequency) : '')
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      render: () => iconsForActions()
    }
  ];
  
  // handle click on add new button
  const handleNew = () => {
    setPrescriptionInstructions({ ...newPrescriptionInstructions });
    setPopupOpen(true);
  };
  
  // Effects
  // change the width variable when the size of window is changed
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  
  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);

  return (
    <Panel>

      <MyTable
        height={450}
         totalCount={isFiltered ? filteredTotal : totalCount}
        // data={prescriptionInstructionListResponse ?? []}
        data={isFiltered ? filteredList : (prescriptionInstructionListResponse?.data ?? [])}
        //  data={isFiltered ? filteredList : [{dose: 2}]}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setPrescriptionInstructions(rowData);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        // sortColumn={listRequest.sortBy}
        // sortType={listRequest.sortType}
        // onSortChange={(sortBy, sortType) => {
        //   if (sortBy) setListRequest({ ...listRequest, sortBy, sortType });
        // }}
        // page={pageIndex}
        // rowsPerPage={rowsPerPage}
        // totalCount={totalCount}
        // onPageChange={handlePageChange}
        // onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={<div className="container-of-add-new-button">
        <MyButton
          prefixIcon={() => <AddOutlineIcon />}
          color="var(--deep-blue)"
          onClick={handleNew}
          width="109px"
        >
          Add New
        </MyButton>
      </div>}
      />
      <AddEditPrescriptionInstructions
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        prescriptionInstructions={prescriptionInstructions}
        setPrescriptionInstructions={setPrescriptionInstructions}
        refetchPrescriotionInstructions={refetchPrescriotionInstructions}
        // handleSave={handleSave}
      />
    </Panel>
  );
};

export default PrescriptionInstructions;
