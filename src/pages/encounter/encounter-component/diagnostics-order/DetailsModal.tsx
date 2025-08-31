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
import clsx from 'clsx';
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
  const { data: orderPriorityLovQueryResponse } = useGetLovValuesByCodeQuery('ORDER_PRIORITY');
  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
  const { data: departmentTypeLovQueryResponse } = useGetLovValuesByCodeQuery('DEPARTMENT-TYP');

  const { data: receivedLabList } = useGetDepartmentListByTypeQuery(receivedType);

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
    if (test?.testTypeLkey == '862810597620632') {
      setReceivedType('5673990729647007');
    } else if (test?.testTypeLkey == '862828331135792') {
      setReceivedType('5673990729647008');
    } else if (test?.testTypeLkey == '862842242812880') {
      setReceivedType('5673990729647009');
    } else {
      setReceivedType('');
    }
  }, [test]);

  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);
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
            title: (test?.testTypeLvalue?.lovDisplayVale || '') + ' - ' + (test?.testName || ''),
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
              <Row>
                <Col md={24}>
                  <MyInput
                    height={70}
                    width={'100%'}
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
