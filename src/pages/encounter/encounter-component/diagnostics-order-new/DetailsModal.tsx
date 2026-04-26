import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useFetchAttachmentByKeyQuery } from '@/services/attachmentService';
import { useGetActiveDepartmentByTypeAndFacilityQuery } from '@/services/security/departmentService';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
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
  patient,
  facilityId
}) => {
  const [actionType] = useState(null);
  const [requestedPatientAttacment] = useState();
  const [receivedType, setReceivedType] = useState('');

  const { data: ReasonLovQueryResponse } = useGetLovValuesByCodeQuery('DIAG_ORD_REASON');

  // ✅ NEW ENDPOINT (NO PAGINATION)
  const { data: receivedLabList } = useGetActiveDepartmentByTypeAndFacilityQuery(
    receivedType && facilityId
      ? {
          type: receivedType,
          facilityId
        }
      : skipToken
  );

  const {
    data: fetchAttachmentByKeyResponce,
    isSuccess
  } = useFetchAttachmentByKeyQuery(
    { key: requestedPatientAttacment },
    { skip: !requestedPatientAttacment || (!order?.id && !order?.key) }
  );

  // تحديد النوع
  useEffect(() => {
    const testType = test?.type;
    if (testType === 'LABORATORY') setReceivedType('LABORATORY');
    else if (testType === 'RADIOLOGY') setReceivedType('RADIOLOGY');
    else if (testType === 'PATHOLOGY') setReceivedType('PATHOLOGY');
    else setReceivedType('');
  }, [test]);

  // ✅ بدون pagination
  const [allDepartments, setAllDepartments] = useState([]);

  useEffect(() => {
    if (receivedLabList) {
      setAllDepartments(receivedLabList);
    }
  }, [receivedLabList]);

  useEffect(() => {
    if (isSuccess && fetchAttachmentByKeyResponce) {
      if (actionType === 'download') {
        handleDownload(fetchAttachmentByKeyResponce);
      }
    }
  }, [fetchAttachmentByKeyResponce, actionType]);

  useEffect(() => {
    if (orderTest?.receivedLabId && !orderTest?.receivedDepartmentId) {
      setOrderTest(prev => ({
        ...prev,
        receivedDepartmentId: orderTest.receivedLabId
      }));
    }
  }, [orderTest]);

  const handleDownload = async attachment => {
    try {
      if (!attachment?.fileContent) return;

      const byteCharacters = atob(attachment.fileContent);
      const byteNumbers = Array.from(byteCharacters).map(c => c.charCodeAt(0));
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: attachment.contentType
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {}
  };

  const statusValue =
    orderTest?.status ?? orderTest?.statusLkey ?? orderTest?.statusLvalue?.valueCode;

  const isEditable =
    !edit && (statusValue === 'NEW' || statusValue === 'DIAG_ORDER_STAT_NEW');

  const testTypeLabel =
    test?.testTypeLvalue?.lovDisplayVale ?? test?.type ?? '';

  const testNameLabel = test?.testName ?? test?.name ?? '';

  const direction = localStorage.getItem('direction') || 'LTR';
  const dir = direction === 'RTL' ? 'rtl' : 'ltr';

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
              <div className="details-modal-diagnostic-order-inputs">
                
                {/* Reason */}
                <MyInput
                  fieldType="select"
                  fieldLabel="Reason"
                  selectData={ReasonLovQueryResponse?.object ?? []}
                  selectDataLabel="lovDisplayVale"
                  selectDataValue="key"
                  fieldName="reason"
                  record={orderTest}
                  setRecord={setOrderTest}
                  width="12vw"
                />

                {/* ✅ Departments بدون pagination */}
                <MyInput
                  fieldType="select"
                  fieldLabel="Add Department"
                  fieldName="receivedDepartmentId"
                  selectData={allDepartments}
                  selectDataLabel="name"
                  selectDataValue="id"
                  record={orderTest}
                  setRecord={setOrderTest}
                  searchable
                  width="12vw"
                />
              </div>

              <PatientDiagnosisTable
                patient={patient}
                disabled={!isEditable}
                selectMode
                selectedDiagnosisId={orderTest?.icdDiagnosisId}
                onSelectDiagnosis={ids => {
                  const selectedIcd = ids?.[0] ?? null;
                  setOrderTest(prev => ({
                    ...prev,
                    icdDiagnosisId: selectedIcd
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