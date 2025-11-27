import React, { useEffect, useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

const FinancCostInfo = ({ product, setProduct, disabled, facilityCurrency }) => {


console.log("💰 facilityCurrency inside Financial Tab:", facilityCurrency);
console.log("💵 product.currency inside Financial Tab:", product.currency);


  useEffect(() => {
    if (facilityCurrency && !product.currency) {
      setProduct(prev => ({ ...prev, currency: facilityCurrency }));
    }
  }, [facilityCurrency]);

  return (
    <Form fluid>
      <div className='financ-cost-main-input-container'>

        <MyInput
          fieldLabel="Currency"
          fieldName="currency"
          fieldType="text"
          record={product}
          setRecord={setProduct}
          disabled={true}
          width={150}
        />

        <MyInput
          fieldLabel="Price per Base UOM"
          fieldName="pricePerBaseUom"
          fieldType="number"
          record={product}
          setRecord={setProduct}
          disabled={disabled}
        />

      </div>
    </Form>
  );
};



export default FinancCostInfo;