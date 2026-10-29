import React, { useEffect, useState } from 'react';
import { Form, Panel, Tooltip, Whisper } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  SurveyText,
  newSurveyText,
  useGetAllSurveyTextsQuery,
  useLazyGetSurveyTextsByStatusQuery,
  useLazyGetSurveyTextsByTextQuery,
  useToggleSurveyTextActiveMutation
} from '@/services/setup/survey-question/surveyTextService';
import AddEditSurveyText from './AddEditSurveyText';

// Available fields for filtering
const FILTER_FIELDS = [
  { label: 'Text', value: 'text' },
  { label: 'Status', value: 'isActive' }
];

const STATUS_OPTIONS = [
  { label: 'Active', value: 'true' },
  { label: 'Inactive', value: 'false' }
];

/**
 * Texts tab of the survey setup: the titles, buttons and messages of the survey page.
 * An inactive text is not used, and the page shows its own default instead.
 */
const SurveyTextsTab = () => {
  const dispatch = useAppDispatch();

  const [text, setText] = useState<SurveyText>({ ...newSurveyText });
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'textKey,asc',
    timestamp: Date.now()
  });

  const { data: textsResponse, isFetching } = useGetAllSurveyTextsQuery(paginationParams);

  const [toggleActive] = useToggleSurveyTextActiveMutation();

  // ──────────────────────────── FILTERS ────────────────────────────
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [isFiltered, setIsFiltered] = useState(false);
  const [filteredList, setFilteredList] = useState<SurveyText[]>([]);
  const [filteredTotal, setFilteredTotal] = useState(0);
  const [filterPagination, setFilterPagination] = useState({ page: 0, size: 15, sort: 'textKey,asc' });

  const [fetchByText] = useLazyGetSurveyTextsByTextQuery();
  const [fetchByStatus] = useLazyGetSurveyTextsByStatusQuery();

  const handleFilterChange = async (field: string, value: string, page = 0, size?: number) => {
    if (!field || !value?.trim()) {
      setIsFiltered(false);
      setFilteredList([]);
      return;
    }

    const currentSize = size ?? filterPagination.size;
    const params = { page, size: currentSize, sort: filterPagination.sort };

    try {
      const response =
        field === 'text'
          ? await fetchByText({ text: value, ...params }).unwrap()
          : await fetchByStatus({ isActive: value, ...params }).unwrap();

      setFilteredList(response.data ?? []);
      setFilteredTotal(response.totalCount ?? 0);
      setIsFiltered(true);
      setFilterPagination({ ...filterPagination, page, size: currentSize });
    } catch {
      dispatch(notify({ msg: 'Failed to filter survey texts', sev: 'error' }));
      setIsFiltered(false);
    }
  };

  // Re-run the active filter so the filtered list shows the latest changes
  const refreshFilter = () => {
    if (isFiltered) {
      handleFilterChange(
        recordOfFilter.filter,
        String(recordOfFilter.value),
        filterPagination.page,
        filterPagination.size
      );
    }
  };

  useEffect(() => {
    if (!openAddEdit) refreshFilter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openAddEdit]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const filterValueInput = () => {
    const common = {
      fieldName: 'value',
      record: recordOfFilter,
      setRecord: setRecordOfFilter,
      showLabel: false,
      width: 220
    };

    if (recordOfFilter.filter === 'isActive') {
      return (
        <MyInput
          {...common}
          fieldType="select"
          selectData={STATUS_OPTIONS}
          selectDataLabel="label"
          selectDataValue="value"
          placeholder="Select Status"
          searchable={false}
        />
      );
    }
    return <MyInput {...common} fieldType="text" placeholder="Enter Value" />;
  };

  const filters = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        selectDataValue="value"
        selectDataLabel="label"
        selectData={FILTER_FIELDS}
        fieldName="filter"
        fieldType="select"
        record={recordOfFilter}
        setRecord={(updated: any) => setRecordOfFilter({ filter: updated.filter, value: '' })}
        showLabel={false}
        placeholder="Select Filter"
        searchable={false}
        width="170px"
      />
      {filterValueInput()}
      <MyButton
        color="var(--deep-blue)"
        onClick={() => handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value ?? ''))}
        width="80px"
      >
        Search
      </MyButton>
    </Form>
  );

  const handleNew = () => {
    setText({ ...newSurveyText });
    setOpenAddEdit(true);
  };

  const handleToggle = async () => {
    if (!text?.id) return;
    try {
      await toggleActive(text.id).unwrap();
      dispatch(
        notify({ msg: text.isActive ? 'Survey text deactivated' : 'Survey text activated', sev: 'success' })
      );
    } catch {
      dispatch(notify({ msg: 'Failed to update status', sev: 'error' }));
    } finally {
      setOpenConfirm(false);
      refreshFilter();
    }
  };

  const isSelected = (row: SurveyText) => (row?.id === text?.id ? 'selected-row' : '');

  const iconsForActions = (row: SurveyText) => (
    <div className="container-of-icons">
      <Whisper placement="top" speaker={<Tooltip><Translate>Edit</Translate></Tooltip>}>
        <MdModeEdit
          className="icons-style"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setText({ ...row });
            setOpenAddEdit(true);
          }}
        />
      </Whisper>
      {row?.isActive ? (
        <Whisper placement="top" speaker={<Tooltip><Translate>Deactivate</Translate></Tooltip>}>
          <MdDelete
            className="icons-style"
            size={24}
            fill="var(--primary-pink)"
            onClick={() => {
              setText({ ...row });
              setConfirmAction('deactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      ) : (
        <Whisper placement="top" speaker={<Tooltip><Translate>Activate</Translate></Tooltip>}>
          <FaUndo
            className="icons-style"
            size={22}
            fill="var(--primary-gray)"
            onClick={() => {
              setText({ ...row });
              setConfirmAction('reactivate');
              setOpenConfirm(true);
            }}
          />
        </Whisper>
      )}
    </div>
  );

  const tableColumns = [
    {
      key: 'textKey',
      title: <Translate>Key</Translate>,
      flexGrow: 3
    },
    {
      key: 'textEn',
      title: <Translate>Text (English)</Translate>,
      flexGrow: 5
    },
    {
      key: 'textAr',
      title: <Translate>Text (Arabic)</Translate>,
      flexGrow: 5,
      render: (row: SurveyText) => <span dir="rtl">{row?.textAr}</span>
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      flexGrow: 2,
      render: (row: SurveyText) =>
        row?.isActive ? (
          <MyBadgeStatus contant="Active" color="#45b887" />
        ) : (
          <MyBadgeStatus contant="Inactive" color="#969fb0" />
        )
    },
    {
      key: 'icons',
      title: '',
      flexGrow: 2,
      render: (row: SurveyText) => iconsForActions(row)
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={isFiltered ? filteredList : textsResponse?.data ?? []}
        totalCount={isFiltered ? filteredTotal : textsResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: SurveyText) => setText(row)}
        filters={filters()}
        page={isFiltered ? filterPagination.page : paginationParams.page}
        rowsPerPage={isFiltered ? filterPagination.size : paginationParams.size}
        onPageChange={(_: unknown, newPage: number) => {
          if (isFiltered) {
            handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value), newPage);
          } else {
            setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
          }
        }}
        onRowsPerPageChange={(e: any) => {
          const newSize = Number(e.target.value);
          if (isFiltered) {
            handleFilterChange(recordOfFilter.filter, String(recordOfFilter.value), 0, newSize);
          } else {
            setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
          }
        }}
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

      <AddEditSurveyText open={openAddEdit} setOpen={setOpenAddEdit} width={width} text={text} setText={setText} />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Survey Text"
        actionButtonFunction={handleToggle}
        actionType={confirmAction}
      />
    </Panel>
  );
};

export default SurveyTextsTab;
