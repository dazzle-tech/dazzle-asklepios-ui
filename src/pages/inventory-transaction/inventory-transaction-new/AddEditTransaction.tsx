import AdvancedModal from '@/components/AdvancedModal';
import MyButton from '@/components/MyButton/MyButton';
import MyInput from '@/components/MyInput';
import { useAppDispatch, useAppSelector } from '@/hooks';
import AddEditWarehouse from '@/pages/setup/warehouse-setup/AddEditWarehouse';
import {
  useDeleteAttachmentMutation,
  useGetDownloadUrlMutation,
  useGetInventoryTransactionAttachmentsQuery,
  useUploadAttachmentsMutation
} from '@/services/inventory/inventory-transaction/attachmentService';
import {
  useConfirmTransProductStockInMutation,
  useConfirmTransProductStockOutMutation,
  useGetInventoryTransactionsProductQuery,
  useSaveInventoryTransactionMutation,
  useSaveInventoryTransactionProductMutation
} from '@/services/inventoryTransactionService';
import {
  useGetDepartmentsQuery,
  useGetLovValuesByCodeQuery,
  useGetWarehouseQuery
} from '@/services/setupService';
import { ApInventoryTransactionProduct, ApWarehouse } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApWarehouse } from '@/types/model-types-constructor';
import { initialListRequest, ListRequest } from '@/types/types';
import { notify } from '@/utils/uiReducerActions';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Plus } from '@rsuite/icons';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import React, { useEffect, useMemo, useState } from 'react';
import { FaCalendarAlt, FaInfoCircle } from 'react-icons/fa';
import { FaPaperclip, FaUser, FaWarehouse } from 'react-icons/fa6';
import { MdDelete } from 'react-icons/md';
import { Divider, Form, Nav, Panel, Stack, Uploader } from 'rsuite';
import AddEditProductIn from './AddEditProductIn';
import AddEditProductOut from './AddEditProductOut';
import InventoryAttachment from './InventoryAttachment';
import ProductListIn from './ProductListIn';
import ProductListOut from './ProductListOut';
import StockIn from './StockIn';
import StockOut from './StockOut';
import './styles.less';

