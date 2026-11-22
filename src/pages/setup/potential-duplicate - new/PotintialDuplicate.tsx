import React, { useEffect, useState } from 'react';
import Translate from '@/components/Translate';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { HiDocumentDuplicate } from 'react-icons/hi2';
import { notify } from '@/utils/uiReducerActions';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import './styles.less';


import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import AddEditRule from './AddEditRule';
import LinkedFacility from './LinkedFacilities';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import {
  useGetDuplicationCandidatesQuery,
  useDeactivateDuplicationCandidateMutation,
  useReactivateDuplicationCandidateMutation,
  useCreateDuplicationCandidateMutation,
  useUpdateDuplicationCandidateMutation,
} from '@/services/potintialDuplicateService';
import { newCandidate } from '@/types/model-types-constructor-new';
import { Candidate } from '@/types/model-types-new';
import { useEnumByName } from '@/services/enumsApi';

const PotintialDuplicate = () => {
  const dispatch = useAppDispatch();
  const [popupOpen, setPopupOpen] = useState(false);
  const [OpenFacilityModal, setOpenFacilityModal] = useState(false);
  const [width, setWidth] = useState<number>(window.innerWidth);
  const fieldsEnum = useEnumByName("DuplicationField");

  const defaultFields: Record<string, boolean> = fieldsEnum.reduce((acc, key) => {
    acc[key] = false;
    return acc;
  }, {} as Record<string, boolean>);

  const [candidate, setCandidate] = useState<Candidate>({ ...newCandidate, fields: defaultFields });


  const [openConfirmDeleteRole, setOpenConfirmDeleteRole] = useState<boolean>(false);
  const [stateOfDeleteRole, setStateOfDeleteRole] = useState<string>('delete');


  // Mutations
  const [updateCandidate] = useUpdateDuplicationCandidateMutation();
  const [createCandidate] = useCreateDuplicationCandidateMutation();
  const [deactivateCandidate] = useDeactivateDuplicationCandidateMutation();
  const [reactivateCandidate] = useReactivateDuplicationCandidateMutation();
  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Rule is text; each duplication field is '' (all) | 'true' | 'false'. Everything is ANDed by the backend.
  const [headerFilters, setHeaderFilters] = useState<Record<string, string>>({ rule: '' });
  const [appliedFilters, setAppliedFilters] = useState<Record<string, string>>({ rule: '' });
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { rule: appliedRule, ...appliedFieldFilters } = appliedFilters;
  const { data: candidateList, isFetching, refetch } = useGetDuplicationCandidatesQuery({
    role: appliedRule,
    isActive: activeFilter,
    fieldsTrue: Object.keys(appliedFieldFilters).filter(key => appliedFieldFilters[key] === 'true'),
    fieldsFalse: Object.keys(appliedFieldFilters).filter(key => appliedFieldFilters[key] === 'false')
  });

  // Reload the table after add/update/toggle
  const refreshList = () => {
    refetch();
  };

  // Header page setUp
  const divContent = (
    "Potential Duplicate"
  );


useEffect(() => {
  dispatch(setPageCode('Potintial_Duplicate'));
  dispatch(setDivContent(divContent));

  return () => {
    dispatch(setPageCode(''));
    dispatch(setDivContent(''));
  };
}, [dispatch]);

  // class name for selected row
  const isSelected = rowData => {
    if (rowData && candidate && rowData.id === candidate.id) {
      return 'selected-row';
    } else return '';
  };

  // Icons column (Edit,Linked facilities, reactive/Deactivate)
  const iconsForActions = (rowData: Candidate) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setPopupOpen(true)}
      />
      {rowData?.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setStateOfDeleteRole('deactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setStateOfDeleteRole('reactivate');
            setOpenConfirmDeleteRole(true);
          }}
        />
      )}
      <HiDocumentDuplicate
        className="icons-style"
        title="Linked Facilities"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => setOpenFacilityModal(true)}
      />
    </div>
  );

  // Table columns
  const duplicationFields = useEnumByName("DuplicationField") || [];

  // Applying one header filter also applies whatever is typed in the others
  const applyHeaderFilter = (field: string, value: string) => {
    const next = { ...headerFilters, [field]: value };
    setHeaderFilters(next);
    setAppliedFilters(next);
    setPageIndex(0);
  };

  const headerSearch = (field: string, placeholder?: string) => ({
    searchable: true,
    searchPlaceholder: placeholder,
    searchValue: headerFilters[field] ?? '',
    onSearchChange: (value: string) => setHeaderFilters(prev => ({ ...prev, [field]: value })),
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field] ?? '')
  });

  const dynamicFieldColumns = duplicationFields.map(field => ({
    key: field,
    title: <Translate>{field.replace(/_/g, ' ')}</Translate>,
    width: 150,
    ...headerSearch(field),
    searchType: 'select' as const,
    searchOptions: [
      { label: 'All', value: '' },
      { label: 'True', value: 'true' },
      { label: 'False', value: 'false' }
    ],
    render: rowData => (rowData.fields?.[field] ? 'True' : 'False')
  }));

  const tableColumns = [
    { key: 'role', title: <Translate>Rule</Translate>, width: 160, ...headerSearch('rule', 'Rule'), render: rowData => rowData.rule },
    ...dynamicFieldColumns,
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 120,
      searchable: true,
      searchType: 'select' as const,
      searchOptions: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' },
        { label: 'All', value: 'all' }
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: rowData => (rowData.isActive ? 'active' : 'inactive')
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];


  // Pagination values
  const [pageIndex, setPageIndex] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const handlePageChange = (_: unknown, newPage: number) => {
    setPageIndex(newPage);
  };
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPageIndex(0);
  };
  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPageIndex(0);
  }, [statusFilter]);

  const filteredData = React.useMemo(() => candidateList ?? [], [candidateList]);

  const totalCount = filteredData.length;

  // Sorting state
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortType, setSortType] = useState<'asc' | 'desc' | null>(null);

  // Sorting logic
  const sortedData = React.useMemo(() => {
    if (!sortBy) return filteredData;

    return [...filteredData].sort((a, b) => {
      const valA = a[sortBy];
      const valB = b[sortBy];
      if (valA == null) return 1;
      if (valB == null) return -1;

      if (typeof valA === 'string') {
        return sortType === 'asc'
          ? valA.localeCompare(valB)
          : valB.localeCompare(valA);
      }
      if (typeof valA === 'number' || typeof valA === 'boolean') {
        return sortType === 'asc'
          ? (valA as any) - (valB as any)
          : (valB as any) - (valA as any);
      }
      return 0;
    });
  }, [filteredData, sortBy, sortType]);

  // Pagination on sorted data
  const paginatedData = sortedData.slice(
    pageIndex * rowsPerPage,
    pageIndex * rowsPerPage + rowsPerPage
  );

  // handle click on add new button
  const handleNew = () => {
    setCandidate({ ...newCandidate });
    setPopupOpen(true);
  };

  // handle save role
  const handleSave = async () => {
    setPopupOpen(false);
    if (!candidate.id) {
      try {

        await createCandidate(candidate).unwrap().then(() => {
          refreshList();
        });
        dispatch(notify({ msg: 'The Role has been created successfully', sev: 'success' }));
      } catch (error) {
        if (error.data && error.data.message) {
          dispatch(notify(error.data.message));
        } else {
          dispatch(notify({ msg: error, sev: "error" }));
        }
      }
    } else {
      try {
        await updateCandidate({
          id: candidate.id,
          data: {
            fields: candidate.fields,
            isActive: candidate.isActive,
          }
        }).unwrap()

          .then(() => {
            refreshList();
          });
        dispatch(notify({ msg: 'The Role has been updated successfully', sev: 'success' }));
      } catch (error) {
        if (error.data && error.data.message) {
          dispatch(notify(error.data.message));
        } else {
          dispatch(notify({ msg: error, sev: "error" }));
        }
      }
    }
  };

  // handle Deactivate
  const handleDeactivate = () => {
    setOpenConfirmDeleteRole(false);
    deactivateCandidate(candidate.id)
      .unwrap()
      .then(() => {
        refreshList();
        dispatch(notify({ msg: 'The Role was successfully Deactivated', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Faild to Deactivate this Role', sev: 'error' }));
      });
  };

  // handle Reactivate
  const handleReactivate = () => {
    setOpenConfirmDeleteRole(false);
    reactivateCandidate(candidate.id)
      .unwrap()
      .then(() => {
        refreshList();
        dispatch(notify({ msg: 'The Role was successfully Reactivated', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Faild to Reactivate this Role', sev: 'error' }));
      });
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
        data={paginatedData ?? []}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => {
          setCandidate(rowData);
        }}
        sortColumn={sortBy || undefined}
        sortType={sortType || undefined}
        onSortChange={(column, type) => {
          setSortBy(column);
          setSortType(type);
        }}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        totalCount={totalCount}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
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
      <AddEditRule
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        candidate={candidate}
        setCandidate={setCandidate}
        handleSave={handleSave}
      />
      <LinkedFacility
        open={OpenFacilityModal}
        setOpen={setOpenFacilityModal}
        width={width}
        Candidate={candidate}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteRole}
        setOpen={setOpenConfirmDeleteRole}
        itemToDelete="Role"
        actionButtonFunction={
          stateOfDeleteRole == 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteRole}
      />
    </Panel>
  );
};

export default PotintialDuplicate;
