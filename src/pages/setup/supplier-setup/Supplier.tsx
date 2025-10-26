import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyTable from '@/components/MyTable';
import React, { useEffect, useMemo, useState } from 'react';
import { MdDelete, MdModeEdit } from 'react-icons/md';
import { FaUndo, FaCreditCard } from 'react-icons/fa';
import { Form, Panel } from 'rsuite';
import MyInput from '@/components/MyInput';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import MyButton from '@/components/MyButton/MyButton';
import ReactDOMServer from 'react-dom/server';
import { useDispatch } from 'react-redux';
import { setPageCode, setDivContent } from '@/reducers/divSlice';
import { ColumnConfig } from '@/components/MyTable/MyTable';
import AddSupplierSetup from './AddSupplierSetup';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import MyModal from '@/components/MyModal/MyModal';
import Card from './Card';
import './style.less';
import { useLocation } from 'react-router-dom';

// Table Data
const sampleData = [
  {
    id: 1,
    supplierName: 'Alpha Traders Ltd.',
    supplierCode: 'SUP-001',
    currency: 'USD',
    approvedCategory: 'medical_equipment',
    supplierType: 'manufacturer',
    status: 'Active',
    paymentTerms: 'net_30',
    address: '123 Business St, New York, NY 10001',
    phone: '+1-555-0123',
    email: 'john.smith@alphatraders.com',
    contactPerson: 'John Smith',
    active: true
  },
  {
    id: 2,
    supplierName: 'TechWorld Inc.',
    supplierCode: 'SUP-002',
    currency: 'EUR',
    approvedCategory: 'it_equipment',
    supplierType: 'distributor',
    status: 'Active',
    paymentTerms: 'net_60',
    address: '456 Tech Ave, San Francisco, CA 94102',
    phone: '+1-555-0456',
    email: 'sarah.johnson@techworld.com',
    contactPerson: 'Sarah Johnson',
    active: true
  },
  {
    id: 3,
    supplierName: 'Global Supplies Co.',
    supplierCode: 'SUP-003',
    currency: 'GBP',
    approvedCategory: 'office_supplies',
    supplierType: 'wholesaler',
    status: 'Deactive',
    paymentTerms: 'net_90',
    address: '789 Supply Blvd, Chicago, IL 60601',
    phone: '+1-555-0789',
    email: 'mike.davis@globalsupplies.com',
    contactPerson: 'Mike Davis',
    active: false
  },
  {
    id: 4,
    supplierName: 'Medical Equipment Plus',
    supplierCode: 'SUP-004',
    currency: 'USD',
    approvedCategory: 'medical_equipment',
    supplierType: 'retailer',
    status: 'Active',
    paymentTerms: 'cod',
    address: '321 Medical Dr, Boston, MA 02101',
    phone: '+1-555-0321',
    email: 'lisa.wilson@medequipment.com',
    contactPerson: 'Lisa Wilson',
    active: true
  },
  {
    id: 5,
    supplierName: 'Pharma Solutions',
    supplierCode: 'SUP-005',
    currency: 'USD',
    approvedCategory: 'pharmaceuticals',
    supplierType: 'distributor',
    status: 'Deactive',
    paymentTerms: 'advance',
    address: '654 Pharma Way, Miami, FL 33101',
    phone: '+1-555-0654',
    email: 'david.brown@pharmasolutions.com',
    contactPerson: 'David Brown',
    active: false
  }
];

