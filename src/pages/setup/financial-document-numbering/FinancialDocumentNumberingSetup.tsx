import React, {
  useEffect,
  useMemo,
  useState
} from 'react';

import { Form, Panel } from 'rsuite';

import {
  MdDelete,
  MdModeEdit,
  MdToggleOff,
  MdToggleOn
} from 'react-icons/md';

import AddOutlineIcon from '@rsuite/icons/AddOutline';

import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';

import {
  setDivContent,
  setPageCode
} from '@/reducers/divSlice';

import { notify } from '@/utils/uiReducerActions';

import {
  conjureValueBasedOnIDFromList,
  formatEnumString
} from '@/utils';

import { useEnumOptions } from '@/services/enumsApi';

import { useGetAllFacilitiesQuery } from '@/services/security/facilityService';

import {
  useChangeFinancialDocumentNumberingActivationStatusMutation,
  useDeleteFinancialDocumentNumberingMutation,
  useGetFinancialDocumentNumberingByFacilityQuery
} from '@/services/billing/financialDocumentNumberingService';

import type {
  FinancialDocumentNumbering
} from '@/types/model-types-new';

import { newFinancialDocumentNumbering } from '@/types/model-types-constructor-new';

import AddEditFinancialDocumentNumbering from './AddEditFinancialDocumentNumbering';

import {
  extractFinancialDocumentNumberingErrorMessage
} from './financialDocumentNumberingErrorHandler';

import './styles.less';

type FilterState = {
  documentType: string;
};

const initialFilterState: FilterState = {
  documentType: ''
};

