import { useAppSelector } from '@/hooks';
import React, { useEffect, useState } from 'react';
import { Badge, Message, Tooltip, Whisper } from 'rsuite';
import Translate from '../Translate';

const MyLabel = props => {
  const [errorType, setErrorType] = useState(undefined);

  useEffect(() => {
    if (props.error) {
      if (props.error === 'ERROR') {
        setErrorType('ERROR');
      } else if (props.error === 'WARN') {
        setErrorType('WARN');
      } else if (Array.isArray(props.error)) {
        props.error.forEach(errorItem => {
          const validationType = errorItem.validationType;
          if (validationType === 'WARN' && !errorType) {
            setErrorType('WARN');
          } else if (validationType === 'REJECT') {
            setErrorType('ERROR');
          }
        });
      } else {
        setErrorType(undefined);
      }
    }
  }, [props.error]); 

  const labelStyle = () => {
    let fontSize = '15px';
    if (props.size) {
      switch (props.size) {
        case 'small':
          fontSize = '12px';
        case 'medium':
          fontSize = '15px';
        case 'large':
          fontSize = '18px';
        case 'larger':
          fontSize = '21px';
      }
    }

    return {
      fontSize,
      color: props.color,
    
    };
  };

  return (
    <>
      <Whisper
        open={props.tooltip ? undefined : false}
        placement="top"
        trigger="hover"
        speaker={
          <Tooltip arrow={false}>
            <Translate>{props.tooltip}</Translate>
          </Tooltip>
        }
      >
        <span style={{ margin: '1px' }}>
          {/* <Badge
            className={'label-placement'.concat(
              (props.error && errorType)
                ? ''
                : ' badge-hidden'
            )}
            color={errorType === 'ERROR' ? 'red' : errorType === 'WARN' ? 'orange' : 'blue'}
            content={errorType === 'ERROR' ? 'Error' : errorType === 'WARN' ? 'Warning' : undefined}
          >
            <span style={labelStyle()}>
              <Translate>{props.label}</Translate>
            </span>
          </Badge> */}
          <span style={labelStyle()}>
              <Translate>{props.label}</Translate>
            </span>
        </span>
      </Whisper>
    </>
  );
};

export default MyLabel;
