import React from 'react';
import { useState, useRef, useEffect } from 'react';
import MyButton from '@/components/MyButton/MyButton';
import { FaArrowUp, FaArrowDown, FaMinus, FaChevronDown } from 'react-icons/fa';
import './UrgencyButton.less';

const UrgencyButton = () => {
  const [urgency, setUrgency] = useState<'high' | 'medium' | 'low' | null>(null);
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLDivElement | null>(null);

  const options = [
    { key: 'high', label: 'High', color: 'red', icon: <FaArrowUp /> },
    { key: 'medium', label: 'Medium', color: 'orange', icon: <FaMinus /> },
    { key: 'low', label: 'Low', color: 'green', icon: <FaArrowDown /> }
  ];

  const selected = options.find(opt => opt.key === urgency);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (btnRef.current && !btnRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="urgency-dropdown" ref={btnRef}>
      <MyButton
        className={`urgency-btn ${selected ? `urgency-${selected.key}` : ''}`}
        prefixIcon={() => (selected ? selected.icon : <FaChevronDown />)}
        onClick={() => setOpen(!open)}
      >
        {selected ? selected.label : 'Urgency'}
      </MyButton>

      {open && (
        <div className="urgency-menu">
          {options.map(opt => (
            <div
              key={opt.key}
              className="urgency-item"
              style={{ color: opt.color }}
              onClick={() => {
                setUrgency(opt.key as any);
                setOpen(false);
              }}
            >
              {opt.icon} {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UrgencyButton;
