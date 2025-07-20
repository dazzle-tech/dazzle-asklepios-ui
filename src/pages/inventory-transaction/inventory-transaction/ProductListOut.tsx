import React, { useState } from "react";
import { useAppDispatch } from "@/hooks";
import { notify } from "@/utils/uiReducerActions";
import { initialListRequest, ListRequest } from "@/types/types";
import MyInput from "@/components/MyInput";
import MyButton from "@/components/MyButton/MyButton";
import MyTable from "@/components/MyTable";
import Translate from "@/components/Translate";
import { faPenToSquare } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Col, Divider, Form, Input, Row, SelectPicker, Text } from "rsuite";
import { useGetLovValuesByCodeQuery, useGetWarehouseProductsQuery } from "@/services/setupService";
import { useGetActiveIngredientQuery } from "@/services/medicationsSetupService";
import { newApInventoryTransactionProduct } from "@/types/model-types-constructor";
import { useGetInventoryTransactionsProductQuery, useSaveInventoryTransactionProductMutation } from "@/services/inventoryTransactionService";

const ProductListOut = ({
    open,
  setOpen,
  showSubChildModal,
  setShowSubChildModal,
  transaction,
  setTransaction,
  refetch
}) => {
    const dispatch = useAppDispatch();
    const [activeRowKey, setActiveRowKey] = useState(null);
    const [selectedWarehouseProductList, setSelectedWarehouseProductList] = useState<any>([]);
    const [saveTransactionProduct, saveTransactionProductMutation] = useSaveInventoryTransactionProductMutation();
    // const [medication, setMedication] = useState({
    //     ...newMedicationTemplate,
    //     [filterFieldName]: parentKey
    // });

    const [transProduct, setTransProduct] = useState({
        ...newApInventoryTransactionProduct,
        // [filterFieldName]: parentKey
    });

    const [wpListRequest, setWpListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'warehouse_key',
                operator: 'match',
                value: transaction?.warehouseKey
            },
        ],
    });
    const {
        data: warehouseProductListResponseLoading,
        refetch: refetchWarehouseProduct,
        isFetching
    } = useGetWarehouseProductsQuery(wpListRequest);

    const { data: unitLovQueryResponse } = useGetLovValuesByCodeQuery("UOM");
    const { data: activeIngredients } = useGetActiveIngredientQuery({ ...initialListRequest, pageSize: 1000 });
    const toSnakeCase = (str: string) =>
        str.replace(/([A-Z])/g, '_$1').toLowerCase();

    const [listRequest, setListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
             {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
            {
                fieldName: 'inventory_trans_key',
                operator: "match",
                value: transaction?.key
            }
        ]
    });

    const { data: transProductList, refetch : transProductRefetch } = useGetInventoryTransactionsProductQuery(listRequest);

    // const [saveMedication] = medicationService.useSaveMutation();

    const isSelected = (rowData) =>
        rowData?.key === transProduct?.key ? "selected-row" : "";

    const handleSave = async () => {
        try {
            const selectedKeys = selectedWarehouseProductList?.key;
            if (!Array.isArray(selectedKeys)) return;

            const promises = selectedKeys.map((key) => {
                return saveTransactionProduct({
                    ...newApInventoryTransactionProduct,
                    inventoryTransKey: transaction?.key,
                    productKey: key,
                    promises: key
                }).unwrap();
            });

            await Promise.all(promises);
            dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
            refetch();
            setSelectedWarehouseProductList([]);
        } catch (error) {
            console.error("Error saving products:", error);
            dispatch(notify({ msg: "Failed to save products", sev: "error" }));
        }
    };

    const columns = [
        {
            key: "name",
            title: <Translate>Product</Translate>,
            render: (rowData) => {
                const name = warehouseProductListResponseLoading?.object.find(item => item.key === rowData.activeIngredientKey)?.name
                return name;
            }
        },
        {
            key: "dose",
            title: <Translate>Quantity</Translate>,
            render: (rowData) =>
                // <MyInput width="100%" fieldLabel="Quantity" fieldType="number" fieldName="newQuentity" record={transProduct} setRecord={setTransProduct} />
                activeRowKey === rowData.key ? (
                    <Input
                        type="number"
                        style={{ width: 100 }}
                        onChange={(value) =>
                             setTransProduct({ ...transProduct, newQuentity: Number(value) })
                        }
                        onPressEnter={async () => {
                            try {
                                await saveTransactionProduct({ ...transProduct, inventoryTransKey: transaction?.key }).unwrap();
                                refetch();
                                dispatch(notify({ msg: "Saved Successfully", sev: "success" }));
                                setActiveRowKey(null);
                            } catch {
                                dispatch(notify({ msg: "Failed to save", sev: "error" }));
                            }
                        }}
                    />
                ) : (
                    <span>
                        <FontAwesomeIcon
                            icon={faPenToSquare}
                            onClick={() => setActiveRowKey(rowData.key)}
                            style={{ marginRight: "8px", cursor: "pointer" }}
                        />
                        {rowData?.dose}
                    </span>
                )
        }
    ];

    return (
        <div className="container-form">
            <div className="title-div">
                <Text>Product List</Text>
            </div>
            <Divider />
            <Row>
                <Col md={24}>
                    <Row className="rows-gap">
                        <Col md={10}>
                            <Form fluid>
                                <MyInput
                                    width="100%"
                                    menuMaxHeight="15vh"
                                    placeholder="Select Product"
                                    showLabel={false}
                                    selectData={warehouseProductListResponseLoading?.object ?? []}
                                    fieldType="multyPicker"
                                    selectDataLabel="productName"
                                    selectDataValue="key"
                                    fieldName="key"
                                    record={selectedWarehouseProductList}
                                    setRecord={setSelectedWarehouseProductList}
                                />
                            </Form>
                        </Col>
                        <Col md={11}></Col>
                        <Col md={3}>
                            <MyButton onClick={handleSave}>Save</MyButton>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={24}>
                            <MyTable
                                height={200}
                                data={warehouseProductListResponseLoading?.object || []}
                                columns={columns}
                                onRowClick={(rowData) => {
                                    setTransaction(rowData);
                                }}
                                rowClassName={isSelected}
                            />
                        </Col>
                    </Row>
                </Col>
            </Row>
        </div>
    );
};

export default ProductListOut;
