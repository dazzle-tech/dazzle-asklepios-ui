import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form, Grid, InputGroup, Row, Stack, Col, Panel, Modal, Button, Divider, Text } from 'rsuite';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import MyButton from '@/components/MyButton/MyButton';
import { faBan, faBold, faBox, faBoxesPacking, faBoxesStacked, faBroom, faCheckDouble, faDiceD6 } from '@fortawesome/free-solid-svg-icons';
import ChildModal from '@/components/ChildModal';
import { notify } from '@/utils/uiReducerActions';
import Translate from '@/components/Translate';
import { conjureValueBasedOnKeyFromList } from '@/utils';
import MyTable from '@/components/MyTable';
import AddOutlineIcon from '@rsuite/icons/AddOutline';
import { useAppDispatch } from '@/hooks';
import { newApProducts, newApUomGroups, newApUomGroupsRelation, newApUomGroupsUnits } from '@/types/model-types-constructor';
import { ApUomGroupsRelation, ApUomGroupsUnits } from '@/types/model-types';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetLovValuesByCodeQuery, useGetUomGroupsQuery, useGetUomGroupsRelationQuery, useGetUomGroupsUnitsQuery, useRemoveProductMutation, useSaveProductMutation, useSaveUomGroupMutation, useSaveUomGroupRelationMutation, useSaveUomGroupUnitsMutation } from '@/services/setupService';
import { MdDelete } from 'react-icons/md';
import { FaUndo } from 'react-icons/fa';
import AdvancedModal from '@/components/AdvancedModal';
import MyLabel from '@/components/MyLabel';
import Room from '@/pages/setup/bed-room-setup';
import BasicInf from './BasicInf';
import UomGroup from './UOMGroup';
import InventoryAttributes from './InventoryAttributes';
import RegulSafty from './RegulSafty';
import FinancCostInfo from './FinancCostInfo';
import MaintenanceInformation from './MaintenanceInformation';
import MyModal from '@/components/MyModal/MyModal';
import { FaProductHunt } from 'react-icons/fa6';

const AddEditProduct = ({
    open,
    setOpen,
    product,
    setProduct,
    refetch
}) => {
    const dispatch = useAppDispatch();
    const [uomUnit, setUomUnit] = useState<ApUomGroupsUnits>({
        ...newApUomGroupsUnits
    });

    const [saveProduct, saveProductMutation] = useSaveProductMutation();


    const handleSave = () => {
        const response = saveProduct({
            ...product,
        }).unwrap().then(() => {
            console.log(response)
            setProduct({ ...response });
            refetch();
            dispatch(
                notify({
                    msg: 'The product Added/Edited successfully ',
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


    const handleClear = () => {
        setProduct({
            ...newApProducts
        })
        setOpen(false);
    };

     const { data: lotSerialLovQueryResponse } = useGetLovValuesByCodeQuery('LOT_SERIAL');
    
      //Modal Content
        const content = () => (
            <>
                <Row gutter={10} className="d">
                        <Form fluid>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text> Basic Information </Text>

                                        </div>
                                        <Divider />
                                        <BasicInf product={product} setProduct={setProduct} disabled={false}/>
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>UMO Group </Text>

                                        </div>
                                        <Divider />
                                        <UomGroup product={product} setProduct={setProduct} disabled={false} />
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Regulatory & Safety</Text>

                                        </div>
                                        <Divider />
                                        <RegulSafty product={product} setProduct={setProduct} disabled={false} />
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Financial & Costing Information </Text>

                                        </div>
                                        <Divider />
                                        <div className='container'>
                                            <FinancCostInfo product={product} setProduct={setProduct} disabled={false}/>
                                        </div>

                                    </div>
                                </Row>
                            </Col>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Maintenance Information</Text>

                                        </div>
                                        <Divider />
                                        <MaintenanceInformation product={product} setProduct={setProduct} disabled={false} />
                                    </div>
                                </Row>

                            </Col>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Inventory Attributes</Text>

                                        </div>
                                        <Divider />
                                        <InventoryAttributes product={product} setProduct={setProduct} disabled={false} />
                                    </div>
                                </Row>
                            </Col>
                        </Form>


                    </Row>
            </>
        );


    return (
        <>
        <MyModal 
          open={open}
                    setOpen={setOpen}
                    title="Product Setup"
                    size="lg"
                    bodyheight="65vh"
                    content={content}
                   
                    hideBack={true}
                    steps={[{ title: "Product Setup", icon: <FontAwesomeIcon icon={faDiceD6} />}]}
                    actionButtonLabel="Save"
                    actionButtonFunction={() => handleSave()}
        
        />
{/*             
            <Modal size={'s'} open={open} backdrop="static">
                <Modal.Header>
                    <Modal.Title>Product Setup</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Row gutter={10} className="d">
                        <Form fluid>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text> Basic Information </Text>

                                        </div>
                                        <Divider />
                                        <BasicInf product={product} setProduct={setProduct} />
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>UMO Group </Text>

                                        </div>
                                        <Divider />
                                        <UomGroup product={product} setProduct={setProduct} />
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Regulatory & Safety</Text>

                                        </div>
                                        <Divider />
                                        <RegulSafty product={product} setProduct={setProduct} />
                                    </div>
                                </Row>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Financial & Costing Information </Text>

                                        </div>
                                        <Divider />
                                        <div className='container'>
                                            <FinancCostInfo product={product} setProduct={setProduct} />
                                        </div>

                                    </div>
                                </Row>
                            </Col>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Maintenance Information</Text>

                                        </div>
                                        <Divider />
                                        <MaintenanceInformation product={product} setProduct={setProduct} />
                                    </div>
                                </Row>

                            </Col>
                            <Col md={12}>
                                <Row>
                                    <div className='container-form'>
                                        <div className='title-div'>
                                            <Text>Inventory Attributes</Text>

                                        </div>
                                        <Divider />
                                        <InventoryAttributes product={product} setProduct={setProduct} />
                                    </div>
                                </Row>
                            </Col>
                        </Form>


                    </Row>
                </Modal.Body>
                <Modal.Footer>
                    <MyButton appearance="primary" onClick={handleSave}>
                        Save
                    </MyButton>
                    <MyButton appearance="subtle" onClick={handleClear}>
                        Cancel
                    </MyButton>
                </Modal.Footer>
            </Modal> */}
        </>
    );
};

export default AddEditProduct;