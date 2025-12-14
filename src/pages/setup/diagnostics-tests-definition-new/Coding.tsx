import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import { FaNewspaper } from 'react-icons/fa6';
import { MdDelete, MdModeEdit } from 'react-icons/md';

import MyInput from '@/components/MyInput';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import MyButton from '@/components/MyButton/MyButton';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';

import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';


import { useGetLovValuesByCodeQuery } from '@/services/setupService';


import {
  useGetDiagnosticTestCodingsByTestQuery,
  useAddDiagnosticTestCodingMutation,
  useDeleteDiagnosticTestCodingMutation,
  useGetDiagnosticCodeOptionsByTypeQuery,
} from '@/services/setup/diagnosticTest/diagnosticTestCodingService';

import type { DiagnosticTestCoding } from '@/types/model-types-new';
import { skipToken } from '@reduxjs/toolkit/query';
import { useEnumOptions } from '@/services/enumsApi';

type CodingProps = {
  open: boolean;
  setOpen: (v: boolean) => void;
  diagnosticsTest: { id: number } | null;
};

const Coding: React.FC<CodingProps> = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [openConfirmDeleteCode, setOpenConfirmDeleteCode] = useState<boolean>(false);


  const [diagnosticCoding, setDiagnosticCoding] = useState<Partial<DiagnosticTestCoding>>({});


  const [sortColumn, setSortColumn] = useState<string | undefined>('id');
  const [sortType, setSortType] = useState<'asc' | 'desc' | undefined>('asc');


  const { data: codeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');


  const {
    data: codingPage,
    refetch: fetchCoding,
    isFetching,
  } = useGetDiagnosticTestCodingsByTestQuery(
    diagnosticsTest?.id != null
      ? {
          diagnosticTestId: diagnosticsTest.id,
          page: 0,
          size: 100,
          sort: 'id,asc',
        }
      : skipToken
  );

  const codingList: DiagnosticTestCoding[] = codingPage?.data ?? [];

  
  const { data: codeOptionsPage } = useGetDiagnosticCodeOptionsByTypeQuery(
    diagnosticCoding.codeType
      ? {
          type: String(diagnosticCoding.codeType),
          page: 0,
          size: 50,
          sort: 'id,asc',
        }
      : skipToken
  );

  const codeOptions =
    codeOptionsPage?.data?.map((c) => ({
      ...c,
      label: `${c.code} - ${c.description}`,
    })) ?? [];

  const [addDiagnosticTestCoding] = useAddDiagnosticTestCodingMutation();
  const [deleteDiagnosticTestCoding] = useDeleteDiagnosticTestCodingMutation();


  const isSelectedcode = (rowData: DiagnosticTestCoding) => {
    if (rowData && diagnosticCoding && rowData.id === diagnosticCoding.id) {
      return 'selected-row';
    }
    return '';
  };


  const iconsForActions = () => (
    <div className="container-of-icons">
      <MdModeEdit
        className="icons-style"
        title="Edit"
        size={24}
        fill="var(--primary-gray)"
        onClick={() => {
          setOpenChild(true);
        }}
      />
      <MdDelete
        className="icons-style"
        title="Remove"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteCode(true);
        }}
      />
    </div>
  );


 const codingType=useEnumOptions('MedicalCodeType')
  const tableColumns = [
    {
      key: 'codeType',
      title:"Code Type"
    },
    {
      key: 'codeId',
      title: <Translate>Code</Translate>,
      render: (rowData: DiagnosticTestCoding) => rowData.codeId,
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions(),
    },
  ];


  const handleSaveCoding = async () => {
    if (!diagnosticsTest?.id) return;

    try {
      if (!diagnosticCoding.codeType || !diagnosticCoding.codeId) {
        dispatch(notify('Please select code type and code'));
        return;
      }

      await addDiagnosticTestCoding({
        diagnosticTestId: diagnosticsTest.id,
        codeType: diagnosticCoding.codeType,
        codeId: diagnosticCoding.codeId,
      }).unwrap();

      dispatch(notify({msg:'The Code was saved successfully',sev:"success"}));
      fetchCoding();
      setDiagnosticCoding({});
      setOpenChild(false);
    } catch {
    
    }
  };


  const handleRemove = async () => {
    try {
      setOpenConfirmDeleteCode(false);
      if (!diagnosticCoding.id) return;

      await deleteDiagnosticTestCoding({ id: diagnosticCoding.id }).unwrap();
      fetchCoding();
      dispatch(notify('The Code was deleted successfully'));
      setDiagnosticCoding({});
    } catch {
      // يمكن تحسين الرسائل هنا لو تحب
    }
  };

  
  const conjureFormContentOfMainModal = (stepNumber: number) => {
    switch (stepNumber) {
      case 0:
      default:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setDiagnosticCoding({});
                  setOpenChild(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={400}
              data={codingList}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelectedcode}
              onRowClick={(rowData: DiagnosticTestCoding) => {
                setDiagnosticCoding(rowData);
              }}
              sortColumn={sortColumn}
              sortType={sortType}
              onSortChange={(col, type) => {
                setSortColumn(col || undefined);
                setSortType(type || undefined);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteCode}
              setOpen={setOpenConfirmDeleteCode}
              itemToDelete="Code"
              actionButtonFunction={handleRemove}
              actionType="delete"
            />
          </Form>
        );
    }
  };

  
  const conjureFormContentOfChildModal = () => {
    return (
      <Form fluid>
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="Code Type"
          selectData={codingType ?? []}
          selectDataLabel="label"
          selectDataValue="value"
          fieldName="codeType"
          record={diagnosticCoding}
          setRecord={setDiagnosticCoding}
        />
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="Code"
          selectData={codeOptions}
          selectDataLabel="label"
          selectDataValue="code"
          fieldName="codeId"
          record={diagnosticCoding}
          setRecord={setDiagnosticCoding}
        />
      </Form>
    );
  };

  useEffect(() => {
    if (diagnosticsTest?.id) {
      fetchCoding();
    }
  }, [diagnosticsTest?.id]);

  return (
    <ChildModal
      actionChildButtonFunction={handleSaveCoding}
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      title="Code"
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Code', icon: <FaNewspaper /> }]}
      childStep={[{ title: 'Code Info', icon: <FaNewspaper /> }]}
      childTitle="Add Code"
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};

export default Coding;
