import React, { useEffect, useState } from 'react';
import './styles.less';
import { Col, Row } from 'rsuite';
import MOA from './MOA';
import Pharmacokinetics from './Pharmacokinetics';
import Section from '@/components/Section';
import Translate from '@/components/Translate';
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
            title={<Translate>Pharmacokinetics</Translate>}
            content={<Pharmacokinetics activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
        <Col md={10}>
          <Section
            title={<Translate>MOA</Translate>}
            content={<MOA activeIngredients={activeIngredient} />}
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
          title={<Translate>Pharmacokinetics</Translate>}
          content={<Pharmacokinetics activeIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
        <br />
        <Section
          title={<Translate>MOA</Translate>}
          content={<MOA activeIngredients={activeIngredient} />}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
      </div>
    );
  }
};

export default MOAAndPharmacokinetics;
