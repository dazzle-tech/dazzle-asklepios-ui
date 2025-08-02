import Translate from '@/components/Translate';
import { initialListRequest, ListRequest } from '@/types/types';
import React, { useState, useEffect } from 'react';
import { Checkbox, Col, Form, Panel, Row } from 'rsuite';
import { FaUndo } from 'react-icons/fa';
import { MdModeEdit } from 'react-icons/md';
import { MdDelete } from 'react-icons/md';
import { useAppDispatch } from '@/hooks';
import { FaSyringe } from 'react-icons/fa';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { notify } from '@/utils/uiReducerActions';
import { ApInventoryTransactionProduct, ApInventoryTransferProduct } from '@/types/model-types';
import { newApInventoryTransactionProduct, newApInventoryTransferProduct } from '@/types/model-types-constructor';
import './styles.less';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList, fromCamelCaseToDBName } from '@/utils';
import {
  useGetProductQuery,
  useGetLovValuesByCodeAndParentQuery,
  useGetUomGroupsUnitsQuery,
  useGetWarehouseQuery,
} from '@/services/setupService';
import ReactDOMServer from 'react-dom/server';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import MyTable from '@/components/MyTable';
import DeletionConfirmationModal from '@/components/DeletionConfirmationModal';
import MyButton from '@/components/MyButton/MyButton';
import { useGetInventoryTransferProductQuery, useRemoveInventoryTransferProductMutation, useSaveInventoryTransactionProductMutation } from '@/services/inventoryTransactionService';
import { GrProductHunt } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faDownload, faX } from '@fortawesome/free-solid-svg-icons';
import MyInput from '@/components/MyInput';
import AdvancedModal from '@/components/AdvancedModal';
import ProductDetails from './ProductDetails';
import WarehouseDistribution from './WarehouseDistribution';
import TransactionLog from './TransactionLog';
import TransferLog from './TransferLog';
import DispensingLog from './DispensingLog';
import AMP from './AMP';
const ModalProductCard = ({
  open,
  setOpen,
  product,
  setProduct,
}) => {
  const dispatch = useAppDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [transferProduct, setTransferProduct] = useState<ApInventoryTransferProduct>({ ...newApInventoryTransferProduct });
  const [openConfirmDeleteTransferProductModal, setOpenConfirmDeleteTransferProductModal] =
    useState<boolean>(false);
  const [saveTransferProduct, saveTransferProductMutation] = useSaveInventoryTransactionProductMutation();
  const [removeTransferProduct, removeTransferProductMutation] = useRemoveInventoryTransferProductMutation();
  const [stateOfDeleteTransferProductModal, setStateOfDeleteTransferProductModal] = useState<string>('delete');
  const [openAddEditPopup, setOpenAddEditPopup] = useState(false);
  const [edit_new, setEdit_new] = useState(false);
  const [openAmp, setOpenAmp] = useState(false);
  
  const [recordOfFilter, setRecordOfFilter] = useState({ filter: '', value: '' });
  const [listRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest
  });

  const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeAndParentQuery('PRODUCTS_TYPES');
  const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });
  const { data: warehouseListResponse } = useGetWarehouseQuery(listRequest);
  const {
    data: uomGroupsUnitsListResponse,
    refetch: refetchUomGroupsUnit,
  } = useGetUomGroupsUnitsQuery(uomListRequest);


  const [productsListRequest, setProductsListRequest] = useState<ListRequest>({
    ...initialListRequest,
    filters: [
      {
        fieldName: 'deleted_at',
        operator: 'isNull',
        value: undefined,
      }
    ],
  });
  const {
    data: productListResponseLoading,
    refetch: refetchProduct,
    isFetching: productListIsFetching
  } = useGetProductQuery(productsListRequest);

  // Pagination values
  // const pageIndex = transferProductListRequest.pageNumber - 1;
  // const rowsPerPage = transferProductListRequest.pageSize;
  // const totalCount = transferProductListResponseLoading?.extraNumeric ?? 0;

  dispatch(setPageCode('ProductList'));

  useEffect(() => {
    return () => {
      dispatch(setPageCode(''));
      dispatch(setDivContent('  '));
    };
  }, [location.pathname, dispatch]);


  // handle click om edit  
  const handleEdit = () => {
    setEdit_new(true);
    setOpenAddEditPopup(true);
  };
 
  
  const handleSave = async () => {

  }
  const conjureFormContentOfRightModal = () => {
    return (
      <Panel>
        <Row>
          <Col md={24}>
            <span className="sub-title">Warehouse Distribution</span>
            <WarehouseDistribution selectedProduct={product} />
          </Col>
        </Row>
         <Row>
          <Col md={24}>
            <span className="sub-title">Transaction Logs</span>
            <TransactionLog selectedProduct={product} />
          </Col>
        </Row>
         <Row>
          <Col md={24}>
              <span className="sub-title">Transfer Logs</span>
            <TransferLog selectedProduct={product} />
          </Col>
        </Row>
         <Row>
          <Col md={24}>
            <span className="sub-title">Dispensing Logs</span>
            <DispensingLog selectedProduct={product} />
          </Col>
        </Row>
        



      </Panel>
    );

  }


  return (<>
    <AdvancedModal
      open={open}
      setOpen={setOpen}
      size="80vw"
      leftWidth="20%"
      rightWidth="80%"
      leftTitle={"Product Details"}
      rightTitle="Product Card Details"
      leftContent={<>
         <ProductDetails selectedProduct={product} /> 
      </>}
      actionButtonLabel="AMP"
      actionButtonFunction={() =>
         {
        setOpenAmp(true)
      }}
      rightContent={conjureFormContentOfRightModal()}
    ></AdvancedModal>
   <AMP open={openAmp} setOpen={setOpenAmp} selectedProduct={product} />
  </>);
};

export default ModalProductCard;