import React, { useMemo } from 'react';
import { Form, Message } from 'rsuite';
import { GrConfigure } from 'react-icons/gr';

import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';


const categoryOptions = [
    { label: 'MASTER', value: 'MASTER' },
    { label: 'EMR', value: 'EMR' }
];

const booleanOptions = [
    { label: 'Yes', value: true },
    { label: 'No', value: false }
];

const AddEditPatientMergeConfig = ({
    open,
    setOpen,
    record,
    setRecord,
    availablePatientTables = [],
    width,
    handleSave,
    handleTableColumnsLoad,
    loading
}) => {
    const availableTableOptions = useMemo(() => {
        return availablePatientTables
            .filter((table: any) => !table.configured || table.tableName === record?.tableName)
            .map((table: any) => ({
                label: table.tableName,
                value: table.tableName
            }));
    }, [availablePatientTables, record?.tableName]);

    const columnOptions = useMemo(() => {
        return (record?.availableColumns ?? []).map((column: string) => ({
            label: column,
            value: column
        }));
    }, [record?.availableColumns]);
    const safeColumnOptions = useMemo(() => {
        return columnOptions.filter(
            (column: any) =>
                column.value !== record?.patientColumnName &&
                column.value !== record?.primaryKeyColumnName
        );
    }, [columnOptions, record?.patientColumnName, record?.primaryKeyColumnName]);

  const handleTableChange = (updated: any) => {
  const tableName = updated?.tableName;

  if (tableName) {
    handleTableColumnsLoad(tableName);
  }
};

    const content = () => (
        <Form fluid>
            {!record?.id && (
                <MyInput
                    width="100%"
                    fieldName="tableName"
                    fieldLabel="Table Name"
                    fieldType="select"
                    selectData={availableTableOptions}
                    selectDataLabel="label"
                    selectDataValue="value"
                    record={record}
                    setRecord={handleTableChange}
                    searchable
                    required
                    menuMaxHeight={250}
                />
            )}

            {record?.id && (
                <MyInput
                    width="100%"
                    fieldName="tableName"
                    fieldLabel="Table Name"
                    record={record}
                    setRecord={setRecord}
                    disabled
                />
            )}

            <MyInput
                width="100%"
                fieldName="entityName"
                fieldLabel="Entity Name"
                record={record}
                setRecord={setRecord}
                required
            />

            <MyInput
                width="100%"
                fieldName="mergeCategory"
                fieldLabel="Merge Category"
                fieldType="select"
                selectData={categoryOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable={false}
                required
            />

            <MyInput
                width="100%"
                fieldName="enabled"
                fieldLabel="Enabled"
                fieldType="select"
                selectData={booleanOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable={false}
            />

            <MyInput
                width="100%"
                fieldName="autoDiscoverFields"
                fieldLabel="Auto Discover Fields"
                fieldType="select"
                selectData={booleanOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable={false}
            />

            <MyInput
                width="100%"
                fieldName="primaryKeyColumnName"
                fieldLabel="Primary Key Column"
                fieldType="select"
                selectData={columnOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable
                required
            />

            <MyInput
                width="100%"
                fieldName="patientColumnName"
                fieldLabel="Patient Column"
                fieldType="select"
                selectData={columnOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable
                required
            />

            <Message showIcon type="info" style={{ marginBottom: 12 }}>
                <Translate>
                    Do not include patient_id or primary key columns in Match Key Columns.
                </Translate>
            </Message>
            <MyInput
                width="100%"
                fieldName="matchKeyColumns"
                fieldLabel="Match Key Columns"
                fieldType="multyPicker"
                selectData={safeColumnOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable
                menuMaxHeight={250}
            />

            <MyInput
                width="100%"
                fieldName="excludedColumns"
                fieldLabel="Excluded Columns"
                fieldType="multyPicker"
                selectData={columnOptions}
                selectDataLabel="label"
                selectDataValue="value"
                record={record}
                setRecord={setRecord}
                searchable
                menuMaxHeight={250}
            />

            <MyInput
                width="100%"
                fieldName="sortOrder"
                fieldLabel="Sort Order"
                fieldType="number"
                record={record}
                setRecord={setRecord}
            />
        </Form>
    );

    return (
        <MyModal
            actionButtonLabel={record?.id ? 'Save' : 'Create'}
            actionButtonFunction={handleSave}
            actionButtonDisabled={loading}
            open={open}
            setOpen={setOpen}
            position="right"
            title={record?.id ? 'Edit Merge Table Config' : 'New Merge Table Config'}
            content={content}
            steps={[
                {
                    title: 'Table Configuration',
                    icon: <GrConfigure />
                }
            ]}
            size={width > 600 ? '42vw' : '80vw'}
        />
    );
};

export default AddEditPatientMergeConfig;