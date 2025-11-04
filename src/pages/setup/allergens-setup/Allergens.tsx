import Translate from '@/components/Translate';
import React, { useEffect, useMemo, useState } from 'react';
import { Panel, Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import ReactDOMServer from 'react-dom/server';
import { MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdDelete } from 'react-icons/md';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import AddEditAllergens from './AddEditAllergens';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import './styles.less';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { formatEnumString } from '@/utils';
import {
  useGetAllergensQuery,
  useAddAllergenMutation,
  useUpdateAllergenMutation,
  useToggleAllergenIsActiveMutation,
  useLazyGetAllergensByTypeQuery,
  useLazyGetAllergensByCodeQuery,
  useLazyGetAllergensByNameQuery
} from '@/services/setup/allergensService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { Allergen } from '@/types/model-types-new';
import { newAllergen } from '@/types/model-types-constructor-new';

const Allergens: React.FC = () => {
  const dispatch = useAppDispatch();

  const [allergens, setAllergens] = useState<Allergen>({ ...newAllergen });
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [popupOpen, setPopupOpen] = useState(false);
  const [openConfirmDeleteAllergens, setOpenConfirmDeleteAllergens] = useState<boolean>(false);
  const [stateOfDeleteAllergens, setStateOfDeleteAllergens] = useState<
    'delete' | 'deactivate' | 'reactivate'
  >('delete');

  const [recordOfFilter, setRecordOfFilter] = useState<{ filter: string; value: any }>({
    filter: '',
    value: ''
  });

  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredData, setFilteredData] = useState<Allergen[]>([]);
  const [filteredTotal, setFilteredTotal] = useState<number>(0);
  const [filteredLinks, setFilteredLinks] = useState<any | undefined>(undefined);

  const [addAllergen] = useAddAllergenMutation();
  const [updateAllergen] = useUpdateAllergenMutation();
  const [toggleAllergenIsActive] = useToggleAllergenIsActiveMutation();

  const [fetchByType] = useLazyGetAllergensByTypeQuery();
  const [fetchByCode] = useLazyGetAllergensByCodeQuery();
  const [fetchByName] = useLazyGetAllergensByNameQuery();

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc',
    timestamp: Date.now()
  });
  // Fetch allergens page
  const {
    data: allergensPage,
    isFetching,
    refetch
  } = useGetAllergensQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort
  });
  // Compute total count based on filter state
  const totalCount = useMemo(
    () => (isFiltered ? filteredTotal : allergensPage?.totalCount ?? 0),
    [isFiltered, filteredTotal, allergensPage?.totalCount]
  );
  // Determine pagination links based on filter state
  const links = (isFiltered ? filteredLinks : allergensPage?.links) || {};
  // Determine table data based on filter state
  const tableData = useMemo(
    () => (isFiltered ? filteredData : allergensPage?.data ?? []),
    [isFiltered, filteredData, allergensPage?.data]
  );
  // Define filter fields
  const filterFields = [
    { label: 'Allergens Type', value: 'type' },
    { label: 'Allergens Code', value: 'code' },
    { label: 'Allergens Name', value: 'name' }
  ];

  // Handle Add New button click
  const handleNew = () => {
    setAllergens({ ...newAllergen });
    setPopupOpen(true);
  };
  // Save allergen (add or update)
  const handleSave = async () => {
    setPopupOpen(false);
    const isUpdate = !!allergens.id;
    const payload: any = {
      ...allergens,
      code: (allergens.code || '').trim(),
      name: (allergens.name || '').trim(),
      description: allergens.description ?? '',
      isActive: !!allergens.isActive
    };

    try {
      if (isUpdate) {
        await updateAllergen({ id: allergens.id!, ...payload }).unwrap();
        dispatch(notify({ msg: 'Allergen updated successfully', sev: 'success' }));
      } else {
        await addAllergen(payload).unwrap();
        dispatch(notify({ msg: 'Allergen added successfully', sev: 'success' }));
      }

      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, timestamp: Date.now() }));
      refetch();
    } catch (err: any) {
      const data = err?.data ?? {};
      const traceId = data?.traceId || data?.requestId || data?.correlationId;
      const suffix = traceId ? `\nTrace ID: ${traceId}` : '';

      const isValidation =
        data?.message === 'error.validation' ||
        data?.title === 'Method argument not valid' ||
        (typeof data?.type === 'string' && data.type.includes('constraint-violation'));

      if (isValidation && Array.isArray(data?.fieldErrors) && data.fieldErrors.length > 0) {
        const fieldLabels: Record<string, string> = {
          id: 'Id',
          code: 'Code',
          name: 'Name',
          type: 'Type',
          description: 'Description',
          isActive: 'Active'
        };
        const normalizeMsg = (msg: string) => {
          const m = (msg || '').toLowerCase();
          if (m.includes('must not be null')) return 'is required';
          if (m.includes('must not be blank')) return 'must not be blank';
          if (m.includes('size must be between')) return 'length is out of range';
          if (m.includes('must be greater than') || m.includes('must be greater than or equal to'))
            return 'value is too small';
          if (m.includes('must be less than') || m.includes('must be less than or equal to'))
            return 'value is too large';
          if (m.includes('not a valid enum')) return 'has invalid value';
          return msg || 'invalid value';
        };

        const lines = data.fieldErrors.map((fe: any) => {
          const label = fieldLabels[fe.field] ?? fe.field;
          return `• ${label}: ${normalizeMsg(fe.message)}`;
        });

        const humanMsg = `Please fix the following fields:\n${lines.join('\n')}`;
        dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
        return;
      }

      const messageProp: string = data?.message || '';
      const errorKey = messageProp.startsWith('error.') ? messageProp.substring(6) : undefined;
      const keyMap: Record<string, string> = {
        'payload.required': 'Allergen payload is required.',
        'code.required': 'Allergen code is required.',
        'name.required': 'Allergen name is required.',
        'type.required': 'Allergen type is required.',
        'unique.code': 'Allergen code already exists.',
        'unique.name': 'Allergen name already exists.',
        'db.constraint': 'Database constraint violation.',
        notfound: 'Allergen not found.',
        'id.mismatch': 'Path id and body id mismatch.'
      };

      const humanMsg =
        (errorKey && keyMap[errorKey]) ||
        data?.detail ||
        data?.title ||
        data?.message ||
        'Unexpected error';

      dispatch(notify({ msg: humanMsg + suffix, sev: 'error' }));
    }
  };
  // Toggle Active / Inactive state
  const doToggle = async () => {
    try {
      if (!allergens?.id) return;
      const toggledId = allergens.id as number;
      const res = await toggleAllergenIsActive({ id: toggledId as any }).unwrap();
      const newIsActive =
        res && typeof (res as any).isActive === 'boolean'
          ? (res as any).isActive
          : !allergens.isActive;

      setAllergens(prev =>
        prev && prev.id === toggledId ? { ...prev, isActive: newIsActive } : prev
      );

      if (isFiltered) {
        setFilteredData(prev =>
          prev.map(row => (row.id === toggledId ? { ...row, isActive: newIsActive } : row))
        );
      } else {
        refetch();
      }

      dispatch(
        notify({
          msg:
            stateOfDeleteAllergens === 'deactivate'
              ? 'The Allergens was successfully Deactivated'
              : 'The Allergens was successfully Reactivated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(
        notify({
          msg:
            stateOfDeleteAllergens === 'deactivate'
              ? 'Faild to Deactivate this Allergens'
              : 'Faild to Reactivate this Allergens',
          sev: 'error'
        })
      );
    }
  };
  // Handle Deactivate / Reactivate actions
  const handleDeactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    setStateOfDeleteAllergens('deactivate');
    doToggle();
  };
  // Reactivate allergen
  const handleReactivate = () => {
    setOpenConfirmDeleteAllergens(false);
    setStateOfDeleteAllergens('reactivate');
    doToggle();
  };
  // Handle filter changes
  const handleFilterChange = async (fieldName: string, value: any) => {
    if (!value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
      return;
    }
    try {
      let resp: { data: any[]; totalCount: number; links?: any } | undefined;
      if (fieldName === 'type') {
        resp = await fetchByType({
          type: String(value),
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      } else if (fieldName === 'code') {
        resp = await fetchByCode({
          code: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      } else if (fieldName === 'name') {
        resp = await fetchByName({
          name: value,
          page: 0,
          size: paginationParams.size,
          sort: paginationParams.sort
        }).unwrap();
      }

      setFilteredData(resp?.data ?? []);
      setFilteredTotal(resp?.totalCount ?? 0);
      setFilteredLinks(resp?.links || {});
      setIsFiltered(true);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
    } catch {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  };
  // Handle page changes
  const handlePageChange = (_: unknown, newPage: number) => {
    const currentPage = paginationParams.page;
    let targetLink: string | null | undefined = null;

    if (newPage > currentPage && links.next) targetLink = links.next;
    else if (newPage < currentPage && links.prev) targetLink = links.prev;
    else if (newPage === 0 && links.first) targetLink = links.first;
    else if (newPage > currentPage + 1 && links.last) targetLink = links.last;

    if (targetLink) {
      const { page, size } = extractPaginationFromLink(targetLink);
      setPaginationParams(prev => ({
        ...prev,
        page,
        size,
        timestamp: Date.now()
      }));
    }
  };
  // Handle rows per page changes
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPaginationParams(prev => ({
      ...prev,
      size: parseInt(event.target.value, 10),
      page: 0,
      timestamp: Date.now()
    }));
  };

  // table
  // handle row selection style
  const isSelected = (rowData: any) =>
    rowData && allergens && rowData.id === allergens.id ? 'selected-row' : '';

  // Define table columns
  const tableColumns = [
    { key: 'code', title: <Translate>Allergens Code</Translate>, flexGrow: 4 },
    { key: 'name', title: <Translate>Allergens Name</Translate>, flexGrow: 4 },
    {
      key: 'type',
      title: <Translate>Allergens Type</Translate>,
      flexGrow: 4,
      render: (rowData: any) => formatEnumString(rowData.type)
    },
    { key: 'description', title: <Translate>Description</Translate>, flexGrow: 4 },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: (rowData: any) => iconsForActions(rowData)
    }
  ];
  // Action icons for each row
  const iconsForActions = (rowData: Allergen) => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setAllergens(rowData);
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
            setAllergens(rowData);
            setStateOfDeleteAllergens('deactivate');
            setOpenConfirmDeleteAllergens(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setAllergens(rowData);
            setStateOfDeleteAllergens('reactivate');
            setOpenConfirmDeleteAllergens(true);
          }}
        />
      )}
    </div>
  );

  // Render filter form
  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={filterFields}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updatedRecord: any) => {
          setRecordOfFilter({ filter: updatedRecord.filter, value: '' });
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
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, recordOfFilter.value)}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  // Effects

  useEffect(() => {
    const divContent = 'Allergens';
    dispatch(setPageCode('Allergens'));
    dispatch(setDivContent(ReactDOMServer.renderToStaticMarkup(divContent)));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!recordOfFilter.value) {
      setIsFiltered(false);
      setFilteredData([]);
      setFilteredTotal(0);
      setFilteredLinks(undefined);
      setPaginationParams(prev => ({ ...prev, page: 0, timestamp: Date.now() }));
      refetch();
    }
  }, [recordOfFilter.value, refetch]);
  return (
    <Panel>
      <MyTable
        height={450}
        data={tableData}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        filters={filters()}
        onRowClick={(rowData: any) => setAllergens(rowData)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
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
      <AddEditAllergens
        open={popupOpen}
        setOpen={setPopupOpen}
        width={width}
        allergens={allergens as any}
        setAllergens={setAllergens as any}
        handleSave={handleSave}
      />
      <DeletionConfirmationModal
        open={openConfirmDeleteAllergens}
        setOpen={setOpenConfirmDeleteAllergens}
        itemToDelete="Allergens"
        actionButtonFunction={
          stateOfDeleteAllergens === 'deactivate' ? handleDeactivate : handleReactivate
        }
        actionType={stateOfDeleteAllergens}
      />
    </Panel>
  );
};

export default Allergens;
