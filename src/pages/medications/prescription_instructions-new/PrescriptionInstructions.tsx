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
import {
  useGetAllPrescriptionInstructionsQuery,
  useLazyGetPrescriptionInstructionsByCategoryQuery,
  useLazyGetPrescriptionInstructionsByFrequencyQuery,
  useLazyGetPrescriptionInstructionsByRouteQuery,
  useLazyGetPrescriptionInstructionsByUnitQuery
} from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useEnumOptions } from '@/services/enumsApi';
import { PaginationPerPage } from '@/utils/paginationPerPage';
import { notify } from '@/utils/uiReducerActions';
const PrescriptionInstructions = () => {
  const dispatch = useAppDispatch();
  const [prescriptionInstructions, setPrescriptionInstructions] =
    useState<prescriptionInstructions>({ ...newPrescriptionInstructions });
  const [popupOpen, setPopupOpen] = useState(false);
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [isFiltered, setIsFiltered] = useState<boolean>(false);

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
  const [filterPagination, setFilterPagination] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc'
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [filteredList, setFilteredList] = useState<prescriptionInstructions[]>([]);
  // Fetch prescription instruction list response
  const {
    data: prescriptionInstructionListResponse,
    refetch: refetchPrescriotionInstructions,
    isFetching
  } = useGetAllPrescriptionInstructionsQuery(paginationParams);

  // Fetch enum lists for filter
  const categoryEnumList = useEnumOptions('AgeGroupType');
  const uomEnumList = useEnumOptions('UOM');
  const routEnumList = useEnumOptions('MedRoa');
  const frequencyEnumList = useEnumOptions('MedFrequency');

  // Pagination values
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  const [link, setLink] = useState({});
  const totalCount = prescriptionInstructionListResponse?.totalCount ?? 0;

  // Available fields for filtering
  const filterFields = [
    { label: 'Category', value: 'category' },
    { label: 'Unit', value: 'unit' },
    { label: 'Rout', value: 'rout' },
    { label: 'Frequency', value: 'frequency' }
  ];

  // Header page setUp
  const divContent = 'Prescription Instructions';
  dispatch(setPageCode('Prescription_Instructions'));
  dispatch(setDivContent(divContent));

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && prescriptionInstructions && rowData?.id === prescriptionInstructions?.id) {
      return 'selected-row';
    } else return '';
  };

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (event, newPage) => {
    if (isFiltered) {
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, newPage);
    } else {
      PaginationPerPage.handlePageChange(
        event,
        newPage,
        paginationParams,
        link,
        setPaginationParams
      );
    }
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    if (isFiltered) {
      setFilterPagination({ ...filterPagination, sort: sortValue, page: 0 });
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
    } else {
      setPaginationParams({
        ...paginationParams,
        sort: sortValue,
        page: 0,
        timestamp: Date.now()
      });
    }
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

  // Handle filter change
  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    try {
      if (!field || !value) {
        setIsFiltered(false);
        setFilteredList([]);
        return;
      }

      const currentSize = size ?? filterPagination.size;

      let response;
      const params = {
        page,
        size: currentSize,
        sort: filterPagination.sort
      };

      if (field === 'rout') {
        response = await fetchByRoute({ rout: value, ...params }).unwrap();
      } else if (field === 'category') {
        response = await fetchByCategory({ category: value, ...params }).unwrap();
      } else if (field === 'unit') {
        response = await fetchByUnit({ unit: value, ...params }).unwrap();
      } else if (field === 'frequency') {
        response = await fetchByFrequency({ frequency: value, ...params }).unwrap();
      }

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch (error) {
      console.error('Error filtering Prescription Instructions:', error);
      dispatch(notify({ msg: 'Failed to filter Prescription Instructions', sev: 'error' }));
      setIsFiltered(false);
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

  useEffect(() => {
     if(!popupOpen && isFiltered){
      handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, filterPagination.size);
     }
  },[popupOpen]);

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

  useEffect(() => {
    setLink(prescriptionInstructionListResponse?.links);
  }, [prescriptionInstructionListResponse?.links]);

  return (
    <Panel>
      <MyTable
        height={450}
        totalCount={isFiltered ? filteredTotal : totalCount}
        data={isFiltered ? filteredList : prescriptionInstructionListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={rowData => {
          setPrescriptionInstructions(rowData);
        }}
        page={isFiltered ? filterPagination.page : pageIndex}
        rowsPerPage={isFiltered ? filterPagination.size : rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);

          if (isFiltered) {
            setFilterPagination({ ...filterPagination, size: newSize, page: 0 });
            handleFilterChange(recordOfFilter.filter, recordOfFilter.value, 0, newSize);
          } else {
            setPaginationParams({
              ...paginationParams,
              size: newSize,
              page: 0,
              timestamp: Date.now()
            });
          }
        }}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={handleSortChange}
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
      <AddEditPrescriptionInstructions
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        prescriptionInstructions={prescriptionInstructions}
        setPrescriptionInstructions={setPrescriptionInstructions}
        refetchPrescriotionInstructions={refetchPrescriotionInstructions}
      />
    </Panel>
  );
};

export default PrescriptionInstructions;
