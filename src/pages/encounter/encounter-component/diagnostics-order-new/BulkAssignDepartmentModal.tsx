import MyInput from '@/components/MyInput';
import MyModal from '@/components/MyModal/MyModal';
import { useAppDispatch } from '@/hooks';
import { useUpdateDiagnosticOrderTestMutation } from '@/services/diagnosic-order/diagnosticOrderTestService';
import { useGetDepartmentByTypeAndFacilityAndActiveQuery } from '@/services/security/departmentService';
import { extractPaginationFromLink } from '@/utils/paginationHelper';
import { notify } from '@/utils/uiReducerActions';
import { skipToken } from '@reduxjs/toolkit/query';
import React, { useEffect, useState } from 'react';
import { Form } from 'rsuite';

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  selectedRows: number[];
  orderTests: any[];
  onSuccess: () => void;
  facilityId?: number | string;
};

const resolveReceivedType = (test: any) => {
  if (test?.type === 'LABORATORY') {
    return 'LABORATORY';
  }
  if (test?.type === 'RADIOLOGY') {
    return 'RADIOLOGY';
  }
  if (test?.type === 'PATHOLOGY') {
    return 'PATHOLOGY';
  }
  return '';
};

const BulkAssignDepartmentModal = ({
  open,
  setOpen,
  selectedRows,
  orderTests,
  onSuccess,
  facilityId
}: Props) => {
  const dispatch = useAppDispatch();
  const [updateOrderTest] = useUpdateDiagnosticOrderTestMutation();

  const [record, setRecord] = useState<{
    receivedDepartmentId?: number;
  }>({});

  const [receivedType, setReceivedType] = useState<string>('');

  useEffect(() => {
    const firstTest = orderTests?.[0]?.test;
    const resolved = resolveReceivedType(firstTest);
    setReceivedType(resolved);
  }, [orderTests]);

  const [deptPage, setDeptPage] = useState(0);

  const { data: receivedLabList } = useGetDepartmentByTypeAndFacilityAndActiveQuery(
    receivedType && facilityId
      ? { type: receivedType, facilityId, page: deptPage, size: 10 }
      : skipToken
  );

  const resolveOrderTestType = (row: any): string | null => {
    return row?.orderType ?? row?.test?.type ?? row?.testType ?? null;
  };

  const handleApply = async () => {
    if (!record.receivedDepartmentId) {
      dispatch(
        notify({
          msg: 'Please select received department',
          sev: 'warning'
        })
      );
      return;
    }

    const selectedTests = selectedRows
      .map(rowId => orderTests.find(t => Number(t.id ?? t.key) === Number(rowId)))
      .filter(Boolean);

    const distinctTypes = Array.from(
      new Set(selectedTests.map(resolveOrderTestType).filter(Boolean))
    );

    if (distinctTypes.length > 1) {
      dispatch(
        notify({
          msg: 'Selected Tests Should be Same Type as Selected Department',
          sev: 'warning'
        })
      );
      return;
    }

    try {
      await Promise.all(
        selectedTests.map(row =>
          updateOrderTest({
            id: row.id,
            body: {
              id: row.id,
              //add new patient edits
              orderId: row.orderId,
              testId: row.testId,
              receivedDepartmentId: Number(record.receivedDepartmentId),
              reason: row.reason,
              notes: row.notes
            }
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'Department assigned successfully', sev: 'success' }));
      setRecord({});
      setOpen(false);
      onSuccess();
    } catch (err: any) {
      dispatch(
        notify({
          msg: err?.data?.detail ?? err?.data?.message ?? 'Failed to assign department',
          sev: 'error'
        })
      );
    }
  };

  const [allDepartments, setAllDepartments] = useState([]);
  useEffect(() => {
    if (receivedLabList?.data) {
      setAllDepartments(prev =>
        deptPage === 0 ? receivedLabList.data : [...prev, ...receivedLabList.data]
      );
    }
  }, [receivedLabList]);

  const selectedTests = selectedRows
    .map(rowId => orderTests.find(t => Number(t.id ?? t.key) === Number(rowId)))
    .filter(Boolean);

  const types = Array.from(
    new Set(selectedTests.map(row => row?.orderType ?? row?.test?.type).filter(Boolean))
  );

  // Direction handling for RTL/LTR
  const direction = localStorage.getItem('direction') || 'LTR';
  const isRTL = direction === 'RTL';

  const dir = isRTL ? 'rtl' : 'ltr';

  return (
    <div dir={dir}>
      <MyModal
        open={open}
        setOpen={setOpen}
        title="Assign Received Lab"
        size="25vw"
        bodyheight="40vh"
        position="center"
        actionButtonFunction={handleApply}
        content={
          <Form fluid>
            <MyInput
              fieldType="selectPagination"
              fieldLabel="Select Department"
              fieldName="receivedDepartmentId"
              selectData={allDepartments}
              selectDataLabel="name"
              selectDataValue="id"
              record={record}
              setRecord={setRecord}
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
          </Form>
        }
      />
    </div>
  );
};

export default BulkAssignDepartmentModal;
