import React, { useEffect, useState } from 'react';
import { Panel, Form, Row, Col } from 'rsuite';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import './styles.less';

interface PreviewDiagnosticsOrderProps {
    open: boolean;
    setOpen: (open: boolean) => void;
    orderTest: any;
}

const PreviewDiagnosticsOrder: React.FC<PreviewDiagnosticsOrderProps> = ({
    open,
    setOpen,
    orderTest
}) => {
    const [previewData, setPreviewData] = useState<any>({});

    useEffect(() => {
        if (orderTest) {
            setPreviewData({
                testName: orderTest.test?.testName || '-',
                orderType: orderTest.orderTypeLvalue?.lovDisplayVale || '-',
                repeatEveryNumber: orderTest.repeatEveryNumber || '-',
                repeatEveryUnit: orderTest.repeatEveryUnit || '-',
                periodNumber: orderTest.periodNumber || '-',
                periodUnit: orderTest.periodUnit || '-',
                firstOccurrenceDateTime: orderTest.firstOccurrenceDateTime || '-',
                notes: orderTest.notes || '-',
                isRepeat: orderTest.isRepeat || false,
                reason: orderTest.reasonLvalue?.lovDisplayVale || '-',
                receivedLab: orderTest.receivedLabName || '-'
            });
        }
    }, [orderTest]);





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
                                        {/* <Col md={8}>
                      <MyInput
                        fieldType="text"
                        fieldLabel="Order Priority"
                        record={previewData}
                        fieldName="priority"
                        disabled
                      />
                    </Col> */}
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

                            {/* Repeat Details */}
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
                                                    afterLabel={previewData.repeatEveryUnit}
                                                />
                                            </Col>
                                            <Col md={8}>
                                                <MyInput
                                                    fieldType="text"
                                                    fieldLabel="For Period"
                                                    record={previewData}
                                                    fieldName="periodNumber"
                                                    disabled
                                                    afterLabel={previewData.periodUnit}
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
                                                    afterLabel={previewData.repeatEveryUnit}
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
                                                    afterLabel={previewData.periodUnit}
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
