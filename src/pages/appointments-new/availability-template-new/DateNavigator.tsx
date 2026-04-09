

import MyButton from '@/components/MyButton/MyButton';
import React from 'react';
import { HiOutlineArrowSmallLeft } from "react-icons/hi2";
import { HiOutlineArrowSmallRight } from "react-icons/hi2";

type DateNavigatorProps = {
  from: Date;
  to?: Date;
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
};

const DateNavigator: React.FC<DateNavigatorProps> = ({
  from,
  to,
  currentDate,
  setCurrentDate,
}) => {
  const goPrev = () => {
    const prev = new Date(currentDate);
    prev.setDate(prev.getDate() - 1);

    if (!to) {
      setCurrentDate(prev);
      return;
    }

    if (prev < from) {
      setCurrentDate(new Date(to));
    } else {
      setCurrentDate(prev);
    }
  };

  const goNext = () => {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + 1);

    if (!to) {
      setCurrentDate(next);
      return;
    }

    if (next > to) {
      setCurrentDate(new Date(from));
    } else {
      setCurrentDate(next);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <MyButton prefixIcon={() => <HiOutlineArrowSmallLeft  color='black' size={20}/>} backgroundColor="var(--rs-border-primary)" onClick={goPrev}></MyButton>

      <span>
        {currentDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </span>

      <MyButton prefixIcon={() => <HiOutlineArrowSmallRight  color='black' size={20}/>} backgroundColor="var(--rs-border-primary)" onClick={goNext}></MyButton>
    </div>
  );
};

export default DateNavigator;
