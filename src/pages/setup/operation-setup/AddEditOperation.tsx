import ChildModal from "@/components/ChildModal";
import MyButton from "@/components/MyButton/MyButton";
import { useGetOperationCodingListQuery, useGetOperationPriceListListQuery, useRemoveOperationCodingMutation, useRemoveOperationPriceListMutation, useSaveOperationCodingMutation, useSaveOperationMutation, useSaveOperationPriceListMutation } from "@/services/operationService";
import React, { useEffect, useState } from "react";
import { FaMoneyBillAlt } from "react-icons/fa";
import { FaQrcode } from "react-icons/fa6";
import { FaProcedures } from 'react-icons/fa';
import MyInput from "@/components/MyInput";
import { Dropdown, Form } from "rsuite";
import { useGetIcdListQuery, useGetLovValuesByCodeQuery } from "@/services/setupService";
import { ApOperationCoding, ApOperationPriceList } from "@/types/model-types";
import { newApOperationCoding, newApOperationPriceList, newApOperationSetup } from "@/types/model-types-constructor";
import { notify } from "@/utils/uiReducerActions";
import { useAppDispatch } from "@/hooks";
import { initialListRequest, ListRequest } from "@/types/types";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { MdDelete } from "react-icons/md";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import DeletionConfirmationModal from "@/components/DeletionConfirmationModal";
import SearchIcon from '@rsuite/icons/Search';
const AddEditOperation = ({ open, setOpen, operation, setOperation, refetch }) => {
    const dispatch = useAppDispatch();
    console.log("Operation", operation)
    //save mutation function
    const [saveOperation] = useSaveOperationMutation();
    const [saveOperationCoding] = useSaveOperationCodingMutation();
    const [saveOperationPrice] = useSaveOperationPriceListMutation();
   //delete mutation
   const[deleteOperationCoding]=useRemoveOperationCodingMutation();
   const [deleteOperationPrice]=useRemoveOperationPriceListMutation();
    const [indicationsIcd, setIndicationsIcd] = useState({ indications: null });
    const [recordOfSearch, setRecordOfSearch] = useState({ searchKeyword: '' });
    const [recordOfSearch2, setRecordOfSearch2] = useState({ searchKeyword: '' });
    const [recordOfIndicationsDescription, setRecordOfIndicationsDescription] = useState({
        indicationsDescription: ''
    });
    const [recordOfContraindicationsDescription, setRecordOfContraindicationsDescription] = useState({
        contraindicationsDescription: ''
    });
    const [indicationsDescription, setindicationsDescription] = useState<string>('');
    const [contraindicationsDescription, setContraindicationsDescription] = useState<string>('');

    // class name for selected code
    const isSelectedcode = rowData => {
        if (rowData && operationCode && rowData?.key === operationCode?.key) {
            return 'selected-row';
        } else return '';
    };
    // class name for selected price
    const isSelectedprice = rowData => {
        if (rowData && operationprice && rowData?.key === operationprice?.key) {
            return 'selected-row';
        } else return '';
    };

    const [icdListRequest, setIcdListRequest] = useState<ListRequest>({
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
    const [childStep, setChildStep] = useState<number>(-1);
    //modals 
    const [openChildModal, setOpenChildModal] = useState<boolean>(false);
    const [openConfirmDeleteModal, setOpenConfirmDeleteModal] = useState<boolean>(false);
    //objects
    const [operationCode, setOperationCode] = useState<ApOperationCoding>({
        ...newApOperationCoding,
        operationKey: operation?.key
    });
    const [operationprice, seteOperationprice] = useState<ApOperationPriceList>({
        ...newApOperationPriceList
    });
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
    } = useGetOperationCodingListQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'operation_key',
                operator: '',
                value: operation?.key
            }
        ],
        ignore: operation?.key == undefined
    });
    // Fetch procedure price list response
    const {
        data: procedurepriceQueryResponse,
        refetch: propfetch,
        isFetching: isFetchingPriceList
    } = useGetOperationPriceListListQuery({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'operation_key',
                operator: '',
                value: operation?.key
            }
        ],
        ignore: operation?.key == undefined
    });

    // handle save procedure
    const handleSave = async () => {
        try {
            const response = await saveOperation({
                ...operation,
                indications: indicationsDescription,
                contraindications: contraindicationsDescription,
                isValid: true
            }).unwrap();
            console.log("Response", response?.object)
            dispatch(notify({ msg: 'The Procedure has been saved successfully', sev: 'success' }));
            refetch();
            setOperation(response?.object);

        } catch (error) {
            dispatch(notify({ msg: 'Failed to save this Procedure', sev: 'error' }));
        }
    };

    // handle save procedure codeing
    const handleSaveCoding = () => {
        setOperationCode({
            ...newApOperationCoding,
            operationKey: operation?.key
        });
        saveOperationCoding({ ...operationCode, operationKey: operation?.key })
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
        saveOperationPrice({ ...operationprice, operationKey: operation?.key })
            .unwrap()
            .then(() => {
                seteOperationprice({
                    ...newApOperationPriceList
                });
                dispatch(notify({ msg: 'The Price List has been saved successfully', sev: 'success' }));
                propfetch();
            })
            .catch(() => {
                dispatch(notify({ msg: 'Failed to save this Price List', sev: 'error' }));
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

 // handle remove operation coding
  const handleRemoveOperationCoding = () => {
    setOpenConfirmDeleteModal(false);
    deleteOperationCoding({ ...operationCode })
      .unwrap()
      .then(() => {
        procfetch();
        dispatch(notify({ msg: 'The Code Deleted Successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to delete this code', sev: 'success' }));
      });
  };
  // handle remove operation price list
  const handleRemoveOperationPriceList = () => {
    setOpenConfirmDeleteModal(false);
    deleteOperationPrice({ ...operationprice })
      .unwrap()
      .then(() => {
        propfetch();
        dispatch(notify({ msg: 'The Price List Deleted Successfully', sev: 'success' }));
      })
      .catch(() => {
        dispatch(notify({ msg: 'Failed to delete this Price List', sev: 'success' }));
      });
  };



    const conjureFormContentOfMainModal = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <div className="container-of-two-fields-procedure">
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldLabel="Operation Name"
                                    fieldName={'name'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldLabel="Operation Code"
                                    fieldName={'code'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
                        </div>
                        <br />
                        <div className="container-of-two-fields-vaccine">
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldType="select"
                                    fieldLabel="Category Type"
                                    selectData={CategoryLovQueryResponse?.object ?? []}
                                    selectDataLabel="lovDisplayVale"
                                    selectDataValue="key"
                                    fieldName={'categoryLkey'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldLabel="Appointable"
                                    fieldType="checkbox"
                                    fieldName="isAppointable"
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
                        </div>
                        <br />
                        <MyInput
                            width="100%"
                            fieldLabel="Indications"
                            fieldName="searchKeyword"
                            record={recordOfSearch}
                            setRecord={setRecordOfSearch}
                            rightAddon={<SearchIcon />}
                        />
                        <div className="container-of-menu-diagnostic">
                            {recordOfSearch['searchKeyword'] && (
                                <Dropdown.Menu className="menu-diagnostic">
                                    {modifiedData?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setIndicationsIcd({
                                                    ...indicationsIcd,
                                                    indications: mod.key
                                                });
                                                setRecordOfSearch({ searchKeyword: '' });
                                            }}
                                        >
                                            <span>{mod.icdCode} </span>
                                            <span>{mod.description}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            )}
                        </div>
                        <MyInput
                            disabled={true}
                            fieldType="textarea"
                            record={recordOfIndicationsDescription}
                            setRecord={''}
                            showLabel={false}
                            fieldName="indicationsDescription"
                            width="100%"
                        />
                        <MyInput
                            width="100%"
                            fieldLabel="Contraindications"
                            fieldName="searchKeyword"
                            record={recordOfSearch2}
                            setRecord={setRecordOfSearch2}
                            rightAddon={<SearchIcon />}
                        />
                        <div className="container-of-menu-diagnostic">
                            {recordOfSearch2['searchKeyword'] && (
                                <Dropdown.Menu className="menu-diagnostic">
                                    {modifiedData?.map(mod => (
                                        <Dropdown.Item
                                            key={mod.key}
                                            eventKey={mod.key}
                                            onClick={() => {
                                                setOperation({
                                                    ...operation,
                                                    contraindications: mod.key
                                                });
                                                setRecordOfSearch2({ searchKeyword: "" });
                                            }}
                                        >
                                            <span>{mod.icdCode}</span>
                                            <span>{mod.description}</span>
                                        </Dropdown.Item>
                                    ))}
                                </Dropdown.Menu>
                            )}
                        </div>
                        <MyInput
                            disabled={true}
                            fieldType="textarea"
                            record={recordOfContraindicationsDescription}
                            setRecord={''}
                            showLabel={false}
                            fieldName="contraindicationsDescription"
                            width="100%"
                        />
                        <div className="container-of-two-fields-vaccine">
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldType="textarea"
                                    fieldName={'preparationInstructions'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
                            <div className='container-of-field-procedure'>
                                <MyInput
                                    width="100%"
                                    fieldType="textarea"
                                    fieldName={'recoveryNotes'}
                                    record={operation}
                                    setRecord={setOperation}
                                />
                            </div>
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
                                setOperationCode(rowData);
                            }}
                        />
                        <DeletionConfirmationModal
                            open={openConfirmDeleteModal}
                            setOpen={setOpenConfirmDeleteModal}
                            itemToDelete="Code"
                            actionButtonFunction={handleRemoveOperationCoding}
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
                                seteOperationprice(rowData);
                            }}
                        />
                        <DeletionConfirmationModal
                            open={openConfirmDeleteModal}
                            setOpen={setOpenConfirmDeleteModal}
                            itemToDelete="Price List"
                            actionButtonFunction={handleRemoveOperationPriceList}
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
                            record={operationCode}
                            setRecord={setOperationCode}
                        />
                        <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Code"
                            selectData={[]}
                            selectDataLabel="name"
                            selectDataValue="key"
                            fieldName={'internationalCodeKey'}
                            record={operationCode}
                            setRecord={setOperationCode}
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
                            record={operationprice}
                            setRecord={seteOperationprice}
                        />
                        <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel="Currency"
                            selectData={currencyLovQueryResponse?.object ?? []}
                            selectDataLabel="lovDisplayVale"
                            selectDataValue="key"
                            fieldName={'currencyLkey'}
                            record={operationprice}
                            setRecord={seteOperationprice}
                        />
                        <MyInput
                            width="100%"
                            fieldType="select"
                            fieldLabel=" Choose Price List"
                            selectData={[]}
                            selectDataLabel="name"
                            selectDataValue="key"
                            fieldName={'internationalCodeKey'}
                            record={operationprice}
                            setRecord={seteOperationprice}
                        />
                    </Form>
                );
        }
    };

 // Effects
  useEffect(() => {
      if (recordOfSearch['searchKeyword'].trim() !== '') {
        setIcdListRequest({
          ...initialListRequest,
          filterLogic: 'or',
          filters: [
            {
              fieldName: 'icd_code',
              operator: 'containsIgnoreCase',
              value: recordOfSearch['searchKeyword']
            },
            {
              fieldName: 'description',
              operator: 'containsIgnoreCase',
              value: recordOfSearch['searchKeyword']
            }
          ]
        });
      }
    }, [recordOfSearch['searchKeyword']]);

    useEffect(() => {
    if (recordOfSearch2['searchKeyword'].trim() !== '') {
      setIcdListRequest({
        ...initialListRequest,
        filterLogic: 'or',
        filters: [
          {
            fieldName: 'icd_code',
            operator: 'containsIgnoreCase',
            value: recordOfSearch2['searchKeyword']
          },
          {
            fieldName: 'description',
            operator: 'containsIgnoreCase',
            value: recordOfSearch2['searchKeyword']
          }
        ]
      });
    }
  }, [recordOfSearch2['searchKeyword']]);

  useEffect(() => {
    if (!open) {
      setOperation({ ...newApOperationSetup });
      setRecordOfIndicationsDescription({
        indicationsDescription: ''
      });
      setRecordOfContraindicationsDescription({
        contraindicationsDescription: ''
      });
      setIndicationsIcd({ indications: null });
      setindicationsDescription('');
      setContraindicationsDescription('');
    }
  }, [open]);

  useEffect(() => {
      if (indicationsIcd.indications != null) {
        setindicationsDescription(prevadminInstructions => {
          const currentIcd = icdListResponseLoading?.object?.find(
            item => item.key === indicationsIcd.indications
          );
          if (!currentIcd) return prevadminInstructions;
          const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
          return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
        });
      }
    }, [indicationsIcd.indications]);

  useEffect(() => {
    if (operation?.contraindications != null) {
      setContraindicationsDescription(prevadminInstructions => {
        const currentIcd = icdListResponseLoading?.object?.find(
          item => item?.key === operation?.contraindications
        );
        if (!currentIcd) return prevadminInstructions;
        const newEntry = `${currentIcd.icdCode}, ${currentIcd.description}.`;
        return prevadminInstructions ? `${prevadminInstructions}\n${newEntry}` : newEntry;
      });
    }
  }, [operation?.contraindications]);

  useEffect(() => {
    setindicationsDescription(operation?.key ? operation?.indications : '');
    setContraindicationsDescription(operation?.key ? operation?.contraindications : '');
  }, [operation?.key]);

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

    return (<>
        <ChildModal
            hideActionChildBtn
            actionButtonFunction={() => setOpen(false)}
            open={open}
            setOpen={setOpen}
            showChild={openChildModal}
            setShowChild={setOpenChildModal}
            title={operation?.key ? 'Edit operation' : 'New operation'}
            mainContent={conjureFormContentOfMainModal}
            mainStep={[
                {
                    title: 'Info',
                    icon: <FaProcedures />,
                    disabledNext: !operation?.key,
                    footer: <MyButton
                        onClick={handleSave}
                    >Save</MyButton>
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
        /></>)
}
export default AddEditOperation;