import React from 'react';
import { FaArrowLeft } from 'react-icons/fa6';
import MyButton from '../MyButton/MyButton';
type Appearance = 'ghost' | 'default';

interface BackButtonProps {
  text?: string;
  onClick: () => void;
  appearance?: Appearance,
}
const BackButton = ({ text = 'Go Back', onClick, appearance = "default" }: BackButtonProps) => {
  return (
    <MyButton
      prefixIcon={() => <FaArrowLeft />}
      backgroundColor={'var(--primary-gray)'}
      appearance={appearance}
      onClick={onClick}
    >
      {text}
    </MyButton>
  );
};

export default BackButton;
