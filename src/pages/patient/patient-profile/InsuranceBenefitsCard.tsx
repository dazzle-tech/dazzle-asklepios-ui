import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faChartLine,
  faShieldHeart,
  faPercent,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';

interface InsuranceBenefitsCardProps {
  data?: {
    remainingBenefits?: string;
    remailingDeductibles?: string;
    deductiblesValue?: string;
    coInsuranceValue?: string;
    coPaymentValue?: string;
  };
}

const InsuranceBenefitsCard: React.FC<InsuranceBenefitsCardProps> = ({ data = {} }) => {
  const benefits = [
    {
      icon: faDollarSign,
      label: 'Remaining Benefits',
      value: data.remainingBenefits,
      color: '#10b981'
    },
    {
      icon: faShieldHeart,
      label: 'Remaining Deductibles',
      value: data.remailingDeductibles,
      color: '#3b82f6'
    },
    {
      icon: faChartLine,
      label: 'Deductibles Value',
      value: data.deductiblesValue,
      color: '#8b5cf6'
    },
    {
      icon: faPercent,
      label: 'Co-Insurance Value',
      value: data.coInsuranceValue,
      color: '#f59e0b'
    },
    {
      icon: faCreditCard,
      label: 'Co-Payment Value',
      value: data.coPaymentValue,
      color: '#ec4899'
    }
  ];


  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e5e7eb',
        height: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '2px solid #f3f4f6'
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
          }}
        >
          <FontAwesomeIcon icon={faShieldHeart} style={{ fontSize: '16px' }} />
        </div>
        <div
          style={{
            fontSize: '14px',
            fontWeight: '600',
            color: '#1f2937'
          }}
        >
          Benefits Overview
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {benefits.map((item, index) => {
          return (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 10px',
                backgroundColor: '#fafafa',
                borderRadius: '8px',
                border: '1px solid #f0f0f0',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                if (item.value) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.borderColor = item.color + '40';
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundColor = '#fafafa';
                e.currentTarget.style.borderColor = '#f0f0f0';
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  backgroundColor: item.color + '15',
                  color: item.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FontAwesomeIcon icon={item.icon} style={{ fontSize: '14px' }} />
              </div>
              <div
                style={{
                  flex: 1,
                  minWidth: 0
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    marginBottom: '2px',
                    fontWeight: '500'
                  }}
                >
                  {item.label}
                </div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: item.value ? '#111827' : '#d1d5db',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.value || '—'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsuranceBenefitsCard;
