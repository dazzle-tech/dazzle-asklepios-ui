import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Row } from 'rsuite';
import DrugFoodInteractions from './DrugFoodInteractions';
import DrugDrugInteractions from './DrugDrugInteractions';
import Section from '@/components/Section';
const DrugDrugAndFoodInteractions = ({ activeIngredient }) => {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width > 1000) {
    return (
      <Row>
        <Col md={14}>
          <Section
            title="Drug-Drug Interactions"
            content={<DrugDrugInteractions selectedActiveIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
        <Col md={10}>
          <Section
            title="Drug-Food Interactions"
            content={<DrugFoodInteractions selectedActiveIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
      </Row>
    );
  } else {

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


    return (
      <div dir={dir}>
        <Section
          title="Drug-Drug Interactions"
          content={<div dir={dir}><DrugDrugInteractions selectedActiveIngredients={activeIngredient} /></div>}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
        <br />
        <Section
          title="Drug-Food Interactions"
          content={<div dir={dir}><DrugFoodInteractions activeIngredients={activeIngredient} /></div>}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
      </div>
    );
  }
};

export default DrugDrugAndFoodInteractions;
