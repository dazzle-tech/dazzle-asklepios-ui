import React, { useEffect, useState } from 'react';
import { Col, Row } from 'rsuite';
import Section from '@/components/Section';
import AdversEffects from './AdversEffects';
import Toxicity from './Toxicity';

type Props = {
  activeIngredient: any;
};

const AdversEffectsAndToxicity: React.FC<Props> = ({ activeIngredient }) => {
  const [width, setWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

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
            title="Adverse Effects"
            content={<AdversEffects activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
          />
        </Col>
        <Col md={10}>
          <Section
            title="Toxicity"
            content={<Toxicity activeIngredients={activeIngredient} />}
            setOpen={() => {}}
            rightLink=""
            openedContent={null}
          />
        </Col>
      </Row>
    );
  }

  return (
    <div>
      <Section
        title="Adverse Effects"
        content={<AdversEffects activeIngredients={activeIngredient} />}
        setOpen={() => {}}
        rightLink=""
        openedContent={null}
      />
      <br />
      <Section
        title="Toxicity"
        content={<Toxicity activeIngredients={activeIngredient} />}
        setOpen={() => {}}
        rightLink=""
        openedContent={null}
      />
    </div>
  );
};

export default AdversEffectsAndToxicity;

