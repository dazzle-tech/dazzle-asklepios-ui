import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Row } from 'rsuite';
import DrugFoodInteractions from './DrugFoodInteractions';
import DrugDrugInteractions from './DrugDrugInteractions';
import Section from '@/components/Section';
import Translate from '@/components/Translate';
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
            title={<Translate>Drug-Drug Interactions</Translate>}
            content={<DrugDrugInteractions activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
        <Col md={10}>
          <Section
            title={<Translate>Drug-Food Interactions</Translate>}
            content={<DrugFoodInteractions activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
      </Row>
    );
  } else {
    return (
      <div>
        <Section
          title={<Translate>Drug-Drug Interactions</Translate>}
          content={<DrugDrugInteractions activeIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
        <br />
        <Section
          title={<Translate>Drug-Food Interactions</Translate>}
          content={<DrugFoodInteractions activeIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
      </div>
    );
  }
};

export default DrugDrugAndFoodInteractions;
