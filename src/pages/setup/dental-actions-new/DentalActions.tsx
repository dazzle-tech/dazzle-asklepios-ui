import Translate from '@/components/Translate';
import React, { useState, useEffect } from 'react';
import './styles.less';
import { Panel } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { PiToothFill } from 'react-icons/pi';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';
import MyTable from '@/components/MyTable';
import AddEditDentalAction from './AddEditDentalAction';
import MyButton from '@/components/MyButton/MyButton';
import TreatmentLinkedProcedures from './TreatmentLinkedProcedures';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { newDentalAction } from '@/types/model-types-constructor-new';
import { DentalAction } from '@/types/model-types-new';
import { useGetAllDentalActionsQuery,
         useCreateDentalActionMutation,
         useUpdateDentalActionMutation, 
         useToggleDiagnosticTestActiveMutation} from '@/services/setup/dental-action/dentalActionService';
import { formatEnumString } from '@/utils';
import { useEnumOptions } from '@/services/enumsApi';

const DentalActions = () => {
  const dispatch = useAppDispatch();
  const [dentalAction, setDentalAction] = useState<DentalAction>({ ...newDentalAction});
  const [popupOpen, setPopupOpen] = useState(false);
  const [proceduresOpen, setProceduresOpen] = useState(false);
  const [openConfirmDeleteDentalAction, setOpenConfirmDeleteDentalAction] =
    useState<boolean>(false);
  const [stateOfDeleteDentalAction, setStateOfDeleteDentalAction] = useState<string>('delete');
  const [width, setWidth] = useState<number>(window.innerWidth);
  const [sortColumn, setSortColumn] = useState("id");
  const [sortType, setSortType] = useState<"asc" | "desc">("asc");


  const [createDentalAction] = useCreateDentalActionMutation();
  const [updateDentalAction] = useUpdateDentalActionMutation();
const [toggleDentalActionActive] = useToggleDiagnosticTestActiveMutation();

 const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15
    ,
    sort: "id,asc",
  });

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { description: '', type: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

    useEffect(() => {
      dispatch(setPageCode('Dental_Actions'));
      dispatch(setDivContent("Dental Actions"));
      
      return () => {
        dispatch(setPageCode(''));
        dispatch(setDivContent(''));
      };
    }, [dispatch]);

  const isSelected = rowData => {
    if (rowData && dentalAction && rowData.key === dentalAction.id) {
      return 'selected-row';
    } else return '';
  };

  const handlePageChange = (event, newPage) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleNew = () => {
    setDentalAction({ ...newDentalAction });
    setPopupOpen(true);
  };

    const {
      data: dentalActionListResponse,
      isFetching: isDentalActionFetching,
      refetch,
    } = useGetAllDentalActionsQuery({ ...paginationParams, ...appliedFilters, isActive: activeFilter });

    const handleSave = async () => {
      try {
        dispatch(showSystemLoader());

        const basePayload: any = {
          description: dentalAction.description?.trim(),
          type: dentalAction?.type,
          imageName: dentalAction.imageName || null,
          isActive: dentalAction.isActive ?? true,
        };

        if (dentalAction.id) {
          const payload = { ...basePayload, id: dentalAction.id };

          await updateDentalAction({ id: dentalAction.id, body: payload }).unwrap();
          dispatch(notify({ msg: 'Dental Action updated successfully', sev: 'success' }));
        } else {
          await createDentalAction(basePayload).unwrap();
          dispatch(notify({ msg: 'Dental Action created successfully', sev: 'success' }));
        }

        setPopupOpen(false);
        refetch();
      } catch (err) {
        dispatch(notify({ msg: 'Failed to save Dental Action', sev: 'error' }));
      } finally {
        dispatch(hideSystemLoader());
      }
    };

    const handleDeactiveReactivateDentalAction = async () => {
      try {
        dispatch(showSystemLoader());

        await toggleDentalActionActive(dentalAction.id).unwrap();

        dispatch(
          notify({
            msg:
              stateOfDeleteDentalAction === "deactivate"
                ? "Dental Action deactivated successfully"
                : "Dental Action reactivated successfully",
            sev: "success",
          })
        );

        setOpenConfirmDeleteDentalAction(false);
        refetch();
      } catch (error) {
        dispatch(
          notify({
            msg: "Action failed, please try again",
            sev: "error",
          })
        );
      } finally {
        dispatch(hideSystemLoader());
      }
    };

  const iconsForActions = (rowData: DentalAction) => (
    <div className="container-of-icons">
      <PiToothFill
        className="icons-style"
        title="Linked Procedures"
        size={24}
        fill="var(--primary-gray)"
        style={{
          cursor: !rowData.id || rowData.type !== 'TREATMENT' ? 'not-allowed' : 'pointer',
          color: 'var(--primary-gray)'
        }}
        onClick={() => {
          if (!(!rowData.id || rowData.type !== 'TREATMENT')) setProceduresOpen(true);
        }}
      />
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setDentalAction(rowData);
          setPopupOpen(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
           onClick={() => {
            setDentalAction(rowData);
            setStateOfDeleteDentalAction('deactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setDentalAction(rowData);
            setStateOfDeleteDentalAction('reactivate');
            setOpenConfirmDeleteDentalAction(true);
          }}
        />
      )}
    </div>
  );

  const actiontype = useEnumOptions('DentalActionType');

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

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  const tableColumns = [
    {
      key: 'description',
      title: <Translate>Description</Translate>,
      width: 260,
      ...headerSearch('description', 'Search description')
    },
    {
      key: 'type',
      title: <Translate>Type</Translate>,
      width: 180,
      ...headerSearch('type'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(actiontype ?? [])],
      render: (rowData) => <p>{formatEnumString(rowData?.type)}</p>,
    },
    {
      key: 'imageName',
      title: <Translate>Image Name</Translate>,
      flexGrow: 4
    },
    {
      key: 'isActive',
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
      render: rowData => (
        <MyBadgeStatus
          contant={rowData?.isActive ? 'Active' : 'Inactive'}
          color={rowData?.isActive ? '#415be7' : '#b1acacff'}
        />
      )
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: rowData => iconsForActions(rowData)
    }
  ];

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);




