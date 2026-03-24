import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDollarSign,
  faChartLine,
  faShieldHeart,
  faPercent,
  faCreditCard
} from '@fortawesome/free-solid-svg-icons';
import './styles.less';

interface InsuranceBenefitsCardProps {
  data?: {
    remainingBenefits?: string;
    remailingDeductibles?: string;
    deductiblesValue?: string;
    coInsuranceValue?: string;
    coPaymentValue?: string;
  };
}

interface BenefitItem {
  icon: any;
  label: string;
  value?: string;
  color: string;
}

const InsuranceBenefitsCard: React.FC<InsuranceBenefitsCardProps> = ({ data = {} }) => {
  const benefits: BenefitItem[] = [
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

// Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  return (
    <div className="benefits-card" dir={dir}>
      <div className="benefits-card__header">
        <div className="benefits-card__header-icon">
          <FontAwesomeIcon icon={faShieldHeart} className="benefits-card__header-icon-svg" />
        </div>
        <div className="benefits-card__header-title">Benefits Overview</div>
      </div>

      <div className="benefits-card__list">
        {benefits.map((benefitItem, index) => (
          <div
            key={index}
            className={`benefits-card__item ${benefitItem.value ? 'benefits-card__item--has-value' : ''}`}
            style={{ '--item-color': benefitItem.color } as React.CSSProperties}
          >
            <div className="benefits-card__item-icon">
              <FontAwesomeIcon
                icon={benefitItem.icon}
                className="benefits-card__item-icon-svg"
              />
            </div>
            <div className="benefits-card__item-content">
              <div className="benefits-card__item-label">{benefitItem.label}</div>
              <div
                className={`benefits-card__item-value ${
                  benefitItem.value
                    ? 'benefits-card__item-value--filled'
                    : 'benefits-card__item-value--empty'
                }`}
              >
                {benefitItem.value || '—'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InsuranceBenefitsCard;