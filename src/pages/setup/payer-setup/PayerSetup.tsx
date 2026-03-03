import React, { useEffect, useState } from 'react';
import './styles.less';
import { Panel, Form } from 'rsuite';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { MdModeEdit, MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { hideSystemLoader, notify, showSystemLoader } from '@/utils/uiReducerActions';

import { Payor } from '@/types/model-types-new';
import { newPayor } from '@/types/model-types-constructor-new';

import {
  useGetAllPayorsQuery,
  useCreatePayorMutation,
  useUpdatePayorMutation,
  useTogglePayorActiveMutation
} from '@/services/setup/payer/PayorService';
import { formatDateWithoutSeconds } from '@/utils';
import PayorModal from './PayorModal';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { useEnumOptions } from '@/services/enumsApi';
import { FaRegListAlt } from 'react-icons/fa';
import PayorPlanModal from './PayorPlanModal';

const PayorSetup = () => {
  const dispatch = useAppDispatch();

  const [payor, setPayor] = useState<Payor>({ ...newPayor });
  const [openModal, setOpenModal] = useState(false);

  const [openConfirmTogglePayor, setOpenConfirmTogglePayor] = useState(false);
  const [toggleActionType, setToggleActionType] = useState<'deactivate' | 'reactivate'>(
    'deactivate'
  );

  const [paginationParams, setPaginationParams] = useState({
    page: 0,
    size: 15,
    sort: 'id,asc'
  });

  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const [openPayorPlanModal, setOpenPayorPlanModal] = useState(false);
  const [selectedPayorForPlans, setSelectedPayorForPlans] = useState<any>(null);
  const [payorPlans, setPayorPlans] = useState([]);

  const payorCategories = useEnumOptions('PayorCategory');

  const [searchFilters, setSearchFilters] = useState<{
    category: string | null;
    name: string;
    code: string;
  }>({
    category: null,
    name: '',
    code: ''
  });

  const [appliedFilters, setAppliedFilters] = useState<{
    category?: string | null;
    name?: string;
    code?: string;
  }>({});

  // RTK Query hooks
  const { data: payorListResponse, isFetching: isPayorFetching } = useGetAllPayorsQuery({
    page: paginationParams.page,
    size: paginationParams.size,
    sort: paginationParams.sort,
    ...(appliedFilters.category ? { category: appliedFilters.category } : {}),
    ...(appliedFilters.name ? { name: appliedFilters.name } : {}),
    ...(appliedFilters.code ? { code: appliedFilters.code } : {})
  });

  const [createPayor] = useCreatePayorMutation();
  const [updatePayor] = useUpdatePayorMutation();
  const [togglePayorActive] = useTogglePayorActiveMutation();

  // Header / Page Code
  useEffect(() => {
    dispatch(setPageCode('PAYOR'));
    dispatch(setDivContent('Payor Setup'));
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  // Row selection style
  const isSelected = (rowData: Payor) => {
    if (rowData && payor && rowData.id === payor.id) {
      return 'selected-row';
    }
    return '';
  };

  // Pagination handlers
  const handlePageChange = (_event: any, newPage: number) => {
    setPaginationParams(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = Number(e.target.value);
    setPaginationParams(prev => ({
      ...prev,
      size: newSize,
      page: 0
    }));
  };

  // Sort handler
  const handleSortChange = (column: string, type: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortType(type);
    const sortValue = `${column},${type}`;
    setPaginationParams(prev => ({
      ...prev,
      sort: sortValue,
      page: 0
    }));
  };

  const handleNew = () => {
    setPayor({ ...newPayor });
    setOpenModal(true);
  };

  const handleSave = async () => {
    const errors: string[] = [];
    if (!payor.code?.trim()) errors.push('Payor Code is required');
    if (!payor.name?.trim()) errors.push('Payor Name is required');
    if (!payor.category) errors.push('Category is required');
    if (!payor.startDate) errors.push('Start Date is required');
    if (!payor.phone?.trim()) errors.push('Phone is required');
    if (errors.length > 0) {
      dispatch(
        notify({
          msg: (
            <>
              {errors.map((err, i) => (
                <div key={i}>• {err}</div>
              ))}
            </>
          ),
          sev: 'warning'
        })
      );
      return;
    }
    try {
      dispatch(showSystemLoader());

      const { createdDate, lastModifiedDate, ...cleanPayor } = payor;

      if (payor.id) {
        await updatePayor(cleanPayor).unwrap();
        dispatch(notify({ msg: 'Payor updated successfully', sev: 'success' }));
      } else {
        await createPayor(cleanPayor).unwrap();
        dispatch(notify({ msg: 'Payor created successfully', sev: 'success' }));
      }

      setOpenModal(false);
    } catch (err: any) {
      let serverMessage =
        err?.data?.properties?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        'Failed to save payor';

      serverMessage = serverMessage.replace(/^error\./i, '');

      dispatch(
        notify({
          msg: serverMessage,
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  const handleTogglePayorActive = async () => {
    if (!payor?.id) return;
    try {
      dispatch(showSystemLoader());

      await togglePayorActive(payor.id).unwrap();

      dispatch(
        notify({
          msg:
            toggleActionType === 'deactivate'
              ? 'Payor deactivated successfully'
              : 'Payor reactivated successfully',
          sev: 'success'
        })
      );

      setOpenConfirmTogglePayor(false);
    } catch (error) {
      console.error('Toggle payor active failed:', error);
      dispatch(
        notify({
          msg: 'Action failed, please try again',
          sev: 'warning'
        })
      );
    } finally {
      dispatch(hideSystemLoader());
    }
  };

  // Icons column
  const iconsForActions = (rowData: Payor) => (
    <div className="container-of-icons">
      <FaRegListAlt
        className="icons-style"
        title="Payor Plan"
        size={22}
        fill="var(--primary-gray)"
        style={{ cursor: 'pointer', marginLeft: '8px' }}
        onClick={() => {
          setSelectedPayorForPlans(rowData);
          setPayorPlans([]);

          setOpenPayorPlanModal(true);
        }}
      />

      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setPayor(rowData);
          setOpenModal(true);
        }}
      />
      {rowData.isActive ? (
        <MdDelete
          className="icons-style"
          title="Deactivate"
          size={24}
          fill="var(--primary-pink)"
          onClick={() => {
            setPayor(rowData);
            setToggleActionType('deactivate');
            setOpenConfirmTogglePayor(true);
          }}
        />
      ) : (
        <FaUndo
          className="icons-style"
          title="Activate"
          size={20}
          fill="var(--primary-gray)"
          onClick={() => {
            setPayor(rowData);
            setToggleActionType('reactivate');
            setOpenConfirmTogglePayor(true);
          }}
        />
      )}
    </div>
  );

  // Table columns
  const tableColumns = [
    {
      key: 'category',
      title: <Translate>Payor Category</Translate>,
      flexGrow: 2,
      render: (rowData: Payor) => {
        const found = payorCategories.find(c => c.value === rowData.category);
        return <span>{found?.label ?? rowData.category}</span>;
      }
    },
    {
      key: 'name',
      title: <Translate>Payor Name</Translate>,
      flexGrow: 3
    },
    {
      key: 'code',
      title: <Translate>Internal Code</Translate>,
      flexGrow: 2
    },
    {
      key: 'startDate',
      title: <Translate>Start Date</Translate>,
      flexGrow: 2,
      render: (rowData: Payor) =>
        rowData.startDate ? (
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.startDate)}</span>
        ) : (
          ''
        )
    },
    {
      key: 'expiryDate',
      title: <Translate>Contract Expiry Date</Translate>,
      flexGrow: 2,
      render: (rowData: Payor) =>
        rowData.expiryDate ? (
          <span className="date-table-style">{formatDateWithoutSeconds(rowData.expiryDate)}</span>
        ) : (
          ''
        )
    },
    {
      key: 'actions',
      title: <Translate></Translate>,
      flexGrow: 2,
      render: (rowData: Payor) => iconsForActions(rowData)
    }
  ];

  const filters = () => (
    <Form layout="inline" fluid>
      <MyInput
        width="10vw"
        fieldName="category"
        fieldType="select"
        selectData={payorCategories}
        selectDataLabel="label"
        selectDataValue="value"
        record={searchFilters}
        setRecord={updated =>
          setSearchFilters(prev => ({
            ...prev,
            category: updated.category
          }))
        }
        showLabel={false}
        placeholder="Category"
        searchable={false}
      />

      <MyInput
        width="10vw"
        fieldName="name"
        fieldType="text"
        record={searchFilters}
        setRecord={updated =>
          setSearchFilters(prev => ({
            ...prev,
            name: updated.name
          }))
        }
        showLabel={false}
        placeholder="Payor Name"
      />

      <MyInput
        width="10vw"
        fieldName="code"
        fieldType="text"
        record={searchFilters}
        setRecord={updated =>
          setSearchFilters(prev => ({
            ...prev,
            code: updated.code
          }))
        }
        showLabel={false}
        placeholder="Code"
      />

      <AdvancedSearchFilters
        clearOnClick={() => {
          setSearchFilters({ category: null, name: '', code: '' });
          setAppliedFilters({});
          setPaginationParams(prev => ({ ...prev, page: 0 }));
        }}
      />
    </Form>
  );

  const totalCount = payorListResponse?.totalCount ?? 0;
  const pageIndex = paginationParams.page;
  const rowsPerPage = paginationParams.size;

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      setAppliedFilters({
        category: searchFilters.category || undefined,
        name: searchFilters.name?.trim() || undefined,
        code: searchFilters.code?.trim() || undefined
      });

      setPaginationParams(prev => ({ ...prev, page: 0 }));
    }, 100);

    return () => clearTimeout(delayDebounce);
  }, [searchFilters]);

  return (
    <Panel>
      <MyTable
        data={payorListResponse?.data ?? []}
        totalCount={totalCount}
        loading={isPayorFetching}
        columns={tableColumns}
        rowClassName={isSelected}
        onRowClick={rowData => setPayor(rowData)}
        filters={filters()}
        page={pageIndex}
        rowsPerPage={rowsPerPage}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
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
        open={openConfirmTogglePayor}
        setOpen={setOpenConfirmTogglePayor}
        itemToDelete="Payor"
        actionButtonFunction={handleTogglePayorActive}
        actionType={toggleActionType}
      />

      <PayorModal
        open={openModal}
        setOpen={setOpenModal}
        payor={payor}
        setPayor={setPayor}
        onSave={handleSave}
      />

      <PayorPlanModal
        open={openPayorPlanModal}
        setOpen={setOpenPayorPlanModal}
        payor={selectedPayorForPlans}
      />
    </Panel>
  );
};

export default PayorSetup;