const handleSortChange = (sortColumn: string, sortType: "asc" | "desc") => {
  setSortColumn(sortColumn);
  setSortType(sortType);

  const sortValue = `${sortColumn},${sortType}`;
  setPaginationParams(prev => ({ ...prev, sort: sortValue, page: 0 }));
};

  const totalCount = dentalActionListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;


            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <Panel dir={dir}>

    <MyTable
      data={dentalActionListResponse?.data ?? []}
      totalCount={totalCount}
      loading={isDentalActionFetching}
      columns={tableColumns}
      rowClassName={isSelected}
      onRowClick={(rowData) => setDentalAction(rowData)}
      page={pageIndex}
      rowsPerPage={rowsPerPage}
      onPageChange={handlePageChange}
      onRowsPerPageChange={(e) => {
        const newSize = Number(e.target.value);
        setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
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

      <DeletionConfirmationModal
        open={openConfirmDeleteDentalAction}
        setOpen={setOpenConfirmDeleteDentalAction}
        itemToDelete="Dental Action"
        actionButtonFunction={handleDeactiveReactivateDentalAction}
        actionType={stateOfDeleteDentalAction}
      />
      <AddEditDentalAction
        open={popupOpen}
        setOpen={setPopupOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        handleSave={handleSave}
        width={width}
      />
      <TreatmentLinkedProcedures
        open={proceduresOpen}
        setOpen={setProceduresOpen}
        dentalAction={dentalAction}
        setDentalAction={setDentalAction}
        width={width}
        //  refetch={refetch}
      />
    </Panel>
  );
};

export default DentalActions;
