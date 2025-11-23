import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { faVials } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useGetDepartmentListByTypeQuery } from '@/services/setupService';
import { useFetchAttachmentByKeyQuery } from '@/services/attachmentService';
import { useGetDiagnosticTestByIdQuery } from '@/services/setup/diagnosticTest/diagnosticTestService';
import clsx from 'clsx';
import { formatEnumString } from '@/utils';

const DetailsModal = ({
  test,
  openDetailsModel,
  setOpenDetailsModel,
  handleSaveTest,
  orderTest,
  setOrderTest,
  order,
  edit
}) => {
  const [attachmentsModalOpen, setAttachmentsModalOpen] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [requestedPatientAttacment, setRequestedPatientAttacment] = useState();
  const [receivedType, setReceivedType] = useState('');
  const [isRepeatEnabled, setIsRepeatEnabled] = useState(false);

  const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
  const { data: departmentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');
  const { data: timeUnitsLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');

  const { data: receivedLabList } = useGetDepartmentListByTypeQuery(receivedType);

  // Fetch test details from new backend service using testKey from orderTest
  const testId = orderTest?.testKey;
  const { data: testDetailsResponse, isLoading: isLoadingTestDetails } = useGetDiagnosticTestByIdQuery(
    testId || '',
    { skip: !testId || !openDetailsModel }
  );
  
  // Extract test data from response (response structure is { data: testObject } or { data: [testObject] })
  const testDetails = React.useMemo(() => {
    if (!testDetailsResponse) return null;
    // Handle array response
    if (Array.isArray(testDetailsResponse?.data)) {
      return testDetailsResponse.data[0] || null;
    }
    // Handle single object response
    return testDetailsResponse?.data || null;
  }, [testDetailsResponse]);

  const {
    data: fetchAttachmentByKeyResponce,
    error,
    isLoading,
    isFetching,
    isSuccess,
    refetch
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    { skip: !requestedPatientAttacment || !order.key }
  );

  useEffect(() => {
    // Use testDetails from new backend service, fallback to test prop
    const currentTest = testDetails || test;
    const testType = currentTest?.testType || currentTest?.testTypeLkey;
    
    if (testType == '862810597620632') {
      setReceivedType('5673990729647007');
    } else if (testType == '862828331135792') {
      setReceivedType('5673990729647008');
    } else if (testType == '862842242812880') {
      setReceivedType('5673990729647009');
    } else {
      setReceivedType('');
    }
  }, [testDetails, test]);

  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);

  useEffect(() => {
    // Initialize repeat checkbox state based on orderTest data
    setIsRepeatEnabled(!!orderTest?.isRepeat);
  }, [orderTest?.isRepeat]);

  const handleDownload = async attachment => {
    try {
      if (!attachment?.fileContent || !attachment?.contentType || !attachment?.fileName) {
        console.error('Invalid attachment data.');
        return;
      }

      const byteCharacters = atob(attachment.fileContent);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: attachment.contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = attachment.fileName;

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      console.log('File downloaded successfully:', attachment.fileName);
    } catch (error) {
      console.error('Error during file download:', error);
    }
  };

  const handleDownloadSelectedPatientAttachment = attachmentKey => {
    setRequestedPatientAttacment(attachmentKey);
    setActionType('download');
  };

  const handleRepeatCheckboxChange = checked => {
    setIsRepeatEnabled(checked);
    setOrderTest(prev => ({
      ...prev,
      isRepeat: checked,
      // Clear repeat fields if unchecked
      ...(checked
        ? {}
        : {
          repeatEveryNumber: null,
          repeatEveryUnit: null,
          periodNumber: null,
          periodUnit: null,
          firstOccurrenceDateTime: null
        })
    }));
  };


  return (
    <>
      <MyModal
        open={openDetailsModel}
        setOpen={setOpenDetailsModel}
        title="Add Test Details"
        actionButtonFunction={handleSaveTest}
        isDisabledActionBtn={
          edit ? true : orderTest?.statusLvalue?.valueCode !== ' DIAG_ORDER_STAT_NEW'
        }
        position="right"
        bodyheight="60vh"
        size="35vw"
        steps={[
          {
            title: (() => {
              // Use testDetails from new backend service, fallback to test prop
              const currentTest = testDetails || test;
              
              // Get test type - try different possible field names
              const testType = currentTest?.testType || 
                             currentTest?.type?.lovDisplayVale || 
                             currentTest?.testTypeName ||
                           formatEnumString( currentTest?.type) ||
                             '';
              
              // Get test name - try different possible field names
              const testName = currentTest?.testName || 
                             currentTest?.name || 
                             currentTest?.testNameEn ||
                             '';
              
              // Format: "Type - Name" or just "Name" if type not available
              if (testType && testName) {
                return `${testType} - ${testName}`;
              }
              return testName || testType || 'Test Details';
            })(),
            icon: <FontAwesomeIcon icon={faVials} />
          }
        ]}
        content={
          <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid>
              <Row>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Order Priority"
                    selectData={orderPriorityLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'priorityLkey'}
                    record={orderTest}
                    setRecord={setOrderTest}
                    searchable={false}
                  />
                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Reason"
                    selectData={ReasonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'reasonLkey'}
                    record={orderTest}
                    setRecord={setOrderTest}
                    value={orderTest?.reasonLkey}
                  />

                </Col>
                <Col md={8}>
                  <MyInput
                    width="100%"
                    fieldType="select"
                    fieldLabel="Received Lab"
                    selectData={receivedLabList?.object ?? []}
                    selectDataLabel="name"
                    selectDataValue="key"
                    fieldName={'receivedLabKey'}
                    record={orderTest}
                    setRecord={setOrderTest}
                  />
                </Col>
              </Row>

              {/* Repeat Section */}
              <Row style={{ marginTop: '16px' }}>
                <Col md={24}>
                  <MyInput
                    fieldType="checkbox"
                    fieldLabel="Repeat"
                    fieldName={'isRepeat'}
                    record={orderTest}
                    setRecord={setOrderTest}
                    onChange={handleRepeatCheckboxChange}
                  />
                </Col>
              </Row>

              {/* Repeat Fields - Only show when repeat is enabled */}
              {isRepeatEnabled && (
                <>
                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="number"
                        fieldLabel="Repeat every"
                        fieldName={'repeatEveryNumber'}
                        record={orderTest}
                        setRecord={setOrderTest}
                        min={1}
                      />
                    </Col>
                    <div className="margin-top">
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldLabel=""
                          selectData={timeUnitsLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName={'repeatEveryUnit'}
                          record={orderTest}
                          setRecord={setOrderTest}
                        />
                      </Col>
                    </div>
                  </Row>

                  <Row>
                    <Col md={8}>
                      <MyInput
                        width="100%"
                        fieldType="number"
                        fieldLabel="For period of"
                        fieldName={'periodNumber'}
                        record={orderTest}
                        setRecord={setOrderTest}
                        min={1}
                      />
                    </Col>
                    <div className="margin-top">
                      <Col md={8}>
                        <MyInput
                          width="100%"
                          fieldType="select"
                          fieldLabel=""
                          selectData={timeUnitsLovQueryResponse?.object ?? []}
                          selectDataLabel="lovDisplayVale"
                          selectDataValue="key"
                          fieldName={'periodUnit'}
                          record={orderTest}
                          setRecord={setOrderTest}
                        />
                      </Col>
                    </div>
                  </Row>

                  <Row>
                    <Col md={16}>
                      <MyInput
                        width="100%"
                        fieldType="datetime"
                        fieldLabel="First occurrence time"
                        fieldName={'firstOccurrenceDateTime'}
                        record={orderTest}
                        setRecord={setOrderTest}
                      />
                    </Col>
                  </Row>
                </>
              )}

              <Row>
                <Col md={24}>
                  <MyInput
                    height={70}
                    width={'100%'}
                    fieldLabel="Notes"
                    fieldName={'notes'}
                    record={orderTest}
                    setRecord={setOrderTest}
                  />
                </Col>
              </Row>
            </Form>
          </div>
        }
      />
    </>
  );
};

export default DetailsModal;
