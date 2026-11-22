import React, { useState, useEffect } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit } from 'react-icons/md';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
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
  useGetAllPrescriptionInstructionsQuery
} from '@/services/setup/prescription-instruction/prescriptionInstructionService';
import { useEnumOptions } from '@/services/enumsApi';
// Header filters: draft values typed in the inputs, applied on Enter / select change.
// Everything is sent to one endpoint and combined with AND.
const emptyHeaderFilters = { category: '', dose: '', unit: '', rout: '', frequency: '' };
type HeaderFilterField = keyof typeof emptyHeaderFilters;

const PrescriptionInstructions = () => {
  const dispatch = useAppDispatch();
  const [prescriptionInstructions, setPrescriptionInstructions] =
    useState<prescriptionInstructions>({ ...newPrescriptionInstructions });
  const [popupOpen, setPopupOpen] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  // Fetch prescription instruction list response
  const {
    data: prescriptionInstructionListResponse,
    refetch: refetchPrescriotionInstructions,
    isFetching
  } = useGetAllPrescriptionInstructionsQuery({ ...paginationParams, ...appliedFilters });

  // Fetch enum lists for filter
  const categoryEnumList = useEnumOptions('AgeGroupType');
  const uomEnumList = useEnumOptions('UOM');
  const routEnumList = useEnumOptions('MedRoa');


  const frequencyEnumList = useEnumOptions('MedFrequency');

  // Pagination values
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  const totalCount = prescriptionInstructionListResponse?.totalCount ?? 0;

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
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  const headerSelect = (field: HeaderFilterField, options: { label: string; value: string }[]) => ({
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [{ label: 'All', value: '' }, ...options]
  });

  // Header page setUp
  const divContent = 'Prescription Instructions';


  useEffect(() => {
  dispatch(setPageCode('Prescription_Instructions'));
  dispatch(setDivContent(divContent));
  
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && prescriptionInstructions && rowData?.id === prescriptionInstructions?.id) {
      return 'selected-row';
    } else return '';
  };

  // ──────────────────────────── PAGINATION ────────────────────────────
  const handlePageChange = (_event, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
  };

  //_________________________SORT LOGIC______________________
  const handleSortChange = (sortColumn: string, sortType: 'asc' | 'desc') => {
    setSortColumn(sortColumn);
    setSortType(sortType);

    const sortValue = `${sortColumn},${sortType}`;

    setPaginationParams({
      ...paginationParams,
      sort: sortValue,
      page: 0,
      timestamp: Date.now()
    });
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
      title: 'Category',
      width: 170,
      ...headerSelect('category', categoryEnumList ?? []),
      render: (row: any) => (row?.category ? formatEnumString(row?.category) : '')
    },
    {
      key: 'dose',
      title: 'Dose',
      width: 120,
      ...headerSearch('dose', 'Dose')
    },
    {
      key: 'unit',
      title: 'Unit',
      width: 160,
      ...headerSelect('unit', uomEnumList ?? []),
      render: (row: any) => (row?.unit ? formatEnumString(row?.unit) : '')
    },
    {
      key: 'rout',
      title: 'Rout',
      width: 170,
      ...headerSelect('rout', routEnumList ?? []),
      render: (row: any) => (row?.rout ? formatEnumString(row?.rout) : '')
    },
    {
      key: 'frequency',
      title: 'Frequency',
      width: 200,
      ...headerSelect('frequency', frequencyEnumList ?? []),
      render: (row: any) => (row?.frequency ? formatEnumString(row?.frequency) : '-')
    },
    {
      key: 'icons',
      title: '',
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



              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        totalCount={totalCount}
        data={prescriptionInstructionListResponse?.data ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setPrescriptionInstructions(rowData);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={e => {
          const newSize = Number(e.target.value);
          setPaginationParams({
            ...paginationParams,
            size: newSize,
            page: 0,
            timestamp: Date.now()
          });
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
