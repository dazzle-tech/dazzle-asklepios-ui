import React from 'react';
import { Button } from 'rsuite';
import './styles.less';
import { useSelector } from 'react-redux';
import Translate from '../Translate';

type Appearance = 'primary' | 'default' | 'link' | 'subtle' | 'ghost';

type MyButtonProps = {
  prefixIcon?: React.ElementType | null;
  postfixIcon?: React.ElementType | null;
  children?: React.ReactNode;
  onClick?: () => void;
  appearance?: Appearance;
  size?: 'lg' | 'md' | 'sm' | 'xs' | string;
  loading?: boolean;
  color?: string;
  backgroundColor?: string;
  width?: string | number;
  radius?: string | number;
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
};

const MyButton: React.FC<MyButtonProps> = ({
  prefixIcon: Prefix = null,
  postfixIcon: Postfix = null,
  children = null,
  onClick = () => {},
  appearance = 'primary',
  size = 'small',
  loading = false,
  color = 'var(--primary-blue)',
  backgroundColor,
  width,
  radius,
  ...props
}: MyButtonProps) => {
  const mode = useSelector((state: any) => state.ui.mode);

  return (
    <Button
      className={`bt ${size} ${mode}`}
      appearance={appearance}
      disabled={props.disabled}
      style={{
        color:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? color
            : 'white',
        width,
        borderRadius: radius,
        backgroundColor:
          appearance === 'ghost' || appearance === 'link' || appearance === 'subtle'
            ? 'transparent'
            : backgroundColor ?? 'var(--primary-blue)',
        border: appearance === 'ghost' ? `2px solid ${color}` : 'none',
        ...props.style
      }}
      {...props}
      onClick={onClick}
      loading={loading}
    >
      {Prefix && <Prefix style={{ marginRight: '8px', color: 'inherit' }} />}
      {children && <Translate>{children}</Translate>}
      {Postfix && <Postfix style={{ marginLeft: '8px', color: 'inherit' }} />}
    </Button>
  );
};

export default MyButton;