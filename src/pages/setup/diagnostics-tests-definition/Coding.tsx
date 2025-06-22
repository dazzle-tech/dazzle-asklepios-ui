import React, { useEffect, useState } from 'react';
import {
  useGetDiagnosticsCodingListQuery,
  useGetLovValuesByCodeQuery,
  useSaveDiagnosticsCodingMutation,
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { initialListRequest, ListRequest } from '@/types/types';
import { FaNewspaper } from 'react-icons/fa6';
import MyButton from '@/components/MyButton/MyButton';
import { newApDiagnosticCoding } from '@/types/model-types-constructor';
const Coding = ({ open, setOpen, diagnosticsTest }) => {
  const dispatch = useAppDispatch();
  const [openChild, setOpenChild] = useState<boolean>(false);
  const [diagnosticCoding, setDiagnosticCoding] = useState({ ...newApDiagnosticCoding });
   const [listCodingRequest, setListCosingRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'diagnostics_key',
        operator: 'match',
        value: diagnosticsTest?.key
      }
    ]
  });
  // Fetch code type Lov response
  const { data: codeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
   // Fetch Coding list response
  const { data: CodingList, refetch: fetchCoding, isFetching } = useGetDiagnosticsCodingListQuery({
    ...listCodingRequest
  });
  // save coding
  const [saveCoding] = useSaveDiagnosticsCodingMutation();

  //Table columns
  const tableColumns = [
    {
      key: 'codeType',
      title: <Translate>Code Type</Translate>,
      render: rowData =>
        rowData.codeTypeLkey ? rowData.codeTypeLvalue.lovDisplayVale : rowData.codeTypeLkey
    },
    {
      key: 'internationalCode',
      title: <Translate>international Code</Translate>,
      render: rowData => rowData.internationalCodeKey
    }
  ];
  // class name for selected row 
  const isSelectedcode = rowData => {
    if (rowData && diagnosticCoding && rowData.key === diagnosticCoding.key) {
      return 'selected-row';
    } else return '';
  };
  
  // handle save code
  const handleSaveCoding = async () => {
      try {
        await saveCoding({ ...diagnosticCoding, diagnosticsKey: diagnosticsTest.key }).unwrap();
        dispatch(notify({ msg: 'Saved Successfully', sev: 'Success' }));
        fetchCoding();
      } catch {}
    };

  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-add-new-button-practitioners">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenChild(true);
                }}
                width="109px"
              >
                Add New
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={CodingList?.object ?? []}
              loading={isFetching}
              columns={tableColumns}
              rowClassName={isSelectedcode}
              onRowClick={rowData => {
                setDiagnosticCoding(rowData);
              }}
              sortColumn={listCodingRequest.sortBy}
              sortType={listCodingRequest.sortType}
              onSortChange={(sortBy, sortType) => {
                if (sortBy) setListCosingRequest({ ...listCodingRequest, sortBy, sortType });
              }}
            />          
          </Form>
        );
    }
  };

  // Child modal content
  const conjureFormContentOfChildModal = () => {
    return (
      <Form fluid>
        <MyInput
          width="100%"
          fieldType="select"
          fieldLabel="Code Type"
          selectData={codeTypeLovQueryResponse?.object ?? []}
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          fieldName={'codeTypeLkey'}
          record={diagnosticCoding}
          setRecord={setDiagnosticCoding}
        />
        <MyInput
          column
          width="100%"
          fieldType="select"
          fieldLabel="Code"
          selectData={[]}
          selectDataLabel="name"
          selectDataValue="key"
          fieldName={'internationalCodeKey'}
          record={diagnosticCoding}
          setRecord={setDiagnosticCoding}
        />
      </Form>
    );
  };
   
   useEffect(() => {
    fetchCoding();
           setListCosingRequest({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'diagnostics_key',
        operator: 'match',
        value: diagnosticsTest?.key
      }
    ]
  });
  }, [diagnosticsTest]);

  return (
    <ChildModal
      actionChildButtonFunction={handleSaveCoding}
      open={open}
      setOpen={setOpen}
      showChild={openChild}
      setShowChild={setOpenChild}
      title='Code'
      mainContent={conjureFormContentOfMainModal}
      mainStep={[{ title: 'Code', icon: <FaNewspaper /> }]} // اغير الايقونة
      childTitle="Add Code"
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
    />
  );
};
export default Coding;