const SupplierSetup: React.FC = () => {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  const [sortColumn, setSortColumn] = useState<keyof (typeof sampleData)[number]>('supplierName');
  const [sortType, setSortType] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [openModal, setOpenModal] = useState(false);
  const [openCardModal, setOpenCardModal] = useState(false);
  const [tableData, setTableData] = useState(sampleData);
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate'>('deactivate');

  const [record, setRecord] = useState({
    supplierName: '',
    supplierCode: '',
    currency: '',
    approvedCategory: '',
    supplierType: '',
    status: '',
    paymentTerms: '',
    address: ''
  });

  const [filtersForm, setFiltersForm] = useState<{ filter: string; value: string }>({
    filter: '',
    value: ''
  });

  // Columns
  const columns: ColumnConfig[] = useMemo(
    () => [
      { key: 'supplierName', title: 'Supplier Name', dataKey: 'supplierName', width: 180 },
      {
        key: 'supplierCode',
        title: 'Supplier Code',
        dataKey: 'supplierCode',
        width: 120,
        expandable: true
      },
      { key: 'contactPerson', title: 'Contact Person', dataKey: 'contactPerson', width: 140 },
      { key: 'phone', title: 'Phone', dataKey: 'phone', width: 120 },
      { key: 'email', title: 'Email', dataKey: 'email', width: 180 },
      { key: 'currency', title: 'Currency', dataKey: 'currency', width: 100, expandable: true },
      {
        key: 'approvedCategory',
        title: 'Approved Category',
        dataKey: 'approvedCategory',
        width: 150,
        expandable: true
      },
      {
        key: 'supplierType',
        title: 'Supplier Type',
        dataKey: 'supplierType',
        width: 130,
        expandable: true
      },
      { key: 'address', title: 'Address', dataKey: 'address', width: 200 },
      {
        key: 'status',
        title: 'Status',
        dataKey: 'status',
        width: 100,
        render: (row: any) => (
          <MyBadgeStatus
            backgroundColor={
              row.status === 'Active' ? 'var(--light-green)' : 'var(--background-gray)'
            }
            color={row.status === 'Active' ? 'var(--primary-green)' : 'var(--primary-gray)'}
            contant={row.status}
          />
        )
      },
      {
        key: 'paymentTerms',
        title: 'Payment Terms',
        dataKey: 'paymentTerms',
        width: 130,
        expandable: true
      },
      {
        key: 'actions',
        title: '',
        width: 120,
        align: 'center',
        render: (rowData: any) => {
          return (
            <div className="container-of-icons">
              <MdModeEdit title="Edit" id="icon0-0" size={24} onClick={() => setOpenModal(true)} />
              <FaCreditCard
                title="Card"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => setOpenCardModal(true)}
              />
              {rowData.active ? (
                <MdDelete
                  className="icons-style"
                  title="Deactivate"
                  size={24}
                  fill="var(--primary-pink)"
                  onClick={() => {
                    setSelectedItemId(rowData.id);
                    setActionType('deactivate');
                    setOpenConfirmDeleteModal(true);
                  }}
                />
              ) : (
                <FaUndo
                  className="icons-style"
                  title="Reactivate"
                  fill="var(--primary-gray)"
                  size={24}
                  onClick={() => {
                    setSelectedItemId(rowData.id);
                    setActionType('reactivate');
                    setOpenConfirmDeleteModal(true);
                  }}
                />
              )}
            </div>
          );
        }
      }
    ],
    []
  );

  // Active/Deactive the Status
  const handleDeleteConfirm = () => {
    if (selectedItemId !== null) {
      setTableData(prev =>
        prev.map(item =>
          item.id === selectedItemId
            ? {
                ...item,
                active: actionType === 'reactivate',
                status: actionType === 'reactivate' ? 'Active' : 'Deactive'
              }
            : item
        )
      );
    }
    setOpenConfirmDeleteModal(false);
    setSelectedItemId(null);
  };

  // Sorting
  const sortedData = useMemo(() => {
    const copy = [...tableData];
    return copy.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      if (aValue === bValue) return 0;
      const av = typeof aValue === 'string' ? aValue.toLowerCase() : aValue;
      const bv = typeof bValue === 'string' ? bValue.toLowerCase() : bValue;
      return sortType === 'asc' ? (av > bv ? 1 : -1) : av < bv ? 1 : -1;
    });
  }, [tableData, sortColumn, sortType]);

  const paginatedData = useMemo(
    () => sortedData.slice(page * rowsPerPage, (page + 1) * rowsPerPage),
    [sortedData, page, rowsPerPage]
  );

  // Header page setup: dispatch inside useEffect bound to path
  useEffect(() => {
    const divContent = (
      <div className="page-title">
        <h5>Supplier Setup</h5>
      </div>
    );
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);

    dispatch(setPageCode('Supplier_Setup'));
    dispatch(setDivContent(divContentHTML));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch, pathname]);

  return (
    <>
      <Panel className="main-supplier-setup-page-gaps">
        <div className="add-new-supplier-button">
          <MyButton prefixIcon={() => <AddOutlineIcon />} onClick={() => setOpenModal(true)}>
            Add New
          </MyButton>
        </div>

        <MyTable
          data={paginatedData}
          columns={columns}
          filters={
            <Form fluid className="table-header-content">
              <MyInput
                selectDataValue="value"
                selectDataLabel="label"
                selectData={[
                  { label: 'Supplier Name', value: 'supplierName' },
                  { label: 'Contact Person', value: 'contactPerson' },
                  { label: 'Phone', value: 'phone' },
                  { label: 'Email', value: 'email' },
                  { label: 'Status', value: 'status' }
                ]}
                fieldName="filter"
                fieldType="select"
                record={filtersForm}
                setRecord={setFiltersForm}
                showLabel={false}
                placeholder="Select Filter"
                searchable={false}
              />
              <MyInput
                fieldName="value"
                fieldType="text"
                record={filtersForm}
                setRecord={setFiltersForm}
                showLabel={false}
                placeholder="Search"
              />
            </Form>
          }
          height={470}
          loading={false}
          sortColumn={sortColumn as string}
          sortType={sortType}
          onSortChange={(col: any, type: 'asc' | 'desc') => {
            setSortColumn(col as keyof (typeof sampleData)[number]);
            setSortType(type);
          }}
          page={page}
          rowsPerPage={rowsPerPage}
          totalCount={tableData.length}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />

        <DeletionConfirmationModal
          open={openConfirmDeleteModal}
          setOpen={setOpenConfirmDeleteModal}
          itemToDelete="Supplier"
          actionButtonFunction={handleDeleteConfirm}
          actionType={actionType}
        />

        <AddSupplierSetup
          open={openModal}
          setOpen={setOpenModal}
          record={record}
          setRecord={setRecord}
        />

        <MyModal
          open={openCardModal}
          setOpen={setOpenCardModal}
          title="Card Details"
          content={<Card record={record} setRecord={setRecord} />}
          hideActionBtn={false}
          actionButtonLabel="Save"
          size="80vw"
        />
      </Panel>
    </>
  );
};

export default SupplierSetup;
