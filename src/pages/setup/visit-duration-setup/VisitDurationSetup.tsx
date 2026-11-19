import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import MyTable from '@/components/MyTable';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import {
  useGetVisitDurationsQuery,
  useDeleteVisitDurationMutation
} from '@/services/setup/visitDurationService';
import { useEnumOptions } from '@/services/enumsApi';
import { formatEnumString } from '@/utils';
import { notify } from '@/utils/uiReducerActions';
import PlusIcon from '@rsuite/icons/Plus';
import React, { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Form, Panel } from 'rsuite';
import VisitDurationSetupModal from './VisitDurationSetupModal';
import { VisitDuration } from '@/types/model-types-new';
import { newVisitDuration } from '@/types/model-types-constructor-new';
import Translate from '@/components/Translate';

type SortType = 'asc' | 'desc';

const VisitDurationSetup: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  // sorting
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<SortType>('asc');

  //  pagination (unfiltered)
  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 5,
    sort: 'id,asc'
  });

  // modal add/edit
  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [record, setRecord] = useState<VisitDuration | null>({ ...newVisitDuration });

  // delete confirmation modal
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND (visit durations have no active flag).
  const emptyHeaderFilters = { visitType: '', durationInMinutes: '', resourceSpecific: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);

  // enum options للـ VisitType
  const visitTypeOptions = useEnumOptions('VisitType');

  // API data (main)
  const {
    data: pageData,
    isLoading,
    isFetching,
    refetch
  } = useGetVisitDurationsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    ...appliedFilters
  });

  const [deleteVisitDuration, { isLoading: isDeleting }] = useDeleteVisitDurationMutation();

  const totalCount = pageData?.totalCount ?? 0;
  const tableData: VisitDuration[] = useMemo(() => pageData?.data ?? [], [pageData?.data]);

  // Reload the list with the current filters (after add/edit/delete)
  const refetchList = async () => {
    await refetch();
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
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field])
  });

  // delete confirm
  const handleDeleteConfirm = async () => {
    if (selectedItemId == null) {
      setOpenConfirmDeleteModal(false);
      return;
    }

    try {
      await deleteVisitDuration({ id: selectedItemId }).unwrap();
      setOpenConfirmDeleteModal(false);
      setSelectedItemId(null);
      await refetchList();
    } catch (e) {
      console.error(e);
    }
  };

  const columns = [
    {
      key: 'visitType',
      title: 'Visit Type',
      dataKey: 'visitType',
      width: 170,
      ...headerSearch('visitType'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(visitTypeOptions ?? [])],
      render: (row: VisitDuration) => formatEnumString(row?.visitType)
    },
    {
      key: 'durationInMinutes',
      title: <span><Translate>Duration</Translate><Translate>(mins)</Translate></span>,
      dataKey: 'durationInMinutes',
      width: 150,
      ...headerSearch('durationInMinutes', 'Minutes'),
      render: (row: VisitDuration) =>
        row?.durationInMinutes != null ? `${row.durationInMinutes} mins` : ''
    },
    {
      key: 'resourceSpecific',
      title: 'Resource Specific',
      dataKey: 'resourceSpecific',
      width: 160,
      ...headerSearch('resourceSpecific'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        { label: 'Yes', value: 'true' },
        { label: 'No', value: 'false' }
      ],
      render: (row: VisitDuration) => (row?.resourceSpecific ? 'Yes' : 'No')
    },
    {
      key: 'actions',
      title: '',
      width: 120,
      render: (rowData: VisitDuration) => (
        <div className="container-of-icons">
          <MdModeEdit
            title="Edit"
            id="icon0-0"
            size={24}
            className="icons-style"
            onClick={() => {
              setRecord(rowData);
              setModalMode('edit');
              setOpenModal(true);
            }}
          />
          <MdDelete
            className="icons-style"
            title="Delete"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              if (!rowData.id) return;
              setSelectedItemId(rowData.id);
              setOpenConfirmDeleteModal(true);
            }}
          />
        </div>
      )
    }
  ];

  // header page setup
  useEffect(() => {
    const divContent = 'Visit Duration Setup';

    dispatch(setPageCode('Visit_Duration_Setup'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  const handleSortChange = (column: string, type: SortType) => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
  };

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel className="main-visit-duration-page-gaps" dir={dir}>
      <MyTable
        data={tableData}
        columns={columns}
        tableButtons={
          <Form fluid>
            <div className="bt-div">
              <div className="bt-right">
                <MyButton
                  prefixIcon={() => <PlusIcon />}
                  onClick={() => {
                    setModalMode('add');
                    setRecord({ ...newVisitDuration });
                    setOpenModal(true);
                  }}
                >
                  Add
                </MyButton>
              </div>
            </div>
          </Form>
        }
        height={470}
        loading={isLoading || isFetching || isDeleting}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => handleSortChange(col, type as SortType)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />

      {/* Delete Confirmation Modal */}
      <DeletionConfirmationModal
        open={openConfirmDeleteModal}
        setOpen={setOpenConfirmDeleteModal}
        itemToDelete="Visit Duration"
        actionButtonFunction={handleDeleteConfirm}
        actionType="delete"
      />

      {/* Add / Edit Modal */}
      <VisitDurationSetupModal
        open={openModal}
        setOpen={setOpenModal}
        mode={modalMode}
        record={record || undefined}
        onSuccess={refetchList}
      />
    </Panel>
  );
};

export default VisitDurationSetup;
