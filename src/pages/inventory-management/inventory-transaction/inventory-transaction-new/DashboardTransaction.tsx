import React, { useState, useEffect, ChangeEvent } from "react";
import {
  Container,
  Content,
  Sidebar,
  Panel,
  Button,
  Form,
  SelectPicker,
  Modal,
  Table,
  Input,
  InputGroup,
  toaster,
  Message,
  Uploader,
  Stack,
  FlexboxGrid,
  Divider,
  Row,
  Col,
  ButtonToolbar,
  Loader,
} from "rsuite";
import DynamicPieChart from "@/components/Charts/DynamicPieChart/DynamicPieChart";
import { useGetLovValuesByCodeQuery, useGetUomGroupsUnitsQuery, useGetWarehouseQuery } from "@/services/setupService";
import MyInput from "@/components/MyInput";
import { ApInventoryTransaction, ApInventoryTransactionProduct, ApProducts, ApWarehouse } from "@/types/model-types";
import { newApInventoryTransaction, newApInventoryTransactionProduct, newApProducts, newApWarehouse } from "@/types/model-types-constructor";
import MyButton from "@/components/MyButton/MyButton";
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { initialListRequest, ListRequest } from "@/types/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalculator, faCreditCard, faEye, faPlus, faPlusCircle, faPrint, faQuestion } from "@fortawesome/free-solid-svg-icons";
import AdvancedModal from "@/components/AdvancedModal";
import SectionContainer from "@/components/SectionsoContainer";
import { BiPlusCircle } from "react-icons/bi";
import { Plus } from "@rsuite/icons";
import DynamicLineChart from "@/components/Charts/DynamicLineChart/DynamicLineChart";
import authSlice from "@/reducers/authSlice";
import { useLazyGetQtyInBaseUomQuery, useSaveInventoryTransactionMutation } from "@/services/inventoryTransactionService";
import { useAppDispatch, useAppSelector } from "@/hooks";
import { notify } from '@/utils/uiReducerActions';
import MyTable from "@/components/MyTable";
import { ColumnConfig } from "@/components/MyTable/MyTable";
import AddEditProduct from "@/pages/setup/product-setup/AddEditProduct";
import Translate from "@/components/Translate";
import MyBadgeStatus from "@/components/MyBadgeStatus/MyBadgeStatus";
import Questions from "@/pages/questionnaire-setup/Questions";
import QuestionsInventory from "./Questions";
import AddEditWarehouse from "@/pages/setup/warehouse-setup/AddEditWarehouse";
import { FaChartPie, FaPaperclip, FaUser, FaWarehouse } from "react-icons/fa6";
import { FaCalendarAlt, FaInfoCircle } from "react-icons/fa";
import { setDivContent, setPageCode } from "@/reducers/divSlice";
import ReactDOMServer from 'react-dom/server';
import ProductCatalog from "../product-catalog";
import MyModal from "@/components/MyModal/MyModal";
import { GrCreditCard } from "react-icons/gr";

// Sample options:
const transactionTypes = [
  { label: "Stock In", value: "in" },
  { label: "Stock Out", value: "out" },
];

const initialWarehouses = [
  { label: "Main Warehouse", value: "wh1", info: "Address: 123 Main St, Contact: 555-1234" },
  { label: "Secondary Warehouse", value: "wh2", info: "Address: 456 Second St, Contact: 555-5678" },
];

const initialProducts = [
  { label: "Panadol", value: "prodA", details: "Details about Product A" },
  { label: "Table", value: "prodB", details: "Details about Product B" },
  { label: "ZOCOR", value: "prodC", details: "Details about Product C" },
  { label: "Syringe", value: "prodD", details: "Details about Product D" },
];

