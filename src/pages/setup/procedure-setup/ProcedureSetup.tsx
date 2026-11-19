import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel } from 'rsuite';
import { MdModeEdit, MdDelete, MdLink, MdMedicalServices, MdLocalOffer } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import './styles.less';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { notify } from '@/utils/uiReducerActions';
import { useEnumOptions } from '@/services/enumsApi';
import { conjureValueBasedOnIDFromList, formatEnumString } from '@/utils';
import {
  useGetProceduresQuery,
  useToggleProcedureIsActiveMutation,
} from '@/services/setup/procedure/procedureService';
import type { Procedure } from '@/types/model-types-new';
import { newProcedure } from '@/types/model-types-constructor-new';
import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';
import AddEditProcedure from './AddEditProcedure';
import PriceListPrompt, { usePriceListPrompt } from '@/components/PriceListPrompt';
import LinkProcedureCoding from './LinkProcedureCoding';
import LinkProcedurePriceList from './LinkProcedurePriceList';
import LinkProcedureDocumentAssignment from './LinkProcedureDocumentAssignment';
import LinkProcedureItems from './LinkProcedureItems';

const ProcedureSetup: React.FC = () => {
  const dispatch = useAppDispatch();
  const priceListView = usePriceListPrompt();

  // Facility context (used to default new procedure)
  const tenant = JSON.parse(localStorage.getItem('tenant') || 'null');
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  // Selected procedure and UI state
  const [procedure, setProcedure] = useState<Procedure>({ ...newProcedure });
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmToggleActive, setOpenConfirmToggleActive] = useState(false);
  const [toggleAction, setToggleAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 1200);

  const [linkCodingOpen, setLinkCodingOpen] = useState(false);
  const [linkCodingProcedureId, setLinkCodingProcedureId] = useState<number | null>(null);

  const [linkPriceOpen, setLinkPriceOpen] = useState(false);
  const [linkPriceProcedureId, setLinkPriceProcedureId] = useState<number | null>(null);

  const [linkDocumentOpen, setLinkDocumentOpen] = useState(false);

  const [linkItemsOpen, setLinkItemsOpen] = useState(false);
  const [linkItemsProcedure, setLinkItemsProcedure] = useState<Procedure | null>(null);
  const [linkDocumentProcedureId, setLinkDocumentProcedureId] = useState<number | null>(null);

  // Header filters: draft values typed in the inputs, applied on Enter / select change.
  // Everything is sent to one endpoint and combined with AND.
  const emptyHeaderFilters = { facilityId: '', categoryType: '', name: '', code: '' };
  type HeaderFilterField = keyof typeof emptyHeaderFilters;
  const [headerFilters, setHeaderFilters] = useState(emptyHeaderFilters);
  const [appliedFilters, setAppliedFilters] = useState(emptyHeaderFilters);
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
  });

  const categoryOptions = useEnumOptions('ProcedureCategory');

  // Main list and facilities
  const { data: proceduresPage, isFetching, refetch } = useGetProceduresQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    isActive: activeFilter,
    ...appliedFilters,
  });

  const { data: facilityListResponse } = useGetAllFacilitiesQuery({});

  const [toggleProcedureIsActive] = useToggleProcedureIsActiveMutation();

  const totalCount = proceduresPage?.totalCount ?? 0;
  const tableData = useMemo(() => proceduresPage?.data ?? [], [proceduresPage?.data]);

  // Page header
  useEffect(() => {
    const header = 'Procedures';
    dispatch(setPageCode('Procedures'));
    dispatch(setDivContent(header));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);
  // Resize listener for modal width
  useEffect(() => {
    const handleResize = () => {
      setWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Open modal for new procedure
  const handleNew = () => {
    setProcedure({ ...newProcedure, facilityId });
    setPopupOpen(true);
  };

  const handleLinkAssignment = () => {
    setLinkDocumentProcedureId(procedure?.id ? Number(procedure.id) : null);
    setLinkDocumentOpen(true);
  };

  // After a save, reload the list with the current filters
  const handleSaveSuccess = () => {
    refetch();
  };

  /**
   * Deactivate selected procedure.
   */
  const handleDeactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id) return;

    const id = procedure.id;

    toggleProcedureIsActive({ id })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure deactivated successfully', sev: 'success' }));
        setProcedure(prev =>
          prev && String(prev.id) === String(id) ? { ...prev, isActive: false } : prev
        );
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to deactivate procedure', sev: 'error' }));
      });
  };

  /**
   * Reactivate selected procedure.
   */
  const handleReactivate = () => {
    setOpenConfirmToggleActive(false);
    if (!procedure?.id) return;

    const id = procedure.id;

    toggleProcedureIsActive({ id })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'Procedure reactivated successfully', sev: 'success' }));
        setProcedure(prev =>
          prev && String(prev.id) === String(id) ? { ...prev, isActive: true } : prev
        );
        refetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to reactivate procedure', sev: 'error' }));
      });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPaginationParams(prev => ({ ...prev, page: newPage }));
  };

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(event.target.value, 10);
    setPaginationParams(prev => ({ ...prev, size: newSize, page: 0 }));
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
    onSearchSubmit: (value?: string) => applyHeaderFilter(field, value ?? headerFilters[field]),
  });

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  // Selected row class
  const isSelected = (rowData: any) => (rowData?.id === procedure?.id ? 'selected-row' : '');

  // Table columns
  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility Name</Translate>,
      width: 180,
      ...headerSearch('facilityId'),
      searchType: 'select' as const,
      searchOptions: [
        { label: 'All', value: '' },
        ...(facilityListResponse ?? []).map((f: any) => ({ label: f.name, value: String(f.id) })),
      ],
      render: (row: any) => (
        <span>
          {conjureValueBasedOnIDFromList(
            facilityListResponse ?? [],
            row?.facilityId,
            'name'
          )}
        </span>
      ),
    },
    {
      key: 'name',
      title: <Translate>Procedure Name</Translate>,
      width: 220,
      ...headerSearch('name', 'Search name'),
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      width: 150,
      ...headerSearch('code', 'Search code'),
    },
    {
      key: 'categoryType',
      title: <Translate>Category</Translate>,
      width: 170,
      ...headerSearch('categoryType'),
      searchType: 'select' as const,
      searchOptions: [{ label: 'All', value: '' }, ...(categoryOptions ?? [])],
      render: (row: any) => row?.categoryType ? formatEnumString(row.categoryType) : '',
    },
    {
      key: 'isAppointable',
      title: <Translate>Appointable</Translate>,
      flexGrow: 2,
      render: (row: any) => (row?.isAppointable ? 'YES' : 'NO'),
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
        { label: 'All', value: 'all' },
      ],
      searchValue: statusFilter,
      onSearchChange: (value: string) => setStatusFilter(value as 'active' | 'inactive' | 'all'),
      render: (row: any) => (
        <MyBadgeStatus
          contant={row?.isActive ? 'Active' : 'Inactive'}
          color={row?.isActive ? '#415be7' : '#b1acacff'}
        />
      ),
    },
    {
      key: 'coding',
      title: <Translate>Coding</Translate>,
      width: 90,
      align: 'center' as const,
      render: (row: any) => (
        <MdLink
          className="icons-style"
          title="Link Codes"
          size={22}
          fill="var(--primary-gray)"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setLinkCodingProcedureId(Number(row?.id));
            setLinkCodingOpen(true);
          }}
        />
      ),
    },
    // {
    //   key: 'priceList',
    //   title: <Translate>Price List</Translate>,
    //   width: 110,
    //   align: 'center' as const,
    //   render: (row: any) => (
    //     <MdAttachMoney
    //       className="icons-style"
    //       title="Link Prices"
    //       size={22}
    //       fill="var(--primary-gray)"
    //       style={{ cursor: 'pointer' }}
    //       onClick={() => {
    //         setLinkPriceProcedureId(Number(row?.id));
    //         setLinkPriceOpen(true);
    //       }}
    //     />
    //   ),
    // },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (row: any) => (
        <div className="container-of-icons">
          <MdMedicalServices
            className="icons-style"
            title="Linked Items"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setLinkItemsProcedure(row);
              setLinkItemsOpen(true);
            }}
          />
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => {
              setProcedure(row);
              setPopupOpen(true);
            }}
          />
          <MdLocalOffer
            className="icons-style"
            title="Price Lists"
            size={24}
            fill="var(--primary-gray)"
            onClick={() =>
              priceListView.view({
                itemType: 'PROCEDURE',
                sourceId: row.id,
                itemCode: row.code,
                itemName: row.name,
                unitPrice: row.price,
                facilityId: row.facilityId,
                currency: row.currency
              })
            }
          />
          {row?.isActive ? (
            <MdDelete
              className="icons-style"
              title="Deactivate"
              size={24}
              fill="var(--primary-pink)"
              onClick={() => {
                setProcedure(row);
                setToggleAction('deactivate');
                setOpenConfirmToggleActive(true);
              }}
            />
          ) : (
            <FaUndo
              className="icons-style"
              title="Activate"
              size={24}
              fill="var(--primary-gray)"
              onClick={() => {
                setProcedure(row);
                setToggleAction('reactivate');
                setOpenConfirmToggleActive(true);
              }}
            />
          )}
        </div>
      ),
    },
  ];

              // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={totalCount}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={row => setProcedure(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              color="var(--deep-blue)"
              onClick={handleLinkAssignment}
              width="160px"
            >
              Link Assignment
            </MyButton>
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
        }
      />

      <AddEditProcedure
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        procedure={procedure}
        setProcedure={setProcedure}
        onSaveSuccess={handleSaveSuccess}
        actionLoading={isFetching}
      />
      <PriceListPrompt prompt={priceListView} />

      <DeletionConfirmationModal
        open={openConfirmToggleActive}
        setOpen={setOpenConfirmToggleActive}
        itemToDelete="Procedure"
        actionButtonFunction={toggleAction === 'deactivate' ? handleDeactivate : handleReactivate}
        actionType={toggleAction}
      />

      <LinkProcedureCoding
        open={linkCodingOpen}
        setOpen={setLinkCodingOpen}
        procedureId={linkCodingProcedureId ?? 0}
      />

      <LinkProcedurePriceList
        open={linkPriceOpen}
        setOpen={setLinkPriceOpen}
        procedureId={linkPriceProcedureId ?? 0}
      />

      <LinkProcedureDocumentAssignment
        open={linkDocumentOpen}
        setOpen={setLinkDocumentOpen}
        defaultProcedureId={linkDocumentProcedureId}
      />

      <LinkProcedureItems
        open={linkItemsOpen}
        setOpen={setLinkItemsOpen}
        procedureId={linkItemsProcedure?.id ?? 0}
        facilityId={linkItemsProcedure?.facilityId ?? 0}
      />
    </Panel>
  );
};

export default ProcedureSetup;
