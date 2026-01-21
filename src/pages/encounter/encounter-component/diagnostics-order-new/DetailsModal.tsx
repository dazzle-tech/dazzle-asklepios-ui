import React, { useEffect, useState } from 'react';
import './styles.less';
import MyModal from '@/components/MyModal/MyModal';
import { Col, Form, Row } from 'rsuite';
import MyInput from '@/components/MyInput';
import { faVials } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { useFetchAttachmentByKeyQuery } from '@/services/attachmentService';
import clsx from 'clsx';
import { skipToken } from '@reduxjs/toolkit/query';
import { useGetDepartmentByTypeQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';

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
  const [actionType] = useState(null);
  const [requestedPatientAttacment] = useState();
  const [receivedType, setReceivedType] = useState('');

  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
  const { data: timeUnitsLovQueryResponse } = useGetLovValuesByCodeQuery('TIME_UNITS');
   const [deptPage, setDeptPage] = useState(0);
  const { data: receivedLabList } = useGetDepartmentByTypeQuery(
    receivedType
      ? {
          type: receivedType,
          page: deptPage,
          size: 3
        }
      : skipToken
  );

  const {
    data: fetchAttachmentByKeyResponce,
    error,
    isLoading,
    isFetching,
    isSuccess,
    refetch
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    { skip: !requestedPatientAttacment || (!order?.id && !order?.key) }
  );

  useEffect(() => {
    const testType =  test?.type;
    if (testType === 'LABORATORY') {
      setReceivedType('LABORATORY');
    } else if ( testType === 'RADIOLOGY') {
      setReceivedType('RADIOLOGY');
    } else if (testType === 'PATHOLOGY') {
      setReceivedType('PATHOLOGY');
    } else {
      setReceivedType('');
    }
  }, [test]);

  const [allDepartments, setAllDepartments] = useState([]);

  useEffect(() => {
     if (receivedLabList?.data) {
       setAllDepartments((prev) =>
         deptPage === 0 ? receivedLabList.data : [...prev, ...receivedLabList.data]
       );
     }
   }, [receivedLabList]);
 
  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      }
    }
  }, [requestedPatientAttacment, fetchAttachmentByKeyResponce, actionType]);

  useEffect(() => {
    if (orderTest?.receivedLabId && !orderTest?.receivedDepartmentId) {
      setOrderTest(prev => ({
        ...prev,
        receivedDepartmentId: orderTest.receivedLabId
      }));
    }
  }, [orderTest?.receivedLabId, orderTest?.receivedDepartmentId, setOrderTest]);

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

    } catch (error) {
    }
  };

  const statusValue =
    orderTest?.status ?? orderTest?.statusLkey ?? orderTest?.statusLvalue?.valueCode;
  const isEditable =
    !edit && (statusValue === 'NEW' || statusValue === 'DIAG_ORDER_STAT_NEW');

  const testTypeLabel =
    test?.testTypeLvalue?.lovDisplayVale ?? test?.type ?? test?.testTypeLkey ?? '';
  const testNameLabel = test?.testName ?? test?.name ?? '';

  useEffect(() => {
    if (
      openDetailsModel &&
      orderTest?.reasonLkey &&
      ReasonLovQueryResponse?.object?.length
    ) {
      setOrderTest(prev => ({ ...prev }));
    }
  }, [ReasonLovQueryResponse?.object]);

  return (
    <>
      <MyModal
        open={openDetailsModel}
        setOpen={setOpenDetailsModel}
        title="Add Test Details"
        actionButtonFunction={handleSaveTest}
        isDisabledActionBtn={!isEditable}
        position="right"
        bodyheight="60vh"
        size="35vw"
        steps={[
          {
            title: `${testTypeLabel} - ${testNameLabel}`,
            icon: <FontAwesomeIcon icon={faVials} />
          }
        ]}
        content={
          <div className={clsx('', { 'disabled-panel': edit })}>
            <Form fluid>
                  <MyInput
                    fieldType="select"
                    fieldLabel="Reason"
                    selectData={ReasonLovQueryResponse?.object ?? []}
                    selectDataLabel="lovDisplayVale"
                    selectDataValue="key"
                    fieldName={'reasonLkey'}
                    record={orderTest}
                    setRecord={setOrderTest}
                  />

                  <MyInput
                    fieldType="selectPagination"
                    fieldLabel="Add Department"
                    fieldName="receivedDepartmentId"
                    selectData={allDepartments}
                    selectDataLabel="name"
                    selectDataValue="id"
                   record={orderTest}
                    setRecord={setOrderTest}
                    searchable
                    width={520}
                    hasMore={receivedLabList?.links?.next ? true : false}
                    onFetchMore={() => {
                      if (receivedLabList?.links?.next) {
                        const { page } = extractPaginationFromLink(receivedLabList.links.next);
                        setDeptPage(page);
                      }
                    }}
                  />

                  <MyInput
                    height={70}
                    width={'100%'}
                    fieldLabel="Notes"
                    fieldName={'notes'}
                    record={orderTest}
                    setRecord={setOrderTest}
                  />

            </Form>
          </div>
        }
      />
    </>
  );
};

export default DetailsModal;
