import React, { useEffect, useState } from 'react';
import { Form, Modal } from 'rsuite';
import MyInput from '@/components/MyInput';
import { ApInventoryTransfer, ApPatient, ApPatientInsurance, ApProducts } from '@/types/model-types';
import { useGetLovValuesByCodeQuery, useGetProductQuery, useGetUomGroupsUnitsQuery, useGetWarehouseQuery } from '@/services/setupService';
import MyTable from '@/components/MyTable';
import { initialListRequest, ListRequest } from '@/types/types';
import { addFilterToListRequest, conjureValueBasedOnKeyFromList } from '@/utils';
import './styles.less'
import { newApInventoryTransfer, newApPatient, newApPatientInsurance, newApProducts } from '@/types/model-types-constructor';
import { useDispatch } from 'react-redux';
import { faFileExport, faMagnifyingGlass, faPlus } from '@fortawesome/free-solid-svg-icons';
import { setDivContent, setPageCode } from '@/reducers/divSlice';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { faFileCsv } from '@fortawesome/free-solid-svg-icons';
import ReactDOMServer from 'react-dom/server';
import MyButton from '@/components/MyButton/MyButton';
import { formatDateWithoutSeconds } from '@/utils';
import Translate from '@/components/Translate';
import { MdCheckBox, MdListAlt } from 'react-icons/md';
import InfoCardList from '@/components/InfoCardList';
import ModalProductCard from './ModalProductCard';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';
import { set } from 'lodash';
const ProductCatalog = () => {

    const [open, setOpen] = useState(false);
    const [searchPatient, setSearchPatient] = useState<ApPatient>({ ...newApPatient });
    const [transfer, setTransfer] = useState<ApInventoryTransfer>({ ...newApInventoryTransfer });
    const [product, setProduct] = useState<ApProducts>({ ...newApProducts });
    const [insurancePatient, setInsurancePatient] = useState<ApPatientInsurance>({ ...newApPatientInsurance });
    const [dateFilter, setDateFilter] = useState({ fromDate: '', toDate: '' });
    // Fetch LOV data for various fields
    const { data: genderLovQueryResponse } = useGetLovValuesByCodeQuery('GNDR');
    const { data: documentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DOC_TYPE');
    const { data: primaryInsuranceProviderLovQueryResponse } = useGetLovValuesByCodeQuery('INS_PROVIDER');
    const [transactionListRequest, setTransactionListRequest] = useState<ListRequest>({
        ...initialListRequest,
        filters: [
            {
                fieldName: 'deleted_at',
                operator: 'isNull',
                value: undefined,
            },
        ],
    });

    const { data: transstatusListResponse, refetch: refetchTransStatus } = useGetLovValuesByCodeQuery('LABRAD_ORDER_STATUS');

    const { data: warehouseListResponse } = useGetWarehouseQuery(transactionListRequest);


    // Initialize list request with default filters
    const [listRequest, setListRequest] = useState<ListRequest>({ ...initialListRequest, filters: [] });


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

    const [uomListRequest, setUomListRequest] = useState<ListRequest>({ ...initialListRequest });

    const {
        data: uomGroupsUnitsListResponse,
        refetch: refetchUomGroupsUnit,
    } = useGetUomGroupsUnitsQuery(uomListRequest);

    const { data: productTypeLovQueryResponse } = useGetLovValuesByCodeQuery('PRODUCTS_TYPES');
    const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');

    const calculateCost = (totalQuantity, unitCost) => {
        return totalQuantity * unitCost;
    };

    const iconsForActions = (rowData: any) => (
        <div className="container-of-icons">
            <MdListAlt
                className="icons-style"
                title="View Transfer Details"
                size={24}
                fill="var(--primary-gray)"
                onClick={() => {
                    setOpen(true);
                    setTransfer(rowData);
                }}
            />

        </div>
    );
    // handle manual search from date to date 
    const handleManualSearch = () => {
        if (dateFilter.fromDate && dateFilter.toDate) {
            const formattedFromDate = dateFilter.fromDate;
            const formattedToDate = dateFilter.toDate;
            setListRequest(
                addFilterToListRequest(
                    'created_at',
                    'between',
                    formattedFromDate + '_' + formattedToDate,
                    listRequest
                )
            );
        } else if (dateFilter.fromDate) {
            const formattedFromDate = dateFilter.fromDate;
            setListRequest(
                addFilterToListRequest('created_at', 'gte', formattedFromDate, listRequest)
            );
        } else if (dateFilter.toDate) {
            const formattedToDate = dateFilter.toDate;
            setListRequest(
                addFilterToListRequest('created_at', 'lte', formattedToDate, listRequest)
            );
        } else {
            setListRequest({ ...listRequest, filters: [] });
        }
    };
    // handle search of dob
    const handleDOFSearch = () => {
        const dob = searchPatient?.dob;
        setListRequest(
            addFilterToListRequest(
                'dob',
                'match',
                dob,
                listRequest
            )
        );

    };

    // Effects
    useEffect(() => {
        handleManualSearch();
    }, []);
    useEffect(() => {
        setListRequest((prevState) => ({
            ...prevState,
            filters: [
                ...prevState.filters.filter(
                    (filter) =>
                        !['gender_lkey', 'document_type_lkey', 'insurance_provider_lkey'].includes(
                            filter.fieldName
                        )
                ),
                searchPatient.genderLkey && {
                    fieldName: 'gender_lkey',
                    operator: 'match',
                    value: searchPatient.genderLkey,
                },
                searchPatient.documentTypeLkey && {
                    fieldName: 'document_type_lkey',
                    operator: 'match',
                    value: searchPatient.documentTypeLkey,
                },
                insurancePatient.insuranceProviderLkey && {
                    fieldName: 'insurance_provider_lkey',
                    operator: 'match',
                    value: insurancePatient.insuranceProviderLkey,
                },
            ].filter(Boolean),
        }));
    }, [searchPatient.genderLkey, searchPatient.documentTypeLkey, insurancePatient.insuranceProviderLkey]);
    useEffect(() => {
        handleManualSearch();
    }, [dateFilter]);
    useEffect(() => {
        handleDOFSearch();
    }, [searchPatient?.dob]);

    const dispatch = useDispatch();
    const divContent = (
        <div style={{ display: 'flex' }}>
            <h5> Product Catalog</h5>
        </div>
    );
    // page header setup
    const divContentHTML = ReactDOMServer.renderToStaticMarkup(divContent);
    dispatch(setPageCode('ProductCatalog'));
    dispatch(setDivContent(divContentHTML));


    useEffect(() => {
        return () => {
            dispatch(setPageCode(''));
            dispatch(setDivContent('  '));
        };
    }, [location.pathname, dispatch]);


    return (
         <div className='container-div'>
           <div className='field-btn-div'>                            
            
            <div className='product-catalog-filters-borders'>
                        <Form layout='inline' fluid>
                                <div className='inputs-product-catalog-filters'>
                            <MyInput
                                column
                                fieldLabel="Product Name"
                                fieldName="transactionId"
                                record={searchPatient}
                                setRecord={setSearchPatient}
                            />
                            <MyInput
                                column
                                fieldLabel="Product Type"
                                fieldType="select"
                                fieldName="productTypeLkey"
                                selectData={[]}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={searchPatient}
                                setRecord={setSearchPatient}
                            />
                            <MyInput
                                column
                                fieldLabel="code"
                                fieldName="transactionId"
                                record={searchPatient}
                                setRecord={setSearchPatient}
                            />
                            <MyInput
                                column
                                fieldLabel="Product Inventory Type"
                                fieldType="select"
                                fieldName="documentTypeLkey"
                                selectData={[]}
                                selectDataLabel="lovDisplayVale"
                                selectDataValue="key"
                                record={searchPatient}
                                setRecord={setSearchPatient}
                            /></div>
                        </Form>
                                <AdvancedSearchFilters searchFilter={true}/>
                        </div>
                    </div>
            <InfoCardList
                list={productListResponseLoading?.object || []}
                fields={[
                    'name',
                    'typeLkey',
                    'code',
                    'inventoryTypeLkey',
                ]}
                titleField="name"
                fieldLabels={{
                    name: 'Product Name',
                    typeDisplay: 'Type',
                    code: 'Code',
                    inventoryTypeDisplay: 'Inventory Type',
                }}
                variant="product-grid"
                showOpenButton={true}
                onCardClick={(selectedProduct) => {
                     console.log('Clicked product:', selectedProduct);
                    setOpen(true);
                    setProduct(selectedProduct);
                }}
            />
            <ModalProductCard
                open={open}
                setOpen={setOpen}
                product={product}
                setProduct={setProduct}
            />
        </div>

    );
};

export default ProductCatalog;
