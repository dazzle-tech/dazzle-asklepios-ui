// TeleScreenSelectTests.tsx

import React, { useEffect, useState } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import TransferTestList from '../../encounter-component/diagnostics-order-new/TransferTestList';
import { initialListRequest, ListRequest } from '@/types/types';
import { useGetDiagnosticsTestListQuery } from '@/services/setupService';
import { newApDiagnosticOrders, newApDiagnosticOrderTests } from '@/types/model-types-constructor';
import { useGetDiagnosticOrderQuery, useSaveDiagnosticOrderMutation, useSaveDiagnosticOrderTestMutation } from '@/services/encounterService';
import { notify } from '@/utils/uiReducerActions';
import { useAppDispatch } from '@/hooks';



const TeleScreenSelectTests = ({ open, setOpen, patient, encounter }) => {
  const dispatch = useAppDispatch();
  const [leftItems, setLeftItems] = useState([]);
  const [selectedTestsList, setSelectedTestsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [orders, setOrders] = useState<any>({ ...newApDiagnosticOrders });
  const [searchType, setSearchType] = React.useState({ type: '' });

  
  const [listTestRequest, setListRequest] = useState<ListRequest>({
    ...initialListRequest,
    pageSize: 1000
  });
  const [executionNumber, setExecutionNumber] = useState('');
    const [approvalNumber, setApprovalNumber] = useState('');

  const { data: testsList, isFetching } = useGetDiagnosticsTestListQuery(listTestRequest);
   const [saveOrders, saveOrdersMutation] = useSaveDiagnosticOrderMutation();
  const [saveOrderTests, saveOrderTestsMutation] = useSaveDiagnosticOrderTestMutation();
   const [listOrdersRequest, setListOrdersRequest] = useState<ListRequest>({
      ...initialListRequest,
      filters: [
        {
          fieldName: 'patient_key',
          operator: 'match',
          value: patient?.key
        },
        {
          fieldName: 'visit_key',
          operator: 'match',
          value: encounter?.key
        },
      ]
    });
  const { data: ordersList, refetch: ordersRefetch } =
      useGetDiagnosticOrderQuery(listOrdersRequest);
  useEffect(() => {
    if (testsList?.object) {
      setLeftItems(testsList.object);
      setSelectedTestsList([]);
    }
  }, [open, testsList]);
  useEffect(() => {
      const draftOrder = ordersList?.object?.find(order => order.saveDraft === true);
  
      if (draftOrder != null) {
        setOrders({ ...draftOrder });
      }
    }, [ordersList]);
  const handleSaveTests = async () => {
    setOpen(false);
 
    let orderKeyToUse = orders?.key;
    if(!orders.key){
          try {
            const response = await saveOrders({
              ...newApDiagnosticOrders,
              patientKey: patient.key,
              visitKey: encounter.key,
              statusLkey: '164797574082125',
              labStatusLkey: '6055029972709625',
              radStatusLkey: '6055029972709625',
              saveDraft: true,
               typeKey: '',
              catalogKey: '',
              categoryKey: "",
              proposedExecutionDate: null,
              executionNumber,
              approvalNumber
            });
             orderKeyToUse = response?.data?.key;
            dispatch(notify('Start New Order with ID:' + response?.data?.orderId));
            setOrders(response?.data);
          } catch (error) {
          }
      }
    try {
      await Promise.all(
        selectedTestsList.map(item =>
          saveOrderTests({
            ...newApDiagnosticOrderTests,
            patientKey: patient.key,
            visitKey: encounter?.key,
            orderKey: orderKeyToUse, 
            testKey: item?.key,
            statusLkey: '164797574082125',
            processingStatusLkey: '6055029972709625',
            orderTypeLkey: item?.testTypeLkey
          }).unwrap()
        )
      );

      dispatch(notify({ msg: 'All Tests Saved Successfully', sev: 'success' }));

    } catch (error) {
      dispatch(notify({ msg: 'Save Failed', sev: 'error' }));
    }
  };

      // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Select Tests"
      actionButtonFunction={handleSaveTests}
      size="50vw"
      content={<div dir={dir}>
        <TransferTestList
          open={open}
          leftItems={leftItems}
          rightItems={selectedTestsList}
          setLeftItems={setLeftItems}
          setRightItems={setSelectedTestsList}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}

          searchType={searchType}
          setSearchType={setSearchType}
          isFetching={isFetching}
        /> </div>
      }
    />
  );
};

export default TeleScreenSelectTests;
