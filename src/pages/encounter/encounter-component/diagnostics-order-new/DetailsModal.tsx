import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useFetchAttachmentByKeyQuery } from '@/services/attachmentService';
import { useGetActiveDepartmentByTypeQuery } from '@/services/security/departmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { faVials } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { skipToken } from '@reduxjs/toolkit/query';
import clsx from 'clsx';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';
import './styles.less';
import PatientDiagnosisTable from '../../medical-notes-and-assessments/patient-diagnosis/PatientDiagnosisTable';

const DetailsModal = ({
  test,
  openDetailsModel,
  setOpenDetailsModel,
  handleSaveTest,
  orderTest,
  setOrderTest,
  order,
  edit,
  patient
}) => {
  const [actionType] = useState(null);
  const [requestedPatientAttacment] = useState();
  const [receivedType, setReceivedType] = useState('');

  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');
  const [deptPage, setDeptPage] = useState(0);
  const { data: receivedLabList } = useGetActiveDepartmentByTypeQuery(
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
    const testType = test?.type;
    if (testType === 'LABORATORY') {
      setReceivedType('LABORATORY');
    } else if (testType === 'RADIOLOGY') {
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

  // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div dir={dir}>
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
              <div className='details-modal-diagnostic-order-inputs'>
                <MyInput
                  fieldType="select"
                  fieldLabel="Reason"
                  selectData={ReasonLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName={'reasonLkey'}
                  record={orderTest}
                  setRecord={setOrderTest}
                  width={"12vw"}
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
                  width={"12vw"}
                  hasMore={receivedLabList?.links?.next ? true : false}
                  onFetchMore={() => {
                    if (receivedLabList?.links?.next) {
                      const { page } = extractPaginationFromLink(receivedLabList.links.next);
                      setDeptPage(page);
                    }
                  }}
                />
              </div>
              <MyInput
                height={70}
                width={'100%'}
                fieldLabel="Notes"
                fieldName={'notes'}
                record={orderTest}
                setRecord={setOrderTest}
              />

                <PatientDiagnosisTable
                  patient={patient}
                  disabled={!isEditable}
                  selectMode
                  onSelectDiagnosis={(ids) => {
                    const selectedIcd = ids?.[0];

                    setOrderTest(prev => ({
                      ...prev,
                      indicationIcd: selectedIcd
                    }));
                  }}
                />
            </Form>
          </div>
        }
      />
    </div>
  );
};

export default DetailsModal;
