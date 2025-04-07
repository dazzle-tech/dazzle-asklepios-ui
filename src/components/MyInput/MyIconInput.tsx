import { camelCaseToLabel } from '@/utils';
import React from 'react';
import { Form, SelectPicker} from 'rsuite';
import MyLabel from '../MyLabel';
import Translate from '../Translate';
import * as icons from 'react-icons/fa6';
import {iconsAsText} from '../../styles/icons-as-text';
import { Icon } from '@rsuite/icons';
import './styles.less';

const MyIconInput = ({ fieldName, fieldType = 'text', record, setRecord, ...props }) => {
  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);

  const handleValueChange = value => {
    setRecord({ ...record, [fieldName]: value });
  };
  
  return (
    <>
      <Form.Group>
        <Form.ControlLabel>
          <MyLabel label={fieldLabel} />
        </Form.ControlLabel>
        <Form.Control
        className="icons-list" 
          block
          virtualized
          style={{ width: props?.width}} //baaaaack
          accepter={SelectPicker}
          name={fieldName}
          data={iconsAsText}
          labelKey='icon'
          valueKey='icon'
          renderMenuItem={(label, item) => {
            return (
              <div>
                <Icon as={icons[label]} /> {label}
              </div>
            );
          }}
          renderValue={(value, item) => {
            return (
              <div>
                <Icon as={icons[value]} /> {value}
              </div>
            );
          }}
          value={record[fieldName]}
          onChange={handleValueChange}
        />
        {props.required && (
          <Form.HelpText>
            <Translate>{fieldLabel}</Translate> <Translate>is required</Translate>
          </Form.HelpText>
        )}
      </Form.Group>
    </>
  );
};

export default MyIconInput;
