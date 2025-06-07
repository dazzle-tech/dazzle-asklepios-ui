import React from 'react';
import { Button } from 'rsuite';
import './styles.less';
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

  return (
    <Button
      className={`bt ${size}`}
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
            ? 'white'
            : props.backgroundColor ?? 'var(--primary-blue)',
        border:
          appearance === 'ghost' ? `2px solid ${props.color ?? 'var(--primary-blue)'}` : 'none',
      
      }}
      {...props}
      onClick={onClick}
       loading={loading}
    >
      {Prefix && <Prefix style={{ marginRight: '8px' }} />}

      {children && children}

      {Postfix && <Postfix style={{ marginLeft: '8px' }} />}
    </Button>
  );
};

export default MyButton;
