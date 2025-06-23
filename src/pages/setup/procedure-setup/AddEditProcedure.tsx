import React, { useEffect, useState } from 'react';
import {
  useGetIcdListQuery,
  useGetLovValuesByCodeQuery,
  useGetProcedureCodingListQuery,
  useGetProcedurePriceListQuery,
  useRemoveProcedureCodingMutation,
  useRemoveProcedurePriceListMutation,
  useSaveProcedureCodingMutation,
  useSaveProcedureMutation,
  useSaveProcedurePriceListMutation
} from '@/services/setupService';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApProcedureCoding, ApProcedurePriceList } from '@/types/model-types';
import {
  newApProcedure,
  newApProcedureCoding,
  newApProcedurePriceList
} from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import { FaQrcode } from 'react-icons/fa6';
import { FaProcedures } from 'react-icons/fa';
import { FaMoneyBillAlt } from 'react-icons/fa';
const AddEditProcedure = ({ open, setOpen, procedure, setProcedure, profetch }) => {
  const dispatch = useAppDispatch();
  const [procedureCode, setProcedureCode] = useState<ApProcedureCoding>({
    ...newApProcedureCoding,
    procedureKey: procedure?.key
  });
  const [procedureprice, setProcedurePrice] = useState<ApProcedurePriceList>({
    ...newApProcedurePriceList
  });
  const [childStep, setChildStep] = useState<number>(-1);
  const [openChildModal, setOpenChildModal] = useState<boolean>(false);
  const [indicationsDescription, setindicationsDescription] = useState<string>('');
  const [contraindicationsDescription, setContraindicationsDescription] = useState<string>('');
  const [recordOfIndicationsDescription, setRecordOfIndicationsDescription] = useState({
    indicationsDescription: ''
  });
  const [recordOfContraindicationsDescription, setRecordOfContraindicationsDescription] = useState({
    contraindicationsDescription: ''
  });
  const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState<boolean>(false);
  const [icdListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });
  // Fetch icd list response
  const { data: icdListResponseLoading } = useGetIcdListQuery(icdListRequest);
  // customise item appears on the selected cdt list
  const modifiedData = (icdListResponseLoading?.object ?? []).map(item => ({
    ...item,
    combinedLabel: `${item.icdCode} - ${item.description}`
  }));
  // Fetch currency list response
  const { data: currencyLovQueryResponse } = useGetLovValuesByCodeQuery('CURRENCY');
  // Fetch category list response
  const { data: CategoryLovQueryResponse } = useGetLovValuesByCodeQuery('PROCEDURE_CAT');
  // Fetch code type list response
  const { data: codeTypeLovQueryResponse } = useGetLovValuesByCodeQuery('INTERNATIONAL_CODES');
  // Fetch procedure coding list response
  const {
    data: procedurecodingQueryResponse,
    refetch: procfetch,
    isFetching: isFetchingCoding
  } = useGetProcedureCodingListQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'procedure_key',
        operator: '',
        value: procedure?.key
      }
    ],
    ignore: procedure?.key == undefined
  });
  // Fetch procedure price list response
  const {
    data: procedurepriceQueryResponse,
    refetch: propfetch,
    isFetching: isFetchingPriceList
  } = useGetProcedurePriceListQuery({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'procedure_key',
        operator: '',
        value: procedure?.key
      }
    ],
    ignore: procedure?.key == undefined
  });
  // save procedure
  const [saveProcedure] = useSaveProcedureMutation();
  // save procedure price
  const [saveProcedurePrice] = useSaveProcedurePriceListMutation();
  // save procedure coding
  const [saveProcedureCoding] = useSaveProcedureCodingMutation();
  // remove procedure coding
  const [removeProcedureCoding] = useRemoveProcedureCodingMutation();
  // remove procedure price list
  const [removeProcedurePriceList] = useRemoveProcedurePriceListMutation();
  // class name for selected code
  const isSelectedcode = rowData => {
    if (rowData && procedureCode && rowData?.key === procedureCode?.key) {
      return 'selected-row';
    } else return '';
  };
  // class name for selected price
  const isSelectedprice = rowData => {
    if (rowData && procedureprice && rowData?.key === procedureprice?.key) {
      return 'selected-row';
    } else return '';
  };
  // handle save procedure
  const handleSave = async () => {
  try {
    const response = await saveProcedure({
      ...procedure,
      indications: indicationsDescription,
      contraindications: contraindicationsDescription,
      isValid: true
    }).unwrap();
    dispatch(notify({ msg: 'The Procedure has been saved successfully', sev: 'success' }));
    profetch();
    setProcedure(response);

  } catch (error) {
    dispatch(notify({ msg: 'Failed to save this Procedure', sev: 'error' }));
  }
};

  // handle save procedure codeing
  const handleSaveCoding = () => {
    setProcedureCode({
      ...newApProcedureCoding,
      procedureKey: procedure?.key
    });
    saveProcedureCoding({ ...procedureCode, procedureKey: procedure?.key })
      .unwrap()
      .then(() => {
        dispatch(notify({ msg: 'The Code has been saved successfully', sev: 'success' }));
        procfetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Code', sev: 'error' }));
      });
  };
  const joinValuesFromArray = values => {
    return values.filter(Boolean).join(', ');
  };
  // handle save procedure price
  const handleSavePrice = () => {
    saveProcedurePrice({ ...procedureprice, procedureKey: procedure?.key })
      .unwrap()
      .then(() => {
        setProcedurePrice({
          ...newApProcedurePriceList
        });
        dispatch(notify({ msg: 'The Price List has been saved successfully', sev: 'success' }));
        propfetch();
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to save this Price List', sev: 'error' }));
      });
  };
  // handle remove procedure coding
  const handleRemoveProcedureCoding = () => {
    setOpenConfirmDeleteModal(false);
    removeProcedureCoding({ ...procedureCode })
      .unwrap()
      .then(() => {
        procfetch();
        dispatch(notify({ msg: 'The Code Deleted Successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to delete this code', sev: 'success' }));
      });
  };
  // handle remove procedure price list
  const handleRemoveProcedurePriceList = () => {
    setOpenConfirmDeleteModal(false);
    removeProcedurePriceList({ ...procedureprice })
      .unwrap()
      .then(() => {
        propfetch();
        dispatch(notify({ msg: 'The Price List Deleted Successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to delete this Price List', sev: 'success' }));
      });
  };

  // Icons column (delete)
  const iconsForActions = () => (
    <div className="container-of-icons-procedure">
      <MdDelete
        className="icons-procedure"
        title="Deactivate"
        size={24}
        fill="var(--primary-pink)"
        onClick={() => {
          setOpenConfirmDeleteModal(true);
        }}
      />
    </div>
  );
  //Table Coding columns
  const tableCodingColumns = [
    {
      key: 'type',
      title: <Translate>Code Type</Translate>,
      flexGrow: 4,
      render: rowData =>
        rowData.codeTypeLkey ? rowData.codeTypeLvalue.lovDisplayVale : rowData.codeTypeLkey
    },
    {
      key: 'code',
      title: <Translate>international Code</Translate>,
      flexGrow: 4,
      render: rowData => rowData.internationalCodeKey
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];

  //Table Price columns
  const tablePriceColumns = [
    {
      key: 'price_urrency',
      title: <Translate>Price,Currency</Translate>,
      flexGrow: 4,
      render: rowData =>
        joinValuesFromArray([rowData.price, rowData.currencyLvalue?.lovDisplayVale])
    },
    {
      key: 'name',
      title: <Translate>Price List Name</Translate>,
      flexGrow: 4,
      render: rowData => rowData.priceListKey
    },
    {
      key: 'icons',
      title: <Translate></Translate>,
      flexGrow: 3,
      render: () => iconsForActions()
    }
  ];
  // Main modal content
  const conjureFormContentOfMainModal = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form layout="inline" fluid>
            <div className="container-of-two-fields-procedure">
              <MyInput
                column
                width={250}
                fieldLabel="Procedure Name"
                fieldName={'name'}
                record={procedure}
                setRecord={setProcedure}
              />
              <MyInput
                column
                width={250}
                fieldLabel="Procedure Code"
                fieldName={'code'}
                record={procedure}
                setRecord={setProcedure}
              />
            </div>
            <div className="container-of-two-fields-vaccine">
              <MyInput
                column
                width={250}
                fieldType="select"
                fieldLabel="Category Type"
                selectData={CategoryLovQueryResponse?.object ?? []}
                selectDataLabel="lovDisplayVale"
                selectDataValue="key"
                fieldName={'categoryLkey'}
                record={procedure}
                setRecord={setProcedure}
              />
              <MyInput
                column
                width={250}
                fieldLabel="Appointable"
                fieldType="checkbox"
                fieldName="isAppointable"
                record={procedure}
                setRecord={setProcedure}
              />
            </div>
            <MyInput
              width={520}
              column
              fieldLabel="Indications"
              fieldType="select"
              fieldName="indications"
              selectData={modifiedData}
              selectDataLabel="combinedLabel"
              selectDataValue="key"
              record={procedure}
              setRecord={setProcedure}
              menuMaxHeight={200}
              placeholder="Search ICD-10"
            />
            <MyInput
              disabled={true}
              fieldType="textarea"
              record={recordOfIndicationsDescription}
              setRecord={''}
              showLabel={false}
              fieldName="indicationsDescription"
              width={520}
            />
            <MyInput
              width={520}
              column
              fieldLabel="Contraindications"
              fieldType="select"
              fieldName="contraindications"
              selectData={modifiedData}
              selectDataLabel="combinedLabel"
              selectDataValue="key"
              record={procedure}
              setRecord={setProcedure}
              menuMaxHeight={200}
              placeholder="Search ICD-10"
            />
            <MyInput
              disabled={true}
              fieldType="textarea"
              record={recordOfContraindicationsDescription}
              setRecord={''}
              showLabel={false}
              fieldName="contraindicationsDescription"
              width={520}
            />
            <div className="container-of-two-fields-vaccine">
              <MyInput
                column
                width={250}
                fieldType="textarea"
                fieldName={'preparationInstructions'}
                record={procedure}
                setRecord={setProcedure}
              />
              <MyInput
                column
                width={250}
                fieldType="textarea"
                fieldName={'recoveryNotes'}
                record={procedure}
                setRecord={setProcedure}
              />
            </div>
          </Form>
        );
      case 1:
        return (
          <Form>
            <div className="container-of-add-new-button-procedure">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenChildModal(true);
                  setChildStep(1);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={procedurecodingQueryResponse?.object ?? []}
              loading={isFetchingCoding}
              columns={tableCodingColumns}
              rowClassName={isSelectedcode}
              onRowClick={rowData => {
                setProcedureCode(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteModal}
              setOpen={setOpenConfirmDeleteModal}
              itemToDelete="Code"
              actionButtonFunction={handleRemoveProcedureCoding}
              actionType="delete"
            />
          </Form>
        );
      case 2:
        return (
          <Form>
            <div className="container-of-add-new-button-procedure">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                onClick={() => {
                  setOpenChildModal(true);
                  setChildStep(2);
                }}
                width="90px"
              >
                Add
              </MyButton>
            </div>
            <MyTable
              height={450}
              data={procedurepriceQueryResponse?.object ?? []}
              loading={isFetchingPriceList}
              columns={tablePriceColumns}
              rowClassName={isSelectedprice}
              onRowClick={rowData => {
                setProcedurePrice(rowData);
              }}
            />
            <DeletionConfirmationModal
              open={openConfirmDeleteModal}
              setOpen={setOpenConfirmDeleteModal}
              itemToDelete="Price List"
              actionButtonFunction={handleRemoveProcedurePriceList}
              actionType="delete"
            />
          </Form>
        );
    }
  };
  const conjureFormContentOfChildModal = () => {
    switch (childStep) {
      case 0:
        return <div></div>;
      case 1:
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
              record={procedureCode}
              setRecord={setProcedureCode}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldLabel="Code"
              selectData={[]}
              selectDataLabel="name"
              selectDataValue="key"
              fieldName={'internationalCodeKey'}
              record={procedureCode}
              setRecord={setProcedureCode}
            />
          </Form>
        );
      case 2:
        return (
          <Form fluid>
            <MyInput
              width="100%"
              fieldType="number"
              fieldName={'price'}
              record={procedureprice}
              setRecord={setProcedurePrice}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldLabel="Currency"
              selectData={currencyLovQueryResponse?.object ?? []}
              selectDataLabel="lovDisplayVale"
              selectDataValue="key"
              fieldName={'currencyLkey'}
              record={procedureprice}
              setRecord={setProcedurePrice}
            />
            <MyInput
              width="100%"
              fieldType="select"
              fieldLabel=" Choose Price List"
              selectData={[]}
              selectDataLabel="name"
              selectDataValue="key"
              fieldName={'internationalCodeKey'}
              record={procedureprice}
              setRecord={setProcedurePrice}
            />
          </Form>
        );
    }
  };

  // Effects
  useEffect(() => {
    if (!open) {
      setProcedure({ ...newApProcedure });
      setRecordOfIndicationsDescription({
        indicationsDescription: ''
      });
      setRecordOfContraindicationsDescription({
        contraindicationsDescription: ''
      });
    }
  }, [open]);

  useEffect(() => {
    if (procedure?.indications != null) {
      setindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item?.key === procedure?.indications
        );
        if (!currentIcd) return prevadminInstructions;
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [procedure?.indications]);

  useEffect(() => {
    if (procedure?.contraindications != null) {
      setContraindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item?.key === procedure?.contraindications
        );
        if (!currentIcd) return prevadminInstructions;
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [procedure?.contraindications]);

  useEffect(() => {
    setindicationsDescription(procedure?.key ? procedure?.indications : '');
    setContraindicationsDescription(procedure?.key ? procedure?.contraindications : '');
  }, [procedure?.key]);

  useEffect(() => {
    setRecordOfIndicationsDescription({
      indicationsDescription: indicationsDescription
    });
  }, [indicationsDescription]);

  useEffect(() => {
    setRecordOfContraindicationsDescription({
      contraindicationsDescription: contraindicationsDescription
    });
  }, [contraindicationsDescription]);

  return (
    <ChildModal
      hideActionChildBtn
      actionButtonFunction={() => setOpen(false)}
      open={open}
      setOpen={setOpen}
      showChild={openChildModal}
      setShowChild={setOpenChildModal}
      title={procedure?.key ? 'Edit Procedure' : 'New Procedure'}
      mainContent={conjureFormContentOfMainModal}
      mainStep={[
        {
          title: 'Info',
          icon: <FaProcedures />,
          disabledNext: !procedure?.key,
          footer: <MyButton onClick={handleSave}>Save</MyButton>
        },
        {
          title: 'Coding',
          icon: <FaQrcode />
        },
        {
          title: 'Price',
          icon: <FaMoneyBillAlt />
        }
      ]}
      childTitle={childStep == 1 ? 'New Code' : 'New Price List'} // baaaaaaaaaaack
      childContent={conjureFormContentOfChildModal}
      mainSize="sm"
      childStep={[
        {
          title: childStep == 1 ? 'Coding' : 'Price List', //baack
          icon: childStep == 1 ? <FaQrcode /> : <FaMoneyBillAlt />,
          footer: (
            <MyButton onClick={childStep == 1 ? handleSaveCoding : handleSavePrice}>Save</MyButton>
          )
        }
      ]}
    />
  );
};
export default AddEditProcedure;
