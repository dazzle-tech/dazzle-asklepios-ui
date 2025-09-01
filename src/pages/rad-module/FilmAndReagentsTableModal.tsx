import React, { useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTable } from '@fortawesome/free-solid-svg-icons';

type FilmAndReagentsTableModalProps = {
  open: boolean;
  setOpen: (value: boolean) => void;
};
const FilmAndReagentsTableModal: React.FC<FilmAndReagentsTableModalProps> = ({ open, setOpen }) => {
  const [searchType, setSearchType] = useState('');
  const [searchName, setSearchName] = useState('');
  const [tableData, setTableData] = useState([
    {
      type: 'Reagent',
      name: 'Grignard reagent',
      warehouse: 'WH1',
      availableQty: 100,
      baseUOM: 'pcs',
      lotNo: 'L001',
      expDate: '2025-12-31',
      usedQty: 0
    },
    {
      type: 'Film',
      name: 'Film X',
      warehouse: 'WH2',
      availableQty: 50,
      baseUOM: 'rolls',
      lotNo: 'F123',
      expDate: '2025-08-15',
      usedQty: 0
    }
  ]);
  const filterFields = [
    { label: 'Reagent', value: 'reagent' },
    { label: 'Film', value: 'film' }
  ];
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const handleRowClick = (row: any) => {
    const exists = selectedRows.find(r => r === row);
    if (exists) {
      setSelectedRows(selectedRows.filter(r => r !== row));
    } else {
      setSelectedRows([...selectedRows, row]);
    }
  };
  const filteredData = tableData.filter(
    item =>
      (!searchType || item.type === searchType) &&
      item.name.toLowerCase().includes(searchName.toLowerCase())
  );
  const isSelected = (row: any) => selectedRows.includes(row);

  const columns = [
    { key: 'type', title: 'Type', width: 100 },
    { key: 'name', title: 'Name', width: 150 },
    { key: 'warehouse', title: 'Warehouse', width: 120 },
    { key: 'availableQty', title: 'Available Qty.', width: 120 },
    { key: 'baseUOM', title: 'Base UOM', width: 100 },
    { key: 'lotNo', title: 'LOT No.', width: 120, expandable: true },
    { key: 'expDate', title: 'Exp Date', width: 120, expandable: true },
    {
      key: 'usedQty',
      title: 'Used Qty.',
      width: 120,
      render: (row, rowIndex) => (
        <Form>
          <MyInput
            fieldType="number"
            fieldName="usedQty"
            fieldLabel=""
            record={row}
            setRecord={newRow => {
              const newData = [...tableData];
              newData[rowIndex] = newRow;
              setTableData(newData);
            }}
            max={row.availableQty}
            min={0}
            width={120}
          />
        </Form>
      )
    }
  ];

  return (
    <>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Inventory Management"
        size="60vw"
        actionButtonLabel="Save"
        steps={[
          {
            title: 'Inventory',
            icon: <FontAwesomeIcon icon={faTable} />
          }
        ]}
        actionButtonFunction={() => {
          console.log('Saved data:', tableData);
          setOpen(false);
        }}
        content={() => (
          <div>
            {/* Search Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
              <Form>
                <MyInput
                  width={200}
                  fieldType="select"
                  fieldLabel=""
                  fieldName="type"
                  selectData={filterFields}
                  selectDataLabel="label"
                  selectDataValue="value"
                  record={{ type: searchType }}
                  setRecord={newRecord => setSearchType(newRecord.type)}
                  searchable={false}
                />
              </Form>

              <Form>
                <MyInput
                  fieldType="text"
                  fieldName="name"
                  fieldLabel=""
                  placeholder="Search by Name"
                  record={{ name: searchName }}
                  setRecord={newRecord => setSearchName(newRecord.name)}
                  width={200}
                />
              </Form>
            </div>

            {/* Table */}
            <MyTable
              data={filteredData}
              columns={columns}
              height={400}
              loading={false}
              onRowClick={handleRowClick}
              rowClassName={(row: any) => (isSelected(row) ? 'selected-row' : '')}
            />
          </div>
        )}
      />
    </>
  );
};

export default FilmAndReagentsTableModal;
