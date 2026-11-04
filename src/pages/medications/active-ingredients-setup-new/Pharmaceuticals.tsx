import React, { useState, useMemo } from 'react';
import { Text, Form } from 'rsuite';
import { MdModeEdit, MdSave } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import MyButton from '@/components/MyButton/MyButton';
import {
  useGetPharmaceuticalsByActiveIngredientQuery,
  useCreatePharmaceuticalMutation,
  useUpdatePharmaceuticalMutation
} from '@/services/setup/activeIngredients/pharmaceuticalService';
import { newPharmaceutical } from '@/types/model-types-constructor-new';
import './styles.less';
import { Block } from '@mui/icons-material';

// Pharmaceuticals are referenced by prescriptions, so they are deactivated instead of deleted.
const Pharmaceuticals = ({ activeIngredient }) => {

  const dispatch = useAppDispatch();

  const [record, setRecord] = useState({ ...newPharmaceutical });

  // Pagination + Sorting
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [sortColumn, setSortColumn] = useState('id');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');

  const { data: list = [], refetch, isFetching } =
    useGetPharmaceuticalsByActiveIngredientQuery(activeIngredient?.id, {
      skip: !activeIngredient?.id,
    });

  const [createPharmaceutical] = useCreatePharmaceuticalMutation();
  const [updatePharmaceutical] = useUpdatePharmaceuticalMutation();

  const sortedList = useMemo(() => {
    if (!sortColumn) return list;

    return [...list].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      if (aVal == null) return -1;
      if (bVal == null) return 1;

      const result = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal > bVal ? 1 : -1;
      return sortType === 'asc' ? result : -result;
    });
  }, [list, sortColumn, sortType]);

  const paginatedData = useMemo(() => {
    const start = page * rowsPerPage;
    return sortedList.slice(start, start + rowsPerPage);
  }, [sortedList, page, rowsPerPage]);

  const columns = [
    {
      key: 'pharmaceuticalName',
      title: <Translate>Pharmaceutical Name</Translate>,
      sortable: true,
      render: (row) => <Text>{row.pharmaceuticalName}</Text>,
    },
    {
      key: 'code',
      title: <Translate>Code</Translate>,
      sortable: true,
      render: (row) => <Text>{row.code}</Text>,
    },
    {
      key: 'billingCode',
      title: <Translate>Billing Code</Translate>,
      sortable: true,
      render: (row) => <Text>{row.billingCode}</Text>,
    },
    {
      key: 'itemDescription',
      title: <Translate>Item Description</Translate>,
      sortable: true,
      render: (row) => <Text>{row.itemDescription}</Text>,
    },
    {
      key: 'secondDescription',
      title: <Translate>Second Description</Translate>,
      sortable: true,
      render: (row) => <Text>{row.secondDescription}</Text>,
    },
    {
      key: 'isActive',
      title: <Translate>Status</Translate>,
      render: (row) => <Text>{row.isActive ? 'Active' : 'Inactive'}</Text>,
    },
    {
      key: 'icons',
      title: '',
      render: (row) => (
        <div className="container-of-icons">
          <MdModeEdit
            className="icons-style"
            size={24}
            fill="var(--primary-gray)"
            onClick={() => setRecord(row)}
          />
        </div>
      ),
    },
  ];

  const save = async () => {
    if (!record.pharmaceuticalName?.trim()) {
      dispatch(notify({ msg: 'Please fix the following fields: • Pharmaceutical Name is required', sev: 'warning' }));
      return;
    }

    const payload = {
      id: record.id ?? null,
      activeIngredientId: activeIngredient.id,
      pharmaceuticalName: record.pharmaceuticalName,
      code: record.code,
      billingCode: record.billingCode,
      itemDescription: record.itemDescription,
      secondDescription: record.secondDescription,
      isActive: record.isActive ?? true,
    };

    try {
      if (payload.id) {
        await updatePharmaceutical(payload).unwrap();
        dispatch(notify({ msg: 'Updated successfully', sev: 'success' }));
      } else {
        await createPharmaceutical(payload).unwrap();
        dispatch(notify({ msg: 'Added successfully', sev: 'success' }));
      }

      refetch();
      setRecord({ ...newPharmaceutical });
    } catch (err) {
      dispatch(notify({ msg: 'Failed to save Pharmaceutical', sev: 'error' }));
    }
  };

  const handleNew = () => {
    setRecord({ ...newPharmaceutical });
  };

  const isSelected = (row) => (Number(row.id) === Number(record.id) ? 'selected-row' : '');

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

  return (
    <Form fluid dir={dir}>
      <div className="container-of-actions-header-active">
        <div className="container-of-fields-active">
          <MyInput
            fieldName="pharmaceuticalName"
            fieldLabel="Pharmaceutical Name"
            placeholder="e.g. LORNOXICAM - 8 MG VIAL"
            width="100%"
            record={record}
            setRecord={setRecord}
            required
          />
          <MyInput
            fieldName="code"
            fieldLabel="Code"
            width="100%"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldName="billingCode"
            fieldLabel="Billing Code"
            width="100%"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldName="itemDescription"
            fieldLabel="Item Description"
            width="100%"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldName="secondDescription"
            fieldLabel="Second Description"
            width="100%"
            record={record}
            setRecord={setRecord}
          />
          <MyInput
            fieldName="isActive"
            fieldLabel="Active"
            fieldType="checkbox"
            record={record}
            setRecord={setRecord}
          />
        </div>

        <div className="container-of-buttons-active">
          <MyButton
            prefixIcon={() => <MdSave />}
            color="var(--deep-blue)"
            onClick={save}
            title="Save"
          />
          <MyButton
            prefixIcon={() => <Block style={{ width: '15px', height: '15px' }} />}
            color="var(--deep-blue)"
            onClick={handleNew}
            title="Clear"
          />
        </div>
      </div>

      <br />

      <MyTable
        height={450}
        data={paginatedData}
        loading={isFetching}
        columns={columns}
        rowClassName={isSelected}
        onRowClick={(row) => setRecord({ ...row })}
        sortColumn={sortColumn}
        sortType={sortType}
        onSortChange={(col, type) => {
          setSortColumn(col);
          setSortType(type);
        }}
        page={page}
        rowsPerPage={rowsPerPage}
        totalCount={list.length}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(Number(e.target.value));
          setPage(0);
        }}
      />
    </Form>
  );
};

export default Pharmaceuticals;