function DashboardTransaction() {
  // Main form state
  const [transactionType, setTransactionType] = useState<string | null>(null);
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




  const { data: transTypeListResponse } = useGetLovValuesByCodeQuery('STOCK_TRANSACTION_TYPES');
  const { data: transReasonInListResponse } = useGetLovValuesByCodeQuery('STOCK_IN_REASONS');
  const { data: transReasonOutListResponse } = useGetLovValuesByCodeQuery('STOCK_OUT_REASONS');
  const [transProduct, setTransProduct] = useState<ApInventoryTransactionProduct>({ ...newApInventoryTransactionProduct });
  const [openNext, setOpenNext] = useState(false);
  const [openQ, setOpenQ] = useState(false);
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [openCard, setOpenCard] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [warehouse, setWarehouse] = useState<ApWarehouse>({ ...newApWarehouse });
  const { data: warehouseListResponse, refetch } = useGetWarehouseQuery(warehouseListRequest);
  const dispatch = useAppDispatch();
  const authSlice = useAppSelector(state => state.auth);
  const [saveTransaction, saveTransactionMutation] = useSaveInventoryTransactionMutation();
  const [transaction, setTransaction] = useState<ApInventoryTransaction>({ ...newApInventoryTransaction });
  const [warehouses, setWarehouses] = useState(initialWarehouses);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);
  const [warehouseInfo, setWarehouseInfo] = useState("");
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [transactionReason, setTransactionReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ApProducts>({ ...newApProducts });
  const [triggerGetQty, { data: qtyInBaseUomResponse, isLoading }] = useLazyGetQtyInBaseUomQuery();
  const [unitListRequest, setUnitListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined
      },
      {
        fieldName: 'uom_group_key',
        operator: 'match',
        value: selectedProduct?.uomGroupKey
      }

    ],

  });

  const {
    data: UnitsListResponse,
    refetch: refetchUnit,
  } = useGetUomGroupsUnitsQuery(unitListRequest);
  const [generateCode, setGenerateCode] = useState();
  const [recordOfWarehouseCode, setRecordOfWarehouseCode] = useState({ transId: '' });
  // Generate code for transaction
  const generateFiveDigitCode = () => {
    const code = Math.floor(10000 + Math.random() * 90000);
    setTransaction({ ...transaction, transId: code + "" })
  };

  useEffect(() => {
    if (transaction?.transId) {
      setRecordOfWarehouseCode({ transId: transaction.transId });
      return;
    }
    generateFiveDigitCode();
    setRecordOfWarehouseCode({ transId: transaction?.transId ?? generateCode });
    console.log(recordOfWarehouseCode);
  }, [transaction?.transId?.length]);

  // Products
  const [products, setProducts] = useState<
    {
      key: number;
      product: typeof initialProducts[0] | null;
      lotNumber: string;
      serialNumber: string;
      quantity: number;
      unit: string;
      unitCost?: number;
      expiryDate?: string;
      totalCost?: number;
    }[]
  >([]);


  const [product, setProduct] = useState<ApProducts>({ ...newApProducts });
  const [productOpen, setProductOpen] = useState(false);
  // Product modal
  const [showProductModal, setShowProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState("");

  // Attachments
  const [attachments, setAttachments] = useState<File[]>([]);

  // Chart data
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);

  // Update warehouse info when warehouse changes
  useEffect(() => {
    const wh = warehouses.find((w) => w.value === selectedWarehouse);
    setWarehouseInfo(wh ? wh.info : "");
  }, [selectedWarehouse, warehouses]);

  // Save transaction handler
  const handleSaveTransaction = () => {
    if (!transaction.transTypeLkey || !transaction.warehouseKey || !transaction.transReasonLkey.trim()) {
      toaster.push(
        <Message showIcon type="error" duration={5000}>
          Please fill Transaction Type, Warehouse and Transaction Reason.
        </Message>,
        { placement: "topCenter" }
      );
      return;
    }
    setSaved(true);
  };

  // Add new warehouse handler
  const handleAddWarehouse = () => {
    if (!warehouseInfo.trim()) {
      toaster.push(
        <Message showIcon type="error" duration={5000}>
          Please enter warehouse info.
        </Message>,
        { placement: "topCenter" }
      );
      return;
    }
    const newWh = {
      label: warehouseInfo,
      value: `wh_${Date.now()}`,
      info: warehouseInfo,
    };
    setWarehouses([...warehouses, newWh]);
    setSelectedWarehouse(newWh.value);
    setWarehouseInfo("");
    setShowWarehouseModal(false);
  };

  // Add new product row
  const handleAddProductRow = () => {
    setProducts((prev) => [
      ...prev,
      {
        key: Date.now(),
        product: null,
        lotNumber: "",
        serialNumber: "",
        quantity: 0,
        unit: "",
        unitCost: 0,
        expiryDate: "",
        totalCost: 0,
      },
    ]);
  };

  // Update product field
  const handleProductChange = (key: number, field: string, value: any) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.key === key) {
          const updated = { ...p, [field]: value };

          // Calculate totalCost if relevant fields change
          if (transaction.transTypeLkey === "6509244814441399") { //Stock in
            if (field === "unitCost" || field === "quantity") {
              updated.totalCost = (updated.unitCost || 0) * (updated.quantity || 0);
            }
          }

          return updated;
        }
        return p;
      })
    );
  };

  // Update product select
  const handleSelectProduct = (key: number, value: string) => {
    const prod = initialProducts.find((p) => p.value === value) || null;
    handleProductChange(key, "product", prod);
  };

  const handleSave = () => {
    if (!transaction.transTypeLkey || !transaction.warehouseKey || !transaction.transReasonLkey.trim()) {
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
    }).unwrap().then((result) => {
      setTransaction(result);
      console.log(result);
      setOpenNext(true);
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
  const actionsForItems = rowData => {
    const handleViewTransactions = () => {
      console.log('View transactions for:', rowData.name);
      // TODO: Implement view transactions logic
    };

    const handleAdjustQuantity = () => {
      console.log('Adjust quantity for:', rowData.name);
      // TODO: Implement adjust quantity logic
    };

    const handleProductCard = () => {
      console.log('Product card for:', rowData.name);
      return(
           <MyModal
              open={openCard}
              setOpen={setOpenCard}
              title={'Product card for:'+ rowData.name}
              position="right"
              content={<ProductCatalog />}
              actionButtonLabel={'Cancel'}
              actionButtonFunction={() => {setOpenCard(false)}}
              steps={[{ title: 'Product card for:'+ rowData.name , icon: <GrCreditCard /> }]}
            />
       
      );
      
    };

        const handleConvertQuantity = async () => {
        if (!selectedProduct || !transProduct) return;

        const result = await triggerGetQty({
            quantity: transProduct.newQuentity,
            transUnit: transProduct.transUomKey,
            toBaseUnit: selectedProduct.baseUomKey,
            uomGroup: selectedProduct.uomGroupKey,
        });

        if (result?.data?.object !== undefined) {
            setTransProduct(prev => ({
                ...prev,
                quentityRequestedBaseUom: result.data.object
            }));
        }
    };

    return (
      <div className="container-of-actions">
        <FontAwesomeIcon
          icon={faEye}
          title="View Transactions"
          className="action-icon"
          onClick={handleViewTransactions}
        />
        <FontAwesomeIcon
          icon={faCalculator}
          title="Adjust Quantity"
          className="action-icon"
          onClick={handleAdjustQuantity}
        />
        <FontAwesomeIcon
          icon={faCreditCard}
          title="Product Card"
          className="action-icon"
          onClick={() => {
            setOpenCard(true);
            handleProductCard();
          }
          }
        />
      </div>
    );
  };
  // Add new product from modal
  const handleAddNewProduct = () => {
    if (!newProductName.trim()) {
      toaster.push(
        <Message showIcon type="error" duration={5000}>
          Please enter product name.
        </Message>,
        { placement: "topCenter" }
      );
      return;
    }
    const newProd = {
      label: newProductName,
      value: `prod_${Date.now()}`,
      details: `Details about ${newProductName}`,
    };
    initialProducts.push(newProd); // This mutates original, consider better state management
    setNewProductName("");
    setShowProductModal(false);
  };

  // Update pie chart data when products change
  useEffect(() => {
    const grouped = products.reduce<{ [key: string]: number }>((acc, p) => {
      if (p.product) {
        acc[p.product.label] = (acc[p.product.label] || 0) + (p.quantity || 0);
      }
      return acc;
    }, {});

    const chartPoints = Object.entries(grouped).map(([label, value]) => ({ label, value }));
    setChartData(chartPoints);
  }, [products]);

  // Handle attachments upload
  const handleUploadChange = (fileList: File[]) => {
    setAttachments(fileList);
  };

  const columns: ColumnConfig[] = [
    {
      key: 'product',
      title: 'Product',
      width: 180,
      render: (rowData) => (
        <SelectPicker
          data={initialProducts}
          value={rowData.product?.value}
          onChange={(val) => handleSelectProduct(rowData.key, val)}
          cleanable={false}
          searchable={false}
          disabled={!openNext}
          style={{ width: 160 }}
        />
      ),
    },
    {
      key: 'lotNumber',
      title: 'Lot/Serial Number',
      width: 130,
      render: (rowData) => (
        <Input
          value={rowData.lotNumber}
          onChange={(val: string) => handleProductChange(rowData.key, 'lotNumber', val)}
          disabled={!openNext}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      key: 'serialNumber',
      title: 'Transaction UOM',
      width: 130,
      render: (rowData) => (
        <Input
          value={rowData.serialNumber}
          onChange={(val: string) => handleProductChange(rowData.key, 'serialNumber', val)}
          disabled={!openNext}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      key: 'quantity',
      title: 'Quantity',
      width: 100,
      render: (rowData) => (
        <Input
          type="number"
          value={rowData.quantity}
          onChange={(val: string) => handleProductChange(rowData.key, 'quantity', Number(val))}
          disabled={!openNext}
          style={{ width: '100%' }}
          min={0}
        />
      ),
    },
    {
      key: 'unit',
      title: 'Unit',
      width: 120,
      render: (rowData) => (
        <Input
          value={rowData.unit}
          onChange={(val: string) => handleProductChange(rowData.key, 'unit', val)}
          disabled={!openNext}
          style={{ width: '100%' }}
        />
      ),
    },

  ];

  // Conditionally add stock-in columns
  if (transaction.transTypeLkey === '6509244814441399') {
    columns.push(
      {
        key: 'unitCost',
        title: 'Unit Cost',
        width: 120,
        render: (rowData) => (
          <Input
            type="number"
            value={rowData.unitCost}
            onChange={(val: string) => handleProductChange(rowData.key, 'unitCost', Number(val))}
            disabled={!openNext}
            style={{ width: '100%' }}
            min={0}
          />
        ),
      },
      {
        key: 'expiryDate',
        title: 'Expiry Date',
        width: 140,
        render: (rowData) => (
          <Input
            type="date"
            value={rowData.expiryDate}
            onChange={(val: string) => handleProductChange(rowData.key, 'expiryDate', val)}
            disabled={!openNext}
            style={{ width: '100%' }}
          />
        ),
      },
      {
        key: 'totalCost',
        title: 'Total Cost',
        width: 120,
        render: (rowData) => <span>{rowData.totalCost?.toFixed(2) || '0.00'}</span>,
      },
      {
        key: 'status',
        title: <Translate>Status</Translate>,
        width: 100,
        render: rowData => {
          const status = rowData.status || 'Normal';

          const getStatusConfig = status => {
            switch ('New') {
              case 'New':
                return {
                  backgroundColor: 'var(--light-green)',
                  color: 'var(--primary-green)',
                  contant: 'New'
                };
              // case 'Low Stock':
              //   return {
              //     backgroundColor: 'var(--light-orange)',
              //     color: 'var(--primary-orange)',
              //     contant: 'Low Stock'
              //   };
              // case 'Out of Stock':
              //   return {
              //     backgroundColor: 'var(--light-red)',
              //     color: 'var(--primary-red)',
              //     contant: 'Out of Stock'
              //   };
              // case 'Reserved':
              //   return {
              //     backgroundColor: 'var(--light-purple)',
              //     color: 'var(--primary-purple)',
              //     contant: 'Reserved'
              //   };
              default:
                return {
                  backgroundColor: 'var(--background-gray)',
                  color: 'var(--primary-gray)',
                  contant: 'Unknown'
                };
            }
          };

          const config = getStatusConfig(status);
          return (
            <MyBadgeStatus
              backgroundColor={config.backgroundColor}
              color={config.color}
              contant={config.contant}
            />
          );
        }
      },
      {
        key: 'actions',
        title: <Translate>Actions</Translate>,
        width: 120,
        render: rowData => actionsForItems(rowData)
      }
    );

  }

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Header page setUp
    const divContent = (
       "Inventory Transaction"
    );
    dispatch(setPageCode('DepartmentStock'));
    dispatch(setDivContent(divContent));

    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent(''));
    };
  }, [dispatch]);

  const questions = [
    { text: '📦 How many products are in this warehouse? ', api: '/api/warehouse/count', answer: '3500 Products' },
    { text: '🚚 When was the last move to the warehouse?', api: '/api/warehouse/last-move', answer: 'Stock In : 2025-06-11 // Stock Out 2025-07-04'  },
    { text: '📊 What is the total cost of the warehouse?', api: '/api/warehouse/total-cost', answer: '100,000,000 ILS'  },
    { text: '🚛 Warehouse Details', api: '/api/warehouse/last-move' ,answer: 'Warehouse code: 30293 , Warehouse Location : Pharmacy' },
  ];

  const handleQuestion = async (q) => {
    setMessages((prev) => [...prev, { type: 'question', text: q.text }]);

    setLoading(true);

    try {

      const res = await fetch(q.api);
      const data = await res.json();


      setMessages((prev) => [
        ...prev,
        { type: 'question', text: q.text },
        // { type: 'answer', text: data.answer || 'There is no data' }
         { type: 'answer', text: q.answer || 'There is no data' }
      ]);
    } catch (err) {
      // setMessages((prev) => [
      //   ...prev,
      //   { type: 'answer', text: 'Error in get answer' }
      // ]);
       setMessages((prev) => [
        ...prev,
        // { type: 'answer', text: data.answer || 'There is no data' }
         { type: 'answer', text: q.answer || 'There is no data' }
      ]);
    }

    setLoading(false);
  };



  return (
    <Container style={{ height: "100vh" }}>
      <Sidebar
        collapsible
        className="profile-sidebar"
        style={{
          width: 320,
          padding: '20px',
          background: '#fdfdfd',
          borderLeft: '1px solid #ddd',
          overflowY: 'auto',
          position: 'fixed',
          right: 0,
          fontFamily: 'Segoe UI, sans-serif'
        }}
      >
        {/* Transaction Details */}
        <Stack alignItems="center" spacing={8}>
          <FaInfoCircle color="#2264E5" />
          <h4 style={{ margin: 0, fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>
            Transaction Details
          </h4>
        </Stack>
        <Divider style={{ margin: '10px 0' }} />
        <p><b>Transaction ID:</b> {transaction.transId}</p>
        <p><b>Performed By:</b> <FaUser style={{ marginRight: 5, color: '#666' }} /> {authSlice.user.username}</p>
        <p><b>Date & Time:</b> <FaCalendarAlt style={{ marginRight: 5, color: '#666' }} /> {new Date().toLocaleString()}</p>

        {/* Attachments */}
        <Divider style={{ margin: '20px 0' }} />
        <Stack alignItems="center" spacing={8}>
          <FaPaperclip color="#FF6384" />
          <h5 style={{ margin: 0, fontWeight: '600', color: '#444' }}>Attachments</h5>
        </Stack>
        <Uploader
          action=""
          autoUpload={false}
          multiple
          fileListVisible
          onChange={handleUploadChange}
          listType="picture-text"
          style={{ marginTop: 10 }}
        />
        <Stack style={{ marginTop: 10 }}>
          {attachments.map((file, idx) => (
            <div key={idx} style={{ fontSize: '0.9rem', color: '#555' }}>
              {file.name}
            </div>
          ))}
        </Stack>

        {/* Warehouse Details Section - Conditional */}
        {transaction?.warehouseKey !== null && (
          <>
            <Divider style={{ margin: "20px 0" }} />
            <Stack alignItems="center" spacing={8}>
              <FaWarehouse color="#c7be0eff" />
              <h4
                style={{
                  margin: 0,
                  fontWeight: "600",
                  fontSize: "1.1rem",
                  color: "#333",
                }}
              >
                Warehouse Details
              </h4>
            </Stack>
            <Divider style={{ margin: "10px 0" }} />
            <p>
              <b>Warehouse Key:</b> {transaction.warehouseKey}
            </p>
            <p>
              <b>Warehouse Name:</b> {"N/A"}
            </p>
          </>
        )}
        {/* Chart */}
        <Divider style={{ margin: '20px 0' }} />
        <Stack alignItems="center" spacing={8}>
          <FaChartPie color="#4BC0C0" />
          <h5 style={{ margin: 0, fontWeight: '600', color: '#444' }}>Product Quantity Distribution</h5>
        </Stack>
        <div style={{ marginTop: 10 }}>
          <DynamicPieChart
            title=""
            chartData={chartData}
            colors={["#2264E5", "#93C6FA", "#FF6384", "#FFCE56", "#4BC0C0"]}
            selectable
          />
        </div>
      </Sidebar>

      {/* Main Content */}
      <Content
        style={{
          // marginLeft: 320,
          marginRight: 320,
          padding: 20,
          overflowY: "auto",
          background: "#f9f9f9",
          height: "100vh",
        }}
      >
        <Row >
          <Col md={12}>
            {/* Section 1: Transaction info */}
            <Panel
              header="Transaction Information"
              bordered
              style={{ marginBottom: 20, backgroundColor: "white", padding: 20, borderRadius: 6, height: 350, overflowY: "auto" }}
            >

              <div className="table-buttons-right">
                <MyButton
                  appearance="subtle"
                  title="Ask a Question"
                  onClick={() => setOpenQ(true)}>
                  <FontAwesomeIcon icon={faQuestion} />
                </MyButton>
                <MyButton
                  appearance="subtle"
                  title="Add New Warehouse"
                  onClick={() => setOpenAddEditPopup(true)}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </MyButton>
                <QuestionsInventory open={openQ} setOpen={setOpenQ} />
                <AddEditWarehouse
                  open={openAddEditPopup}
                  setOpen={setOpenAddEditPopup}
                  warehouse={warehouse}
                  setWarehouse={setWarehouse}
                  edit_new={edit_new}
                  setEdit_new={setEdit_new}
                  refetch={refetch}
                />
              </div>
              <Form fluid>

                <div className='container-of-three-fields' >
                  <div className='container-of-field' >
                    <MyInput
                      width="100%"
                      disabled={openNext}
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
                      disabled={openNext}
                      fieldLabel="Warehouse"
                      fieldName="warehouseKey"
                      fieldType="select"
                      selectData={warehouseListResponse?.object ?? []}
                      selectDataLabel="warehouseName"
                      selectDataValue="key"
                      rightAddon={<Plus />}
                      record={transaction}
                      setRecord={setTransaction}

                    />
                  </div>
                </div>
                <div className='container-of-three-fields' >

                  <div className='container-of-field' >
                    <MyInput
                      width="100%"
                      disabled={openNext}
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
                  <div className='container-of-field' >
                    <MyInput
                      width="100%"
                      disabled={openNext}
                      fieldLabel="Reference Doc Num."
                      fieldName="docNum"
                      record={transaction}
                      setRecord={setTransaction}
                    />
                  </div>
                </div>
                <div className='container-of-three-fields' >

                  <div className='container-of-field' >
                    <MyInput
                      width="100%"
                      disabled={openNext}
                      fieldLabel="Remarks"
                      fieldName="remarks"
                      fieldType="textarea"
                      hight="50%"
                      record={transaction}
                      setRecord={setTransaction}
                    />
                  </div>

                  <div className="table-buttons-right">
                    <MyButton appearance="primary" onClick={handleSave} disabled={openNext}>
                      Save Transaction
                    </MyButton>


                  </div>
                </div>
              </Form>
            </Panel>
          </Col>

          <Col md={6}>
            <Panel
              header="Warehouse Activity Trend"
              bordered
              style={{ marginBottom: 20, backgroundColor: "white", padding: 20, borderRadius: 6, height: 350, overflowY: "auto" }}
            >

              <DynamicLineChart
                maxValue={10}
                title={'Warehouse Transaction'}
                chartData={[
                  { x: '2025-06-19', y: 7 },
                  { x: '2025-06-20', y: 2 },
                  { x: '2025-07-21', y: 1 },
                  { x: '2025-07-22', y: 0 },
                  { x: '2025-07-23', y: 3 }
                ]}
              />
            </Panel>
          </Col>
          <Col md={6}>
            <Panel
              header="Ask Question"
              bordered
              style={{ marginBottom: 20, backgroundColor: "white", padding: 20, borderRadius: 6, height: 350, overflowY: "auto" }}
            >
              <div
                style={{
                  height: 100,
                  overflowY: 'auto',
                  border: '1px solid #eee',
                  padding: 10,
                  borderRadius: 6,
                  marginBottom: 10
                }}
              >
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: msg.type === 'question' ? 'right' : 'left',
                      margin: '5px 0'
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '8px 12px',
                        borderRadius: 12,
                        background: msg.type === 'question' ? '#007bff' : '#f0f0f0',
                        color: msg.type === 'question' ? '#fff' : '#000'
                      }}
                    >
                      {msg.text}
                    </span>
                  </div>
                ))}
                {loading && <Loader center content="..." />}
              </div>

              <ButtonToolbar>
                {questions.map((q, i) => (
                  <Button
                    key={i}
                    appearance="ghost"
                    size="sm"
                    onClick={() => handleQuestion(q)}
                  >
                    {q.text}
                  </Button>
                ))}
              </ButtonToolbar>


            </Panel>
          </Col>

        </Row>


        {/* Section 2: Products Table */}
        <Panel
          header="Products"
          bordered
          style={{ backgroundColor: "white", padding: 20, borderRadius: 6 }}
        >
          <div className="table-buttons-right">
           <MyButton
              appearance="subtle"
              title="Summary Report"
              disabled={!openNext}
              onClick={() => setOpenQ(true)}>
              <FontAwesomeIcon icon={faPrint} />
            </MyButton>
            <MyButton
              appearance="subtle"
              title="Add a new Product"
              disabled={!openNext}
              onClick={() => setProductOpen(true)}>
              <FontAwesomeIcon icon={faPlus} />
            </MyButton>
            <MyButton appearance="primary" onClick={handleAddProductRow} disabled={!openNext}>
              Add Product
            </MyButton>
            <MyButton appearance="ghost" onClick={handleAddProductRow} disabled={!openNext}>
              Confirm
            </MyButton>
            <AddEditProduct open={productOpen} setOpen={setProductOpen} product={product} setProduct={setProduct} refetch={refetch} />
          </div>
      <div className="table-buttons-left">
             <MyBadgeStatus
              backgroundColor={'var(--background-gray)'}
              color={'var(--primary-gray)'}
              contant={'Total Product Type : 3'}
            />
           
          </div>
 
          <br />
          <div>
            <MyTable
              data={products}
              columns={columns}
              height={300}
            />

          </div>

          <Button
            appearance="default"
            style={{ marginTop: 15 }}
            onClick={() => setShowProductModal(true)}
            disabled={!saved}
          >
            Add New Product Type
          </Button>
        </Panel>
      </Content>

    </Container>
  )



}


export default DashboardTransaction;
