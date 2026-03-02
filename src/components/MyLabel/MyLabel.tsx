import React, { useEffect, useMemo, useState } from 'react';
import { Tooltip, Whisper } from 'rsuite';
import Translate from '../Translate';
import { useSelector } from 'react-redux';
import clsx from 'clsx';

type MyLabelProps = {
  label?: any;
  tooltip?: any;
  error?: any;
  size?: 'small' | 'medium' | 'large' | 'larger';
  color?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
};

const MyLabel: React.FC<MyLabelProps> = props => {
  const [errorType, setErrorType] = useState<'ERROR' | 'WARN' | undefined>(undefined);
  const mode = useSelector((state: any) => state.ui.mode);

  useEffect(() => {
    if (!props.error) {
      setErrorType(undefined);
      return;
    }

    if (props.error === 'ERROR') {
      setErrorType('ERROR');
      return;
    }

    if (props.error === 'WARN') {
      setErrorType('WARN');
      return;
    }

    if (Array.isArray(props.error)) {
      let next: 'ERROR' | 'WARN' | undefined = undefined;

      props.error.forEach((errorItem: any) => {
        const validationType = errorItem?.validationType;
        if (validationType === 'WARN' && !next) next = 'WARN';
        if (validationType === 'REJECT') next = 'ERROR';
      });

      setErrorType(next);
      return;
    }

    setErrorType(undefined);
  }, [props.error]);

  const fontSize = useMemo(() => {
    let fs = '13px';
    if (!props.size) return fs;

    switch (props.size) {
      case 'small':
        return '12px';
      case 'medium':
        return '14px';
      case 'large':
        return '18px';
      case 'larger':
        return '21px';
      default:
        return fs;
    }
  }, [props.size]);

  const labelStyle = useMemo<React.CSSProperties>(() => {
    return {
      fontSize,
      color: props.color,
      ...(props.style ?? {})
    };
  }, [fontSize, props.color, props.style]);

  return (
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
      <span className={clsx('my-label', props.className, mode === 'light' ? 'light' : 'dark')}>
        <span style={labelStyle}>
          <Translate>{props.label}</Translate>
          {props.required && <span className="required-field"> *</span>}
        </span>

        {/* optional: if you want to visually indicate error/warn on label, you can use errorType here */}
        {/* <span className={clsx('my-label__badge', errorType && `is-${errorType.toLowerCase()}`)} /> */}
      </span>
    </Whisper>
  );
};

export default MyLabel;
