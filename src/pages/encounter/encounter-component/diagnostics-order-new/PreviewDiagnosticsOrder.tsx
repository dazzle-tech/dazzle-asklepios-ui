import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import { useGetDepartmentByIdQuery } from '@/services/security/departmentService';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useState } from 'react';
import { Col, Form, Panel, Row } from 'rsuite';
import './styles.less';

interface PreviewDiagnosticsOrderProps {
    open: boolean;
    orderTest: any;
}

const PreviewDiagnosticsOrder: React.FC<PreviewDiagnosticsOrderProps> = ({
    open,
    orderTest
}) => {
    const [previewData, setPreviewData] = useState<any>({
        testName: '',
        orderType: '',
        repeatEveryNumber: '',
        repeatEveryUnit: '',
        periodNumber: '',
        periodUnit: '',
        firstOccurrenceDateTime: '',
        notes: '',
        isRepeat: false,
        reason: '',
        receivedLab: ''
    });



    const labDepartmentId =
        (orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId) &&
            (orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId) !== 0
            ? orderTest?.receivedDepartmentId ?? orderTest?.receivedLabId
            : null;


    const {
        data: receivedDepartment,
        isFetching: isFetchingDepartment
    } = useGetDepartmentByIdQuery(
        labDepartmentId ?? skipToken
    );


    useEffect(() => {
        if (!orderTest) return;

        setPreviewData(prev => ({
            ...prev,
            testName: orderTest.test?.testName ?? orderTest.test?.name ?? '-',
            orderType:
                orderTest.orderTypeLvalue?.lovDisplayVale ??
                orderTest.orderType ??
                orderTest.test?.type ??
                '-',
            repeatEveryNumber: orderTest.repeatEveryNumber ?? '',
            repeatEveryUnit: orderTest.repeatEveryUnit ?? '',
            periodNumber: orderTest.periodNumber ?? '',
            periodUnit: orderTest.periodUnit ?? '',
            firstOccurrenceDateTime: orderTest.firstOccurrenceDateTime ?? '',
            notes: orderTest.notes ?? '',
            isRepeat: Boolean(orderTest.isRepeat),
            reason:
                orderTest.reasonLvalue?.lovDisplayVale ??
                orderTest.reason ??
                '-'
        }));
    }, [orderTest]);

    useEffect(() => {
        if (!labDepartmentId) {
            setPreviewData(prev => ({ ...prev, receivedLab: '-' }));
            return;
        }

        if (isFetchingDepartment) {
            setPreviewData(prev => ({ ...prev, receivedLab: 'Loading...' }));
            return;
        }

        setPreviewData(prev => ({
            ...prev,
            receivedLab:
                receivedDepartment?.name ??
                receivedDepartment?.translatedObject?.name ??
                '-'
        }));
    }, [labDepartmentId, receivedDepartment, isFetchingDepartment]);



    if (!orderTest) return null;





    return (
        <>
            {open && (
                <Panel
                    bordered
                    className="preview-request"
                    header={
                        <div className="preview-header">
                            <span>Diagnostics Order Preview</span>
                        </div>
                    }
                >
                    <Form fluid>
                        <div className="main-sections-preview-request-container">
                            {/* Basic Info */}
                            <SectionContainer
                                title="Basic Info"
                                content={
                                    <Row gutter={16}>
                                        <Col md={8}>
                                            <MyInput
                                                fieldType="text"
                                                fieldLabel="Test Name"
                                                record={previewData}
                                                fieldName="testName"
                                                disabled
                                            />
                                        </Col>
                                        <Col md={8}>
                                            <MyInput
                                                fieldType="text"
                                                fieldLabel="Test Type"
                                                record={previewData}
                                                fieldName="orderType"
                                                disabled
                                            />
                                        </Col>
                                        <Col md={8}>
                                            <MyInput
                                                fieldType="text"
                                                fieldLabel="Reason"
                                                record={previewData}
                                                fieldName="reason"
                                                disabled
                                            />
                                        </Col>
                                        <Col md={8}>
                                            <MyInput
                                                fieldType="text"
                                                fieldLabel="Received Lab"
                                                record={previewData}
                                                fieldName="receivedLab"
                                                disabled
                                            />
                                        </Col>
                                    </Row>
                                }
                            />

                            {previewData.isRepeat && (
                                <SectionContainer
                                    title="Repeat Details"
                                    content={
                                        <Row gutter={16}>
                                            <Col md={8}>
                                                <MyInput
                                                    fieldType="text"
                                                    fieldLabel="Repeat Every"
                                                    record={previewData}
                                                    fieldName="repeatEveryNumber"
                                                    disabled
                                                />
                                            </Col>

                                            <Col md={8}>
                                                <MyInput
                                                    fieldType="text"
                                                    fieldLabel="For Period"
                                                    record={previewData}
                                                    fieldName="periodNumber"
                                                    disabled
                                                />
                                            </Col>

                                            <Col md={8}>
                                                <MyInput
                                                    fieldType="datetime"
                                                    fieldLabel="First Occurrence"
                                                    record={previewData}
                                                    fieldName="firstOccurrenceDateTime"
                                                    disabled
                                                />
                                            </Col>
                                        </Row>
                                    }
                                />
                            )}


                            {/* Notes */}
                            <SectionContainer
                                title="Notes"
                                content={
                                    <Row>
                                        <Col md={24}>
                                            <MyInput
                                                fieldType="textarea"
                                                fieldLabel="Notes"
                                                record={previewData}
                                                fieldName="notes"
                                                disabled
                                            />
                                        </Col>
                                    </Row>
                                }
                            />
                            <SectionContainer
                                title="Repeat Details"
                                content={
                                    <>
                                        <Row>
                                            <Col md={8}>
                                                <MyInput
                                                    width="100%"
                                                    fieldType="text"
                                                    fieldLabel="Repeat Every"
                                                    record={previewData}
                                                    fieldName="repeatEveryNumber"
                                                    disabled
                                                />
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={8}>
                                                <MyInput
                                                    width="100%"
                                                    fieldType="text"
                                                    fieldLabel="For period of"
                                                    record={previewData}
                                                    fieldName="periodNumber"
                                                    disabled
                                                />
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={16}>
                                                <MyInput
                                                    width="100%"
                                                    fieldType="datetime"
                                                    fieldLabel="First Occurrence Time"
                                                    record={previewData}
                                                    fieldName="firstOccurrenceDateTime"
                                                    disabled
                                                />
                                            </Col>
                                        </Row>
                                    </>
                                }
                            />

                        </div>
                    </Form>
                </Panel>
            )}
        </>
    );
};

export default PreviewDiagnosticsOrder;
