import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Row } from 'rsuite';
import MOA from './MOA';
import Pharmacokinetics from './Pharmacokinetics';
import Section from '@/components/Section';
const MOAAndPharmacokinetics = ({ activeIngredient }) => {
  const [width, setWidth] = useState<number>(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (width > 860) {
    return (
      <Row>
        <Col md={14}>
          <Section
            title="Pharmacokinetics"
            content={<Pharmacokinetics activeIngredients={activeIngredient} />}
          />
        </Col>
        <Col md={10}>
          <Section title="MOA" content={<MOA activeIngredients={activeIngredient} />} />
        </Col>
      </Row>
    );
  } else {
    return (
      <div>
        <Section
          title="Pharmacokinetics"
          content={<Pharmacokinetics activeIngredients={activeIngredient} />}
        />
        <br />
        <Section title="MOA" content={<MOA activeIngredients={activeIngredient} />} />
      </div>
    );
  }
};

export default MOAAndPharmacokinetics;
