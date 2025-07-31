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
            content={<DrugDrugInteractions activeIngredients={activeIngredient} />}
          />
        </Col>
        <Col md={10}>
          <Section
            title="Drug-Food Interactions"
            content={<DrugFoodInteractions activeIngredients={activeIngredient} />}
          />
        </Col>
      </Row>
    );
  } else {
    return (
      <div>
        <Section
          title="Drug-Drug Interactions"
          content={<DrugDrugInteractions activeIngredients={activeIngredient} />}
        />
        <br />
        <Section
          title="Drug-Food Interactions"
          content={<DrugFoodInteractions activeIngredients={activeIngredient} />}
        />
      </div>
    );
  }
};

export default DrugDrugAndFoodInteractions;
