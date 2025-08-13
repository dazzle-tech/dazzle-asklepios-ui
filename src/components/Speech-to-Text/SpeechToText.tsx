import React from 'react';
import MyInput from '../MyInput';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone } from '@fortawesome/free-solid-svg-icons';
import MyButton from '../MyButton/MyButton';
import Translate from '../Translate';
import { camelCaseToLabel } from '@/utils';
import './styles.less';

const SpeechToText = ({ record, setRecord, fieldName, ...props }) => {
  const fieldLabel = props?.fieldLabel ?? camelCaseToLabel(fieldName);
  
  // handle clear textarea
  const handleClear = () => {
    setRecord({ ...record, [fieldName]: '' });
  };
  return (
    <div
      className="container-of-speech-to-text"
      style={{
        width: props?.width ?? 200
      }}
    >
      <div className="container-of-header-speech-to-text">
        <Translate>{fieldLabel}</Translate>
        <FontAwesomeIcon icon={faMicrophone} className="icons-style" />
      </div>

      <MyInput
        fieldType="textarea"
        fieldName={fieldName}
        record={record}
        setRecord={setRecord}
        width={props?.width ?? 200}
        showLabel={false}
      />
      <div className="container-of-button-speech-to-text">
        <MyButton appearance="ghost" color="#787777ff" onClick={handleClear}>
          Clear
        </MyButton>
      </div>
    </div>
  );
};

export default SpeechToText;