const FinancialDocumentNumberingSetup: React.FC = () => {
  const dispatch = useAppDispatch();

  const tenant = JSON.parse(
    localStorage.getItem('tenant') || 'null'
  );
  const selectedFacility = tenant?.selectedFacility || null;
  const facilityId: number | undefined = selectedFacility?.id;

  const [selectedConfiguration, setSelectedConfiguration] =
    useState<FinancialDocumentNumbering>({
      ...newFinancialDocumentNumbering
    });
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] =
    useState(false);
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  );
  const [filters, setFilters] =
    useState<FilterState>(initialFilterState);
  const [appliedFilters, setAppliedFilters] =
    useState<FilterState>(initialFilterState);

  const documentTypeOptions = useEnumOptions(
    'FinancialDocumentType'
  );

  const { data: facilityListResponse } =
    useGetAllFacilitiesQuery({});

  const {
    data: configurations = [],
    isFetching,
    refetch
  } = useGetFinancialDocumentNumberingByFacilityQuery(
    { facilityId: facilityId as number },
    { skip: !facilityId }
  );

  const [deleteConfiguration, { isLoading: isDeleting }] =
    useDeleteFinancialDocumentNumberingMutation();
  const [
    changeActivationStatus,
    { isLoading: isChangingActivation }
  ] = useChangeFinancialDocumentNumberingActivationStatusMutation();

  const tableData = useMemo(() => {
    if (!appliedFilters.documentType) {
      return configurations;
    }

    return configurations.filter(
      item =>
        item.documentType === appliedFilters.documentType
    );
  }, [appliedFilters.documentType, configurations]);

  const usedDocumentTypes = useMemo(
    () =>
      configurations
        .map(item => item.documentType)
        .filter(Boolean) as string[],
    [configurations]
  );

  useEffect(() => {
    dispatch(setPageCode('FinancialDocumentNumberingSetup'));
    dispatch(setDivContent('Financial Document Numbering'));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  useEffect(() => {
    const resizeHandler = () => setWidth(window.innerWidth);
    window.addEventListener('resize', resizeHandler);
    return () =>
      window.removeEventListener('resize', resizeHandler);
  }, []);

  useEffect(() => {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
  }, [facilityId]);

  const handleNew = () => {
    if (!facilityId) {
      dispatch(
        notify({
          msg: 'Please select a facility first.',
          sev: 'warning'
        })
      );
      return;
    }

    if (
      usedDocumentTypes.length >=
      documentTypeOptions.length
    ) {
      dispatch(
        notify({
          msg: 'All document types are already configured for this facility.',
          sev: 'warning'
        })
      );
      return;
    }

    setSelectedConfiguration({
      ...newFinancialDocumentNumbering,
      facilityId,
      sequenceLength: 6,
      includeYear: true,
      includeFacilityCode: false,
      numberSeparator: '-',
      resetFrequency: 'YEARLY',
      startingNumber: 1,
      active: true,
      status: 'ACTIVE'
    });
    setModalOpen(true);
  };

  const handleEdit = (row: FinancialDocumentNumbering) => {
    setSelectedConfiguration({ ...row });
    setModalOpen(true);
  };

  const handleDeleteRequest = (
    row: FinancialDocumentNumbering
  ) => {
    setSelectedConfiguration({ ...row });
    setDeleteConfirmationOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedConfiguration.id) {
      return;
    }

    try {
      await deleteConfiguration({
        id: selectedConfiguration.id
      }).unwrap();

      dispatch(
        notify({
          msg: 'Document numbering deleted successfully',
          sev: 'success'
        })
      );

      setDeleteConfirmationOpen(false);
      setSelectedConfiguration({
        ...newFinancialDocumentNumbering
      });
      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractFinancialDocumentNumberingErrorMessage(
            error,
            'Failed to delete document numbering'
          ),
          sev: 'error'
        })
      );
    }
  };

  const handleActivationChange = async (
    row: FinancialDocumentNumbering
  ) => {
    if (!row.id) {
      return;
    }

    const nextActive = !Boolean(row.active);

    try {
      await changeActivationStatus({
        id: row.id,
        active: nextActive
      }).unwrap();

      dispatch(
        notify({
          msg: nextActive
            ? 'Document numbering activated successfully'
            : 'Document numbering deactivated successfully',
          sev: 'success'
        })
      );

      await refetch();
    } catch (error: any) {
      dispatch(
        notify({
          msg: extractFinancialDocumentNumberingErrorMessage(
            error,
            'Failed to change activation status'
          ),
          sev: 'error'
        })
      );
    }
  };

  const handleSearch = () => {
    setAppliedFilters({ ...filters });
  };

  const handleResetFilter = () => {
    setFilters(initialFilterState);
    setAppliedFilters(initialFilterState);
  };

  const handleSaveSuccess = async () => {
    setModalOpen(false);
    setSelectedConfiguration({
      ...newFinancialDocumentNumbering
    });
    await refetch();
  };

  const filtersContent = () => (
    <Form fluid className="form-of-filters-set-up">
      <MyInput
        width="240px"
        fieldName="documentType"
        fieldType="select"
        placeholder="Document Type"
        selectData={documentTypeOptions}
        selectDataLabel="label"
        selectDataValue="value"
        record={filters}
        setRecord={setFilters}
        showLabel={false}
        searchable
        isEnum
      />

      <MyButton
        color="var(--deep-blue)"
        onClick={handleSearch}
        width="80px"
      >
        Search
      </MyButton>

      <MyButton
        color="var(--primary-gray)"
        onClick={handleResetFilter}
        width="80px"
      >
        Clear
      </MyButton>
    </Form>
  );

  const tableColumns = [
    {
      key: 'facilityId',
      title: <Translate>Facility</Translate>,
      flexGrow: 2,
      render: (row: FinancialDocumentNumbering) =>
        conjureValueBasedOnIDFromList(
          facilityListResponse ?? [],
          row.facilityId,
          'name'
        ) || '-'
    },
    {
      key: 'documentType',
      title: <Translate>Document Type</Translate>,
      flexGrow: 2,
      render: (row: FinancialDocumentNumbering) =>
        row.documentType
          ? formatEnumString(row.documentType)
          : '-'
    },
    {
      key: 'prefix',
      title: <Translate>Prefix</Translate>,
      flexGrow: 1,
      render: (row: FinancialDocumentNumbering) =>
        row.prefix ?? '-'
    },
    {
      key: 'resetFrequency',
      title: <Translate>Reset Frequency</Translate>,
      flexGrow: 2,
      render: (row: FinancialDocumentNumbering) =>
        row.resetFrequency
          ? formatEnumString(row.resetFrequency)
          : '-'
    },
    {
      key: 'startingNumber',
      title: <Translate>Starting Number</Translate>,
      width: 130,
      render: (row: FinancialDocumentNumbering) =>
        row.startingNumber ?? '-'
    },
    {
      key: 'status',
      title: <Translate>Status</Translate>,
      width: 110,
      render: (row: FinancialDocumentNumbering) => (
        <MyBadgeStatus
          contant={
            row.status
              ? formatEnumString(row.status)
              : 'Draft'
          }
          color={
            row.status === 'ACTIVE'
              ? '#415be7'
              : row.status === 'INACTIVE'
                ? '#d9534f'
                : '#b1acac'
          }
        />
      )
    },
    {
      key: 'active',
      title: <Translate>Active</Translate>,
      width: 90,
      align: 'center' as const,
      render: (row: FinancialDocumentNumbering) => (
        <MyBadgeStatus
          contant={row.active ? 'Active' : 'Inactive'}
          color={row.active ? '#415be7' : '#b1acac'}
        />
      )
    },
    {
      key: 'actions',
      title: <Translate>Actions</Translate>,
      width: 150,
      align: 'center' as const,
      render: (row: FinancialDocumentNumbering) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            title="Edit"
            size={23}
            fill="var(--primary-gray)"
            onClick={() => handleEdit(row)}
          />

          {row.active ? (
            <MdToggleOn
              className="icons-style"
              title="Deactivate"
              size={28}
              fill="var(--deep-blue)"
              onClick={() => handleActivationChange(row)}
            />
          ) : (
            <MdToggleOff
              className="icons-style"
              title="Activate"
              size={28}
              fill="var(--primary-gray)"
              onClick={() => handleActivationChange(row)}
            />
          )}

          <MdDelete
            className="icons-style"
            title={
              row.status === 'ACTIVE'
                ? 'Active configuration cannot be deleted'
                : 'Delete'
            }
            size={23}
            fill={
              row.status === 'ACTIVE'
                ? '#b1acac'
                : 'var(--primary-pink)'
            }
            onClick={() => handleDeleteRequest(row)}
          />
        </div>
      )
    }
  ];

  const direction =
    localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Panel dir={dir}>
      <MyTable
        data={tableData}
        totalCount={tableData.length}
        loading={
          isFetching || isDeleting || isChangingActivation
        }
        columns={tableColumns}
        filters={filtersContent()}
        page={0}
        rowsPerPage={15}
        tableButtons={
          <div className="container-of-add-new-button">
            <MyButton
              prefixIcon={() => <AddOutlineIcon />}
              color="var(--deep-blue)"
              onClick={handleNew}
              width="125px"
              disabled={!facilityId}
            >
              Add New
            </MyButton>
          </div>
        }
      />

      <AddEditFinancialDocumentNumbering
        open={modalOpen}
        setOpen={setModalOpen}
        width={width}
        configuration={selectedConfiguration}
        setConfiguration={setSelectedConfiguration}
        usedDocumentTypes={usedDocumentTypes}
        onSaveSuccess={handleSaveSuccess}
      />

      <DeletionConfirmationModal
        open={deleteConfirmationOpen}
        setOpen={setDeleteConfirmationOpen}
        itemToDelete="Document Numbering"
        actionButtonFunction={handleDelete}
        actionType="delete"
      />
    </Panel>
  );
};

export default FinancialDocumentNumberingSetup;
