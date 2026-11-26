import React, { useEffect, useState } from 'react';
import { Panel, Tooltip, Whisper } from 'rsuite';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { FaClipboardQuestion } from 'react-icons/fa6';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import Translate from '@/components/Translate';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import {
  SurveySection,
  newSurveySection,
  useGetAllSurveySectionsQuery,
  useToggleSurveySectionActiveMutation
} from '@/services/setup/survey-question/surveySectionService';
import AddEditSurveySection from './AddEditSurveySection';
import SectionQuestionsModal from './SectionQuestionsModal';
import './styles.less';

/** Sections tab of the survey setup; the questions of each section open from the section row */
const SurveySectionsTab = () => {
  const dispatch = useAppDispatch();

  const [section, setSection] = useState<SurveySection>({ ...newSurveySection });
  const [openAddEdit, setOpenAddEdit] = useState(false);
  const [openQuestions, setOpenQuestions] = useState(false);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'deactivate' | 'reactivate'>('deactivate');
  const [width, setWidth] = useState<number>(window.innerWidth);

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    timestamp: Date.now()
  });

  // Header filters: name is applied on Enter, status on change; sent together to one endpoint (AND)
  const [nameFilter, setNameFilter] = useState('');
  const [appliedName, setAppliedName] = useState('');
  // 'all' sends no isActive param
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');
  const activeFilter = statusFilter === 'all' ? undefined : statusFilter === 'active';

  const { data: sectionsResponse, isFetching, refetch } = useGetAllSurveySectionsQuery({
    ...paginationParams,
    name: appliedName,
    isActive: activeFilter
  });

  const [toggleActive] = useToggleSurveySectionActiveMutation();

  // Changing the status filter starts again from the first page
  useEffect(() => {
    setPaginationParams(prev => ({ ...prev, page: 0 }));
  }, [statusFilter]);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNew = () => {
    setSection({ ...newSurveySection });
    setOpenAddEdit(true);
  };

  const handleToggle = async () => {
    if (!section?.id) return;
    try {
      await toggleActive(section.id).unwrap();
      dispatch(
        notify({
          msg: section.isActive ? 'Survey section deactivated' : 'Survey section activated',
          sev: 'success'
        })
      );
    } catch {
      dispatch(notify({ msg: 'Failed to update status', sev: 'error' }));
    } finally {
      setOpenConfirm(false);
      refetch();
    }
  };

  const isSelected = (row: SurveySection) => (row?.id === section?.id ? 'selected-row' : '');

  const iconsForActions = (row: SurveySection) => (
    <div className="container-of-icons">
      <Whisper placement="top" speaker={<Tooltip><Translate>Questions</Translate></Tooltip>}>
        <FaClipboardQuestion
          className="icons-style"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setSection({ ...row });
            setOpenQuestions(true);
          }}
        />
      </Whisper>
      <Whisper placement="top" speaker={<Tooltip><Translate>Edit</Translate></Tooltip>}>
        <MdModeEdit
          className="icons-style"
          size={24}
          fill="var(--primary-gray)"
          onClick={() => {
            setSection({ ...row });
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
              setSection({ ...row });
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
              setSection({ ...row });
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
      key: 'displayOrder',
      title: <Translate>Order</Translate>,
      flexGrow: 1
    },
    {
      key: 'nameEn',
      title: <Translate>Name (English)</Translate>,
      width: 240,
      // Matches the English or the Arabic name
      searchable: true,
      searchPlaceholder: 'Search name',
      searchValue: nameFilter,
      onSearchChange: (value: string) => setNameFilter(value),
      onSearchSubmit: (value?: string) => {
        setAppliedName(value ?? nameFilter);
        setPaginationParams(prev => ({ ...prev, page: 0 }));
      }
    },
    {
      key: 'nameAr',
      title: <Translate>Name (Arabic)</Translate>,
      flexGrow: 4,
      render: (row: SurveySection) => <span dir="rtl">{row?.nameAr}</span>
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
      render: (row: SurveySection) =>
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
      render: (row: SurveySection) => iconsForActions(row)
    }
  ];

  const dir = (localStorage.getItem('direction') || 'LTR') === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        height={450}
        data={sectionsResponse?.data ?? []}
        totalCount={sectionsResponse?.totalCount ?? 0}
        loading={isFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={(row: SurveySection) => setSection(row)}
        page={paginationParams.page}
        rowsPerPage={paginationParams.size}
        onPageChange={(_: unknown, newPage: number) => {
          setPaginationParams(prev => ({ ...prev, page: newPage, timestamp: Date.now() }));
        }}
        onRowsPerPageChange={(e: any) => {
          const newSize = Number(e.target.value);
          setPaginationParams(prev => ({ ...prev, size: newSize, page: 0, timestamp: Date.now() }));
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

      <AddEditSurveySection
        open={openAddEdit}
        setOpen={setOpenAddEdit}
        width={width}
        section={section}
        setSection={setSection}
      />

      <SectionQuestionsModal
        open={openQuestions}
        setOpen={setOpenQuestions}
        width={width}
        section={section}
      />

      <DeletionConfirmationModal
        open={openConfirm}
        setOpen={setOpenConfirm}
        itemToDelete="Survey Section"
        actionButtonFunction={handleToggle}
        actionType={confirmAction}
      />
    </Panel>
  );
};

export default SurveySectionsTab;
