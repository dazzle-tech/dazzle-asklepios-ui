import React from 'react';
import './styles.less';
import {
  
    Text,
    
  } from 'rsuite';
const InfoCardList = ({ list
    , fields
    , fieldLabels = {}
    ,titleField:titleField=null }) => {
console.log(list)
    const getFieldValue = (item, field) => {
        if (field?.endsWith('Lkey')) {
            const baseField = field.replace(/Lkey$/, '');
            const lvalueField = `${baseField}Lvalue`;

            return item[lvalueField]?.lovDisplayVale || '';
        }
        return item[field];
    };
    const getLabel = (field) => fieldLabels[field] || field;
    return (
        <div className='div-list'>
            {list?.map((item, index) => (
                <div
                    key={index}
                  className='card-style'
                >
                    <Text
                    className='title-style'
                    >
                      {getFieldValue(item,titleField)}
                    </Text>
                    <div
                       className='div-layout'
                    >
                        {fields.map((field, i) => ( 
                            <div key={i} className='field-contant'>
                                <Text  className='label-style' >{getLabel(field)}</Text>
                                <Text className='value-style' >{getFieldValue(item, field)}</Text>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default InfoCardList;
