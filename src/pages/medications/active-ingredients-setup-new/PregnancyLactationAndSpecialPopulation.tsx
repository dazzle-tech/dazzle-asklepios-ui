import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Row } from 'rsuite';
import PregnancyLactation from './PregnancyLactation';
import SpecialPopulation from './SpecialPopulation';
import Section from '@/components/Section';
const PregnancyLactationAndSpecialPopulation = ({ activeIngredient }) => {
  const [width, setWidth] = useState<number>(window.innerWidth);

  // Effects
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width > 860) {
    return (
      <Row>
        <Col md={12}>
          <Section
            title="Pregnancy & Lactation"
            content={<PregnancyLactation activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
        <Col md={12}>
          <Section
            title="Special Population"
            content={<SpecialPopulation selectedActiveIngredients={activeIngredient} />}
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
          title="Pregnancy & Lactation"
          content={<PregnancyLactation activeIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
        <br />
        <Section
          title="Special Population"
          content={<SpecialPopulation selectedActiveIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
      </div>
    );
  }
};

export default PregnancyLactationAndSpecialPopulation;
