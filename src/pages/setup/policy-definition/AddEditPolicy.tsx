import React from 'react';
import MyInput from '@/components/MyInput';
import { Col, Form, Row } from 'rsuite';
import { GrTestDesktop } from 'react-icons/gr';
import MyModal from '@/components/MyModal/MyModal';
import { useGetActiveFacilitiesQuery } from '@/services/security/facilityService';
const AddEditPolicy = ({ open, setOpen, policy, setPolicy }) => {
    const { data: facilityListResponse } = useGetActiveFacilitiesQuery({});
    // Main modal content
    const conjureFormContentOfMainModal = stepNumber => {
        switch (stepNumber) {
            case 0:
                return (
                    <Form fluid>
                        <MyInput
                            placeholder="Select Facility"
                            width="100%"
                            fieldType="select"
                            fieldLabel="Facility"
                            selectData={facilityListResponse ?? []}
                            selectDataLabel="name"
                            selectDataValue="id"
                            fieldName="facilityId"
                            record={policy}
                            setRecord={setPolicy}
                            searchable={false}
                        />
                        <Row>
                        <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldName="name"
                            record={policy}
                            setRecord={setPolicy}
                        />
                        </Col>
                        <Col md={12}>
                        <MyInput
                            width="100%"
                            fieldName="code"
                            record={policy}
                            setRecord={setPolicy}
                        />
                        </Col>
                        </Row>
                        <MyInput
                            width="100%"
                            fieldName="description"
                            fieldType='textarea'
                            record={policy}
                            setRecord={setPolicy}
                        />
                        
                    </Form>
                );
        }
    };
    // Effects


    return (
        <MyModal
            actionButtonLabel={policy?.id ? 'Save' : 'Create'}
            //   actionButtonFunction={}
            open={open}
            setOpen={setOpen}
            position="right"
            title={policy?.id ? 'Edit Policy' : 'New Policy'}
            content={conjureFormContentOfMainModal}
            steps={[
                {
                    title: 'Basic Info',
                    icon: <GrTestDesktop />
                }
            ]}
            size={"40vw"}
        />
    );
};
export default AddEditPolicy;