const AddEditTransaction = ({
  open,
  setOpen,
  transaction,
  setTransaction,
  refetch,
  refetchAttachmentList
}) => {
  const dispatch = useAppDispatch();
  const mode = useAppSelector((state: any) => state.ui.mode);
  const authSlice = useAppSelector(state => state.auth);
  const [saveTransaction, saveTransactionMutation] = useSaveInventoryTransactionMutation();
  const [openNextDocument, setOpenNextDocument] = useState(false);
  const [openChildModal, setOpenChildModal] = useState(false);
  const [showSubChildModal, setShowSubChildModal] = useState(false);

  // Attachment service hooks
  const [uploadAttachment] = useUploadAttachmentsMutation();
  const [deleteAttachment] = useDeleteAttachmentMutation();
  const [getDownloadUrl] = useGetDownloadUrlMutation();

  // Fetch attachments if transaction has an ID
  const { data: existingAttachments, refetch: refetchAttachments } =
    useGetInventoryTransactionAttachmentsQuery(
      { transactionId: transaction?.key },
      { skip: !transaction?.key }
    );

  // Clear attachments list when switching transactions or closing modal
  useEffect(() => {
    if (!transaction?.key || !open) {
      setAttachments([]);
    }
  }, [transaction?.key, open]);

  const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const [warehouseListRequest, setWarehouseListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      }
    ]
  });

  const [transProductListRequest, setTransProductListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'inventory_trans_key',
        operator: 'match',
        value: transaction?.key
      }
    ]
  });

  const { data: transProductListResponse, refetch: refetchTransProductList } =
    useGetInventoryTransactionsProductQuery(transProductListRequest);

  const [saveTransactionProduct, saveTransactionProductMutation] =
    useSaveInventoryTransactionProductMutation();
  const [confirmProductStockIn, confirmProductStockInMutation] =
    useConfirmTransProductStockInMutation();
  const [confirmProductStockOut, confirmProductStockOutMutation] =
    useConfirmTransProductStockOutMutation();

  const [transProduct, setTransProduct] = useState<ApInventoryTransactionProduct>({
    ...newApInventoryTransactionProduct
  });

  const now = new Date();

  const [generateCode, setGenerateCode] = useState();
  const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({ transId: '' });
  // Generate code for transaction
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setTransaction({ ...transaction, transId: code });
  };

  const [openAddEditWarehousePopup, setOpenAddEditWarehousePopup] = useState(false);
  const { data: warehouseListResponse } = useGetWarehouseQuery(warehouseListRequest);

  const [edit_new, setEdit_new] = useState(false);
  const [warehouse, setWarehouse] = useState<ApWarehouse>({ ...newApWarehouse });

  const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');

  const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');

  const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

  const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

  const handleSave = () => {
    if (
      !transaction.transTypeLkey ||
      !transaction.warehouseKey ||
      !transaction.transReasonLkey.trim()
    ) {
      dispatch(
        notify({
          msg: 'Please fill Transaction Type, Warehouse and Transaction Reason. ',
          sev: 'error'
        })
      );
      return;
    }
    saveTransaction({
      ...transaction,
      createdBy: authSlice.user.key,
      createdAt: null
    })
      .unwrap()
      .then(result => {
        setTransaction(result);
        console.log(result);
        refetch();
        setOpenNextDocument(true);
        dispatch(
          notify({
            msg: 'The transaction Added/Edited successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
          console.log('Validation error: Unprocessable Entity', e);
        } else {
          console.log('An unexpected error occurred', e);
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
        }
      });
  };
  // const handleSave = () => {
  //     const response = saveTransaction({
  //         ...transaction,
  //         createdBy: authSlice.user.key,
  //         createdAt: null
  //     }).unwrap().then(() => {
  //         setTransaction(response );
  //         console.log(response);
  //         refetch();
  //         setOpenNextDocument(true);
  //         dispatch(
  //             notify({
  //                 msg: 'The transaction Added/Edited successfully ',
  //                 sev: 'success'
  //             })
  //         );
  //     }).catch((e) => {

  //         if (e.status === 422) {
  //             console.log("Validation error: Unprocessable Entity", e);

  //         } else {
  //             console.log("An unexpected error occurred", e);
  //             dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
  //         }
  //     });;

  // };

  useEffect(() => {
    console.log('this is a transaction');
    console.log(transaction);
  }, [openNextDocument]);

  // Handle Go To Patient Profile
  const goToPatientProfile = () => {
    // setOpen(false);
    // const privatePatientPath = '/patient-profile';
    // navigate(privatePatientPath, { state: { patient: localPatient } });
    // setLocalPatient({ ...newApPatient });
    // setPatientInsurance({ ...newApPatientInsurance });
  };

  useEffect(() => {
    if (transaction?.transTypeLkey === '6509266518641689') {
      //Stock Out
      setActiveKey('StockOut');
    } else if (transaction?.transTypeLkey === '6509244814441399') {
      //Stock In
      setActiveKey('StockIn');
    } else {
      setActiveKey('');
    }
  }, [transaction?.transTypeLkey]);

  useEffect(() => {
    setTransaction({
      ...transaction,
      createdBy: authSlice.user.username,
      createdAt: now.toString()
    });
    setOpenNextDocument(false);
  }, [transaction?.key]);

  useEffect(() => {
    setTransProductListRequest(prev => ({
      ...prev,
      filters: [
        {
          fieldName: 'deleted_at',
          operator: 'isNull',
          value: undefined
        },
        {
          fieldName: 'inventory_trans_key',
          operator: 'match',
          value: transaction?.key
        }
      ]
    }));
  }, [transProduct?.productKey]);

  useEffect(() => {
    if (transaction?.transId) {
      setRecordOfWarehouseCode({ transId: transaction.transId });
      return;
    }
    generateFiveDigitCode();
    setRecordOfWarehouseCode({ transId: transaction?.transI ?? generateCode });
    console.log(recordOfWarehouseCode);
  }, [transaction?.transId?.length]);

  // Main modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <div className="container-of-three-fields">
              <MyInput
                fieldLabel="transaction ID"
                fieldName="transId"
                record={recordOfWarehouseCode}
                setRecord={setRecordOfWarehouseCode}
                disabled={true}
              />
            </div>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Transaction Type"
                  fieldName="transTypeLkey"
                  fieldType="select"
                  selectData={transTypeListResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Warehouse"
                  fieldName="warehouseKey"
                  fieldType="select"
                  selectData={warehouseListResponse?.object ?? []}
                  selectDataLabel="warehouseName"
                  selectDataValue="key"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Transaction Reason"
                  fieldName="transReasonLkey"
                  fieldType="select"
                  selectData={
                    transaction.transTypeLkey === '6509244814441399'
                      ? transReasonInListResponse?.object ?? []
                      : transReasonOutListResponse?.object ?? []
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Reference Doc Num."
                  fieldName="docNum"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div className="container-of-two-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Performed By"
                  disabled
                  fieldName="createdBy"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Date & Times"
                  disabled
                  fieldName="createdAt"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div>
              <MyInput
                width="100%"
                fieldLabel="Remarks"
                fieldName="remarks"
                fieldType="textarea"
                record={transaction}
                setRecord={setTransaction}
              />
            </div>
            <br />
            <div className="container-of-add-new-button">
              <MyButton
                prefixIcon={() => <AddOutlineIcon />}
                color="var(--deep-blue)"
                disabled={!transaction?.key && !openNextDocument}
                onClick={() => {
                  setOpenChildModal(true);
                }}
                width="109px"
              >
                Add Product
              </MyButton>
            </div>
          </Form>
        );
      case 1:
        return (
          <Form fluid>
            <InventoryAttachment
              transaction={transaction}
              setTransaction={setTransaction}
              refetchAttachmentList={refetchAttachmentList}
            />
          </Form>
        );
    }
  };

  const childInContent = (
    <Form fluid>
      <ProductListIn
        open={openChildModal}
        setOpen={setOpenChildModal}
        showSubChildModal={showSubChildModal}
        setShowSubChildModal={setShowSubChildModal}
        refetch={refetchTransProductList}
        transaction={transaction}
        setTransaction={setTransaction}
      />
    </Form>
  );

  const childOutContent = (
    <Form fluid>
      <ProductListOut
        open={openChildModal}
        setOpen={setOpenChildModal}
        showSubChildModal={showSubChildModal}
        setShowSubChildModal={setShowSubChildModal}
        refetch={refetchTransProductList}
        transaction={transaction}
        setTransaction={setTransaction}
      />
    </Form>
  );

  const subChildContentIn = () => {
    return (
      <AddEditProductIn
        open={showSubChildModal}
        setOpen={setShowSubChildModal}
        transProduct={transProduct}
        setTransProduct={setTransProduct}
        transaction={transaction}
        setTransaction={setTransaction}
        refetch={refetch}
      />
    );
  };
  const subChildContentOut = () => {
    return (
      <AddEditProductOut
        open={showSubChildModal}
        setOpen={setShowSubChildModal}
        transProduct={transProduct}
        setTransProduct={setTransProduct}
        transaction={transaction}
        setTransaction={setTransaction}
        refetch={refetch}
      />
    );
  };
  const handleSavesubchild = () => {
    const response = saveTransactionProduct({
      ...transProduct,
      inventoryTransactionKey: transaction.key
    })
      .unwrap()
      .then(result => {
        console.log(result);
        setTransProduct(result);
        refetch();
        refetchTransProductList();
        setTransProduct({ ...newApInventoryTransactionProduct, productKey: null });
        dispatch(
          notify({
            msg: 'The Inventory Transaction Product Added/Edited successfully ',
            sev: 'success'
          })
        );
      })
      .catch(e => {
        if (e.status === 422) {
          console.log('Validation error: Unprocessable Entity', e);
        } else {
          console.log('An unexpected error occurred', e);
          dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
        }
      });
  };

  const handleSavechildIn = () => {
    setOpenChildModal(false);
    confirmProductStockIn({
      key: transaction?.key
    })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The product was successfully Added to stock',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Fail',
            sev: 'error'
          })
        );
      });
  };

  const handleSavechildOut = () => {
    setOpenChildModal(false);
    confirmProductStockOut({
      key: transaction?.key
    })
      .unwrap()
      .then(() => {
        dispatch(
          notify({
            msg: 'The product was successfully Added to stock',
            sev: 'success'
          })
        );
      })
      .catch(() => {
        dispatch(
          notify({
            msg: 'Fail',
            sev: 'error'
          })
        );
      });
  };

  const [activeKey, setActiveKey] = useState('');
  // Attachments
  const [attachments, setAttachments] = useState<File[]>([]);
  const handleUploadChange = (fileList: File[]) => {
    setAttachments(fileList);
  };

  const handleUploadAttachments = async () => {
    if (!transaction?.key || attachments.length === 0) return;

    try {
      for (const file of attachments) {
        await uploadAttachment({
          transactionId: transaction.key,
          file: (file as any).blobFile || file
        }).unwrap();
      }
      dispatch(notify({ sev: 'success', msg: 'Attachments uploaded successfully' }));
      refetchAttachments();
      setAttachments([]);
    } catch (error) {
      console.error('Error uploading attachments:', error);
      dispatch(notify({ sev: 'error', msg: 'Failed to upload attachments' }));
    }
  };

  const handleDownloadAttachment = async (attachmentId: number) => {
    try {
      const response = await getDownloadUrl(attachmentId).unwrap();
      window.open(response.url, '_blank');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      dispatch(notify({ sev: 'error', msg: 'Failed to download attachment' }));
    }
  };

  const handleDeleteAttachment = async (attachmentId: number) => {
    try {
      await deleteAttachment({ id: attachmentId, transactionId: transaction?.key }).unwrap();
      dispatch(notify({ sev: 'success', msg: 'Attachment deleted successfully' }));
      refetchAttachments();
    } catch (error) {
      console.error('Error deleting attachment:', error);
      dispatch(notify({ sev: 'error', msg: 'Failed to delete attachment' }));
    }
  };

  const selectedWarehouse = useMemo(() => {
    const list = warehouseListResponse?.object ?? [];
    return list.find((w: any) => w.key === transaction?.warehouseKey);
  }, [warehouseListResponse?.object, transaction?.warehouseKey]);

  const topContent = () => {
    return (
      <>
        <Panel
          header="Transaction Information"
          bordered
          style={{
            marginBottom: 20,
            backgroundColor: mode === 'light' ? 'white' : 'var(--dark-black)',
            padding: 20,
            borderRadius: 6,
            height: 350,
            overflowY: 'auto'
          }}
        >
          <div className="table-buttons-right">
            <AddEditWarehouse
              open={openAddEditWarehousePopup}
              setOpen={setOpenAddEditWarehousePopup}
              warehouse={warehouse}
              setWarehouse={setWarehouse}
              edit_new={edit_new}
              setEdit_new={setEdit_new}
              refetch={refetch}
            />
          </div>
          <Form fluid>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={transaction?.key}
                  fieldLabel="Transaction Type"
                  fieldName="transTypeLkey"
                  fieldType="select"
                  selectData={transTypeListResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={transaction?.key}
                  fieldLabel="Warehouse"
                  fieldName="warehouseKey"
                  fieldType="select"
                  selectData={warehouseListResponse?.object ?? []}
                  selectDataLabel="warehouseName"
                  selectDataValue="key"
                  rightAddon={<Plus />}
                  record={transaction}
                  setRecord={setTransaction}
                  searchable={false}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={openNextDocument}
                  fieldLabel="Transaction Reason"
                  fieldName="transReasonLkey"
                  fieldType="select"
                  selectData={
                    !transaction.transTypeLkey
                      ? []
                      : transaction.transTypeLkey === '6509244814441399'
                      ? transReasonInListResponse?.object ?? []
                      : transReasonOutListResponse?.object ?? []
                  }
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={transaction?.key}
                  fieldLabel="Reference Doc Num."
                  fieldName="docNum"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Approved By"
                  disabled
                  fieldName="updateBy"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={openNextDocument}
                  fieldLabel="Approval Status "
                  fieldName="docNum"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={openNextDocument}
                  fieldLabel="Vender"
                  fieldName="remarks"
                  hight="50%"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>

              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Serial Number"
                  disabled
                  fieldName="serialNumber"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  fieldLabel="Invoice Number"
                  disabled
                  fieldName="InvoiceNumber"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>
            </div>
            <div className="container-of-three-fields">
              <div className="container-of-field">
                <MyInput
                  width="100%"
                  disabled={openNextDocument}
                  fieldLabel="Remarks"
                  fieldName="remarks"
                  fieldType="textarea"
                  hight="50%"
                  record={transaction}
                  setRecord={setTransaction}
                />
              </div>

              <div className="table-buttons-right">
                <MyButton appearance="primary" onClick={handleSave} disabled={transaction?.key}>
                  Save Transaction
                </MyButton>
                <MyButton
                  appearance="ghost"
                  title="Add New Warehouse"
                  disabled={transaction?.key}
                  onClick={() => setOpenAddEditWarehousePopup(true)}
                >
                  <FontAwesomeIcon icon={faPlus} /> Add New Warehouse
                </MyButton>
              </div>
            </div>
          </Form>
        </Panel>
      </>
    );
  };

  const rightContent = () => {
    return (
      <div>
        {topContent()}
        <Nav appearance="tabs" activeKey={activeKey} onSelect={setActiveKey}>
          {transaction?.transTypeLkey && transaction.transTypeLkey !== '6509266518641689' && (
            <Nav.Item
              eventKey="StockIn"
              disabled={
                !transaction?.transTypeLkey || transaction.transTypeLkey !== '6509244814441399'
              }
            >
              Stock In
            </Nav.Item>
          )}
          {transaction?.transTypeLkey && transaction.transTypeLkey !== '6509244814441399' && (
            <Nav.Item
              eventKey="StockOut"
              disabled={
                !transaction?.transTypeLkey || transaction.transTypeLkey !== '6509266518641689'
              }
            >
              Stock Out
            </Nav.Item>
          )}
        </Nav>

        <div style={{ marginTop: 20 }}>
          <div></div>
          {activeKey === 'StockIn' && (
            <div>
              {' '}
              <StockIn
                transProduct={transProduct}
                setTransProduct={setTransProduct}
                transaction={transaction}
                setTransaction={setTransaction}
                refetch={refetch}
              />{' '}
            </div>
          )}
          {activeKey === 'StockOut' && (
            <div>
              {' '}
              <StockOut
                transProduct={transProduct}
                setTransProduct={setTransProduct}
                transaction={transaction}
                setTransaction={setTransaction}
                refetch={refetch}
              />
            </div>
          )}
        </div>
      </div>
    );
  };

  const leftContent = () => {
    return (
      <>
        {/* Transaction Details */}
        <Stack alignItems="center" spacing={8}>
          <FaInfoCircle color="#2264E5" />
          <h4
            style={{
              margin: 0,
              fontWeight: '600',
              fontSize: '1.1rem',
              color: mode === 'light' ? '#333' : 'var(--white)'
            }}
          >
            Transaction Details
          </h4>
        </Stack>
        <Divider style={{ margin: '10px 0' }} />
        <p>
          <b>Transaction ID:</b> {transaction.transId}
        </p>
        <p>
          <b>Performed By:</b> <FaUser style={{ marginRight: 5, color: '#666' }} />{' '}
          {authSlice.user.username}
        </p>
        <p>
          <b>Date & Time:</b> <FaCalendarAlt style={{ marginRight: 5, color: '#666' }} />{' '}
          {new Date().toLocaleString()}
        </p>

        {/* Attachments */}
        <Divider style={{ margin: '20px 0' }} />
        <Stack alignItems="center" spacing={8}>
          <FaPaperclip color="#FF6384" />
          <h5
            style={{
              margin: 0,
              fontWeight: '600',
              color: mode === 'light' ? '#444' : 'var(--white)'
            }}
          >
            Attachments
          </h5>
        </Stack>

        {/* Existing Attachments */}
        {transaction?.key && existingAttachments?.data?.length > 0 && (
          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '500', marginBottom: 5 }}>
              Uploaded Files:
            </p>

            {existingAttachments.data.map(att => (
              <div className="attachment-row" key={att.id}>
                <span className="attachment-name" onClick={() => handleDownloadAttachment(att.id)}>
                  {att.filename}
                </span>
                <MdDelete
                  className="attachment-delete"
                  size={20}
                  style={{ cursor: 'pointer', color: '#f44336' }}
                  onClick={() => handleDeleteAttachment(att.id)}
                />
              </div>
            ))}
          </div>
        )}

        {/* Upload New Attachments */}
        {!transaction?.key && (
          <p style={{ fontSize: '0.85rem', color: '#999', marginTop: 10 }}>
            Save the transaction first to upload attachments
          </p>
        )}
        <Uploader
          action=""
          autoUpload={false}
          multiple
          fileListVisible
          onChange={handleUploadChange}
          listType="picture-text"
          style={{ marginTop: 10 }}
          disabled={!transaction?.key}
        />
        {attachments.length > 0 && transaction?.key && (
          <MyButton
            appearance="primary"
            size="sm"
            style={{ marginTop: 10 }}
            onClick={handleUploadAttachments}
          >
            Upload Files
          </MyButton>
        )}

        {/* Warehouse Details Section - Conditional */}
        {transaction?.warehouseKey !== null && (
          <>
            <Divider style={{ margin: '20px 0' }} />
            <Stack alignItems="center" spacing={8}>
              <FaWarehouse color="#c7be0eff" />
              <h4
                style={{
                  margin: 0,
                  fontWeight: '600',
                  fontSize: '1.1rem',
                  color: mode === 'light' ? '#333' : 'var(--white)'
                }}
              >
                Warehouse Details
              </h4>
            </Stack>
            <Divider style={{ margin: '10px 0' }} />
            <p>
              <b>Warehouse Key:</b> {transaction.warehouseKey}
            </p>
            <p>
              <b>Warehouse Name:</b> {selectedWarehouse?.warehouseName}
            </p>
          </>
        )}
      </>
    );
  };

  return (
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      size="80vw"
      leftWidth="20%"
      rightWidth="80%"
      leftTitle={'Transaction Details'}
      actionButtonFunction={() => setOpen(false)}
      rightTitle="Add/Edit Transaction"
      rightContent={rightContent()}
      leftContent={leftContent()}
    ></AdvancedModal>
  );
};
export default AddEditTransaction;
