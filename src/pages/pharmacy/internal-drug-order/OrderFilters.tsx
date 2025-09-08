import React from 'react';
import { Form } from 'rsuite';
import MyInput from '@/components/MyInput';
import AdvancedSearchFilters from '@/components/AdvancedSearchFilters';

const OrderFilters = ({ orderstatusLovQueryResponse }) => {
  return (
    <>
      <Form layout="inline" fluid className="filter-fields-pharmacey">
        <MyInput
          column
          fieldName="wardName"
          fieldLabel="Ward Name"
          record={{}}
          setRecord={{}}
          fieldType="select"
          selectData={[
            { label: 'ICU Ward A', value: 'icu_a' },
            { label: 'Cardiology Ward', value: 'cardiology' },
            { label: 'Pediatrics Ward', value: 'pediatrics' },
            { label: 'Emergency Ward', value: 'emergency' }
          ]}
          selectDataLabel="label"
          selectDataValue="value"
        />

        <MyInput
          column
          fieldType="select"
          fieldName="orderStatus"
          fieldLabel="Order Status"
          selectData={
            orderstatusLovQueryResponse?.object ?? [
              { lovDisplayVale: 'Pending', key: 'pending' },
              { lovDisplayVale: 'Partially Dispensed', key: 'partially_dispensed' },
              { lovDisplayVale: 'Dispensed', key: 'dispensed' },
              { lovDisplayVale: 'Cancelled', key: 'cancelled' }
            ]
          }
          selectDataLabel="lovDisplayVale"
          selectDataValue="key"
          record={{}}
          setRecord={{}}
        />

        <MyInput
          column
          fieldType="date"
          fieldLabel="From Date"
          fieldName="fromDate"
          record={{}}
          setRecord={{}}
          placeholder="Select start date"
        />

        <MyInput
          column
          fieldType="date"
          fieldLabel="To Date"
          fieldName="toDate"
          record={{}}
          setRecord={{}}
          placeholder="Select end date"
        />
      </Form>

      <AdvancedSearchFilters searchFilter={true} />
    </>
  );
};

export default OrderFilters;
