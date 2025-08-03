import React, { useEffect, useState } from 'react';
import {
    useDeactiveActivVaccineBrandsMutation,
    useGetDepartmentsQuery,
    useGetIcdListQuery,
    useGetLovValuesByCodeQuery,
    useGetVaccineBrandsListQuery,
    useGetWarehouseQuery,
    useSaveVaccineBrandMutation,
    useSaveVaccineMutation
} from '@/services/setupService';
import SearchIcon from '@rsuite/icons/Search';
import MyInput from '@/components/MyInput';
import { Dropdown, Form } from 'rsuite';
import './styles.less';
import ChildModal from '@/components/ChildModal';
import Translate from '@/components/Translate';
import MyTable from '@/components/MyTable';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { notify } from '@/utils/uiReducerActions';
import { MdVaccines } from 'react-icons/md';
import { MdMedication } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { initialListRequest, ListRequest } from '@/types/types';
import MyButton from '@/components/MyButton/MyButton';
import { ApInventoryTransactionProduct, ApVaccineBrands } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApVaccineBrands } from '@/types/model-types-constructor';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyModal from '@/components/MyModal/MyModal';
import { FaBabyCarriage, FaInbox, FaProductHunt } from 'react-icons/fa6';
import {  useConfirmTransProductStockInMutation, useConfirmTransProductStockOutMutation, useGetInventoryTransactionsProductQuery, useSaveInventoryTransactionMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { create, set } from 'lodash';
import authSlice from '@/reducers/authSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faIdCard, faInbox, faList, faListCheck, faPaperclip } from '@fortawesome/free-solid-svg-icons';
import InventoryAttachment from './InventoryAttachment';
import ProductListIn from './ProductListIn';
import AddEditProductIn from './AddEditProductIn';
import ProductListOut from './ProductListOut';
import AddEditProductOut from './AddEditProductOut';

const AddEditTransaction = ({ open, setOpen, transaction, setTransaction, refetch, refetchAttachmentList }) => {
    const dispatch = useAppDispatch();
    const authSlice = useAppSelector(state => state.auth);
    const [saveTransaction, saveTransactionMutation] = useSaveInventoryTransactionMutation();
    const [openNextDocument, setOpenNextDocument] = useState(false);
    const [openChildModal, setOpenChildModal] = useState(false);
    const [showSubChildModal, setShowSubChildModal] = useState(false);
    const [departmentListRequest, setDepartmentListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const [warehouseListRequest, setWarehouseListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });


      const [transProductListRequest, setTransProductListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'inventory_trans_key',
                operator: 'match',
                value: transaction?.key
            }
        ],
    });

     const { data: transProductListResponse , refetch: refetchTransProductList } = useGetInventoryTransactionsProductQuery(transProductListRequest);


     const [saveTransactionProduct, saveTransactionProductMutation] = useSaveInventoryTransactionProductMutation();
     const [confirmProductStockIn, confirmProductStockInMutation] = useConfirmTransProductStockInMutation();
     const [confirmProductStockOut, confirmProductStockOutMutation] = useConfirmTransProductStockOutMutation();

    const [transProduct, setTransProduct] = useState<ApInventoryTransactionProduct>({ ...newApInventoryTransactionProduct });

    const now = new Date();

    const [generateCode, setGenerateCode] = useState();
      const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({transId:  '' });
      // Generate code for transaction
      const generateFiveDigitCode = () => {
        const code = Math.floor(10000 + Math.random() * 90000);
        setTransaction({...transaction, transId: code})
      };

    const { data: warehouseListResponse } = useGetWarehouseQuery(warehouseListRequest);


    const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');

    const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');

    const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');

    const { data: departmentListResponse } = useGetDepartmentsQuery(departmentListRequest);

    const handleSave = () => {
    saveTransaction({
        ...transaction,
        createdBy: authSlice.user.key,
        createdAt: null
    }).unwrap().then((result) => {
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
    }).catch((e) => {
        if (e.status === 422) {
            console.log("Validation error: Unprocessable Entity", e);
        } else {
            console.log("An unexpected error occurred", e);
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
        console.log("this is a transaction");
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
        setTransaction({ ...transaction, createdBy: authSlice.user.username, createdAt: now.toString() });
        setOpenNextDocument(false);
    }, [transaction?.key]);

        useEffect(() => {
            setTransProductListRequest(prev => ({
                ...prev,
                filters: [
                    {
                        fieldName: 'deleted_at',
                        operator: 'isNull',
                        value: undefined,
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
    if (transaction?.transId){
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
                         <div className='container-of-three-fields' >

                            <MyInput
                            fieldLabel="transaction ID"
                                      fieldName="transId"
                                      record={recordOfWarehouseCode}
                                      setRecord={setRecordOfWarehouseCode}
                                      disabled={true}
                                    />
                         </div>
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
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
                            <div className='container-of-field' >
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
                        <div className='container-of-three-fields' >
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    fieldLabel="Transaction Reason"
                                    fieldName="transReasonLkey"
                                    fieldType="select"
                                    selectData={transaction.transTypeLkey === '6509244814441399' ? transReasonInListResponse?.object ?? [] : transReasonOutListResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    record={transaction}
                                    setRecord={setTransaction}
                                />
                            </div>
                            <div className='container-of-field' >
                                <MyInput
                                    width="100%"
                                    fieldLabel="Reference Doc Num."
                                    fieldName="docNum"
                                    record={transaction}
                                    setRecord={setTransaction}
                                />
                            </div>
                        </div>
                        <div className='container-of-two-fields'>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Performed By" disabled fieldName="createdBy" record={transaction} setRecord={setTransaction} />
                            </div>
                            <div className='container-of-field' >

                                <MyInput width="100%" fieldLabel="Date & Times" disabled fieldName="createdAt" record={transaction} setRecord={setTransaction} />
                            </div>
                        </div>
                        <div >

                            <MyInput
                                width="100%"
                                fieldLabel="Remarks"
                                fieldName="remarks"
                                fieldType="textarea"
                                record={transaction}
                                setRecord={setTransaction}
                            />

                        </div>
                        <br/>
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

                        <InventoryAttachment transaction={transaction} setTransaction={setTransaction} refetchAttachmentList={refetchAttachmentList} />

                    </Form>
                );
        }
    };

      const childInContent = (
        <Form fluid>
        <ProductListIn open={openChildModal} setOpen={setOpenChildModal} showSubChildModal={showSubChildModal} setShowSubChildModal={setShowSubChildModal} refetch={refetchTransProductList} transaction={transaction} setTransaction={setTransaction}/>
        </Form>
      );
    
      const childOutContent = (
        <Form fluid>
        <ProductListOut open={openChildModal} setOpen={setOpenChildModal} showSubChildModal={showSubChildModal} setShowSubChildModal={setShowSubChildModal} refetch={refetchTransProductList} transaction={transaction} setTransaction={setTransaction}/>
        </Form>
      );

      const subChildContentIn =  () => {
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
         const subChildContentOut =  () => {
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
                    inventoryTransactionKey: transaction.key,
                }).unwrap().then((result) => {
                    console.log(result)
                    setTransProduct(result);
                    refetch();
                    refetchTransProductList();
                    setTransProduct({ ...newApInventoryTransactionProduct, productKey: null});
                    dispatch(
                        notify({
                            msg: 'The Inventory Transaction Product Added/Edited successfully ',
                            sev: 'success'
                        })
                    );
                }).catch((e) => {
        
                    if (e.status === 422) {
                        console.log("Validation error: Unprocessable Entity", e);
        
                    } else {
                        console.log("An unexpected error occurred", e);
                        dispatch(notify({ msg: 'An unexpected error occurred', sev: 'warn' }));
                    }
                });;
        
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
                  }).catch(() => {
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
                  }).catch(() => {
                      dispatch(
                      notify({
                        msg: 'Fail',
                        sev: 'error'
                      })
                    );
                  });
              };

    return (

        <ChildModal
            open={open}
            setOpen={setOpen}
            showChild={openChildModal}
            setShowChild={setOpenChildModal}
            showSubChild={showSubChildModal}
            setShowSubChild={setShowSubChildModal}
            title={transaction?.key ? 'Edit Transaction' : 'New Transaction'}
            mainStep={[
                { title: 'Transaction Info', icon: <FontAwesomeIcon icon={faInbox} />, disabledNext: !transaction?.key && !openNextDocument, footer: <MyButton onClick={handleSave}>Save</MyButton> },
                { title: 'Attachments', icon: <FontAwesomeIcon icon={faPaperclip} />, footer: <MyButton onClick={handleSave} >Save</MyButton> },
            ]}

            mainContent={conjureFormContent}
            childTitle="Product transaction"
            childContent={transaction.transTypeLkey === '6509244814441399' ?  childInContent : childOutContent }
            subChildTitle="Add Product Details"
            subChildContent={transaction.transTypeLkey === '6509244814441399' ? subChildContentIn : subChildContentOut}
            actionSubChildButtonFunction={handleSavesubchild}
            childStep={[{ title: "Product transaction", icon: <FontAwesomeIcon icon={faList} /> }]}
            subChildStep={[{ title: "Add Product Details", icon: <FontAwesomeIcon icon={faListCheck} /> }]}
            mainSize="xs"
            childSize="sm"
            subChildSize="xs"
            actionChildButtonLabel="Confirm"
             actionChildButtonFunction={transaction.transTypeLkey === '6509244814441399' ?  handleSavechildIn : handleSavechildOut}
        />
    );
};
export default AddEditTransaction;
