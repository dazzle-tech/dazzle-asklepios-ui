import React from 'react';
import './styles.less';
import { Text, IconButton, Button } from 'rsuite';
import { FaHandBackFist } from 'react-icons/fa6';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFingerprint, faHandPointUp } from '@fortawesome/free-solid-svg-icons';
import { useSelector } from 'react-redux';
// import OthersIcon from '@rsuite/icons/legacy/Others'; 

const InfoCardList = ({
  list,
  fields,
  fieldLabels = {},
  titleField = null,
  computedFields = {},
  onCardClick = (item: any) => {},
  variant = '',
  showOpenButton = false
}) => {
  const containerClass = `div-list ${variant === 'product-grid' ? 'product-card-grid' : ''}`;
  const mode = useSelector((state: any) => state.ui.mode);
  const getFieldValue = (item, field) => {
    if (computedFields[field]) {
      return computedFields[field](item);
    }

    if (field?.endsWith('Lkey')) {
      const baseField = field.replace(/Lkey$/, '');
      const lvalueField = `${baseField}Lvalue`;
      return item[lvalueField]?.lovDisplayVale || '';
    }
    return item[field];
  };

  const getLabel = (field) => fieldLabels[field] || field;

  return (
    <div className={containerClass}>
      {list?.map((item, index) => (
        <div key={index} className={`card-style ${mode === 'light' ? 'light' : 'dark'}`} onClick={() => onCardClick(item)}>
          <Text className='title-style'>
            {getFieldValue(item, titleField)}
          </Text>
          <div className='div-layout'>
            {fields.map((field, i) => (
              <div key={i} className='field-contant'>
                <Text className='label-style'>{getLabel(field)}</Text>
                <Text className='value-style'>{getFieldValue(item, field)}</Text>
              </div>
            ))}
          </div>
          {showOpenButton && (
            <div className="actions">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  onCardClick(item);
                }}
                className="arrow-button"
              >
                <FontAwesomeIcon icon={faHandPointUp} />
              </Button>
            </div>
          )}
        </div>
      ))}


    </div>
  );
};

export default InfoCardList;