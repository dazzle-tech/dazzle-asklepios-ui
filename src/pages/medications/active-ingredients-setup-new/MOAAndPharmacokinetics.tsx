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

            // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';


  if (width > 860) {
    return (
      <Row>
        <Col md={14}>
          <Section
            title="Pharmacokinetics"
            content={<div dir={dir}><Pharmacokinetics activeIngredients={activeIngredient} /></div>}
            setOpen={() => {}}
            rightLink=""
            openedContent=""
          />
        </Col>
        <Col md={10}>
          <Section
            title="MOA"
            content={<div dir={dir}><MOA activeIngredients={activeIngredient} /></div>}
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
          title="Pharmacokinetics"
          content={<div dir={dir}><Pharmacokinetics activeIngredients={activeIngredient} /></div>}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
        <br />
        <Section
          title="MOA"
          content={<div dir={dir}><MOA activeIngredients={activeIngredient} /></div>}
          setOpen={() => {}}
          rightLink=""
          openedContent=""
        />
      </div>
    );
  }
};

export default MOAAndPharmacokinetics;
