import React from 'react';
import './styles.less';
import MyTable from '@/components/MyTable';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';
import MyButton from '@/components/MyButton/MyButton';
import * as icons from '@rsuite/icons';
const PreviousMeasurements = ({patient }) => {
      const filters = () => {
        return (
          <Form layout="inline" fluid>
            <MyInput
              column
              width={180}
              fieldType="date"
              fieldLabel="Date"
              fieldName=""
              record={""}
              setRecord={"setDateFilter"}
            />
              <MyButton>
                <icons.Search />
              </MyButton>
          </Form>
        );
      };
    // Table Column
    const columns = [
        {
            key: '',
            title: 'Date',
        },
        {
            key: '',
            title: 'weight',
        },
        {
            key: '',
            title: 'height',  
        },
        {
            key: '',
            title: 'temperature',
        },
        {
            key: '',
            title: 'pulse rate',
            dataKey: '',
        },
        {
            key: '',
            title: 'blood pressure',
        },
        {
            key: '',
            title: 'blood glucose',
        },
          {
            key: '',
            title: 'oxygen saturation',
        }
    ];
    return (<div>
        <MyTable
            data={[]}
            columns={columns}
            filters={()=>filters()}
        />
    </div>);
};
export default PreviousMeasurements;