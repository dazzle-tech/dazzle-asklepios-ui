import React from 'react';
import { Button } from 'rsuite';
import './styles.less';
import { Box } from '@mui/material';
import { useSelector } from 'react-redux';
import Translate from '../Translate';
type Appearance = 'primary' | 'default' | 'link' | 'subtle' | 'ghost';
const MyButton = ({
  prefixIcon: Prefix = null,
  postfixIcon: Postfix = null,
  children: children = null,
  onClick = () => {},
  appearance = 'primary' as Appearance,
  size = 'small',
   loading = false,
  ...props
}) => {
 const mode = useSelector((state: any) => state.ui.mode);
  return (
    <Button
      className={`bt ${size} ${mode}`}
      appearance={appearance}
      disabled={props.disabled}
      style={{
        color:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? props.color ?? 'var(--primary-blue)'
            : 'white',

        width: props.width,
        borderRadius: props.radius,
        backgroundColor:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? 'transparent'
            : props.backgroundColor ?? 'var(--primary-blue)',
        border:
          appearance === 'ghost' ? `2px solid ${props.color ?? 'var(--primary-blue)'}` : 'none',
      
      }}
      {...props}
      onClick={onClick}
       loading={loading}
    >
      {Prefix && <Prefix c style={{ marginRight: '8px', color: 'inherit' }} />}

      {children && <Translate>{children}</Translate>}

      {Postfix && <Postfix style={{ marginLeft: '8px', color: 'inherit' }} />}
    </Button>
  );
};

export default MyButton;
