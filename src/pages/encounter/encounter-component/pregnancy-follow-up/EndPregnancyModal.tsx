import React, { useState, useEffect } from 'react';
import MyModal from '@/components/MyModal/MyModal';
import MyInput from '@/components/MyInput';
import { Form, RadioGroup, Radio } from 'rsuite';
import { useGetLovValuesByCodeQuery } from '@/services/setupService';
import './Style.less';

interface BabyData {
  liveDead: 'live' | 'dead' | null;
  gender: string | null;
  weight: number | null;
  height: number | null;
  headCircumference: number | null;
  length: number | null;
}

interface EndPregnancyData {
  reason: string | null;
  date: string;
  weeks: number | null;
  deliveryMethod: string | null;
  anesthesia: string | null;
  additionalInfo: string;
  numberOfBabies: number | null;
  babies: BabyData[];
}

interface EndPregnancyModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSave?: (data: EndPregnancyData) => void;
  lmpDate?: string;
}

const calculateWeeksFromLMP = (lmp?: string): number | null => {
  if (!lmp) return null;
  const start = new Date(lmp);
  const today = new Date();
  const diffMs = Math.max(0, today.getTime() - start.getTime());
  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
};

const EndPregnancyModal: React.FC<EndPregnancyModalProps> = ({
  open,
  setOpen,
  onSave,
  lmpDate
}) => {
  const [data, setData] = useState<EndPregnancyData>({
    reason: null,
    date: '',
    weeks: lmpDate ? calculateWeeksFromLMP(lmpDate) : null,
    deliveryMethod: null,
    anesthesia: null,
    additionalInfo: '',
    numberOfBabies: null,
    babies: []
  });

  const { data: reasonLov } = useGetLovValuesByCodeQuery('END_PREGNANCY_REASON');
  const { data: deliveryLov } = useGetLovValuesByCodeQuery('BIRTH_METHOD');
  const { data: anesthesiaLov } = useGetLovValuesByCodeQuery('ANESTH_TYPES');
  const { data: genderLov } = useGetLovValuesByCodeQuery('GNDR');

  const reasonOptions = reasonLov?.object || [];
  const deliveryOptions = deliveryLov?.object || [];
  const anesthesiaOptions = anesthesiaLov?.object || [];
  const genderOptions = genderLov?.object || [];

  useEffect(() => {
    if (open) {
      setData({
        reason: null,
        date: '',
        weeks: lmpDate ? calculateWeeksFromLMP(lmpDate) : null,
        deliveryMethod: null,
        anesthesia: null,
        additionalInfo: '',
        numberOfBabies: null,
        babies: []
      });
    }
  }, [open, lmpDate]);

  useEffect(() => {
    if (lmpDate) {
      setData(prev => ({ ...prev, weeks: calculateWeeksFromLMP(lmpDate) }));
    }
  }, [lmpDate]);

  useEffect(() => {
    if (!data.numberOfBabies || data.numberOfBabies <= 0) {
      if (data.babies.length !== 0) {
        setData(prev => ({ ...prev, babies: [] }));
      }
      return;
    }

    const newBabies: BabyData[] = Array.from({ length: data.numberOfBabies }, (_, i) => {
      return (
        data.babies[i] || {
          liveDead: null,
          gender: null,
          weight: null,
          height: null,
          headCircumference: null,
          length: null
        }
      );
    });

    if (newBabies.length !== data.babies.length) {
      setData(prev => ({ ...prev, babies: newBabies }));
    }
  }, [data.numberOfBabies]);

  const updateBabyField = (index: number, partial: Partial<BabyData>) => {
    const copy = [...data.babies];
    copy[index] = { ...copy[index], ...partial };
    setData(prev => ({ ...prev, babies: copy }));
  };

  const handleSave = () => {
    if (onSave) onSave(data);
    setOpen(false);
  };

  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="End Pregnancy"
      size="50vw"
      position="center"
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      content={
        <Form fluid layout="vertical" className="end-pregnancy-form">
          <div className="flex-row-each-one">
            <MyInput
              width={'20vw'}
              fieldName="reason"
              fieldType="select"
              fieldLabel="Reason"
              record={data}
              setRecord={setData}
              selectData={reasonOptions}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
            />

            <MyInput
              width={'20vw'}
              fieldName="date"
              fieldType="datetime"
              fieldLabel="Date"
              record={data}
              setRecord={setData}
            />
          </div>

          <div className="flex-row-each-one">
            <MyInput
              width={'20vw'}
              fieldName="weeks"
              fieldType="number"
              fieldLabel="Weeks"
              record={data}
              setRecord={setData}
              disabled
            />

            <MyInput
              width={'20vw'}
              fieldName="deliveryMethod"
              fieldType="select"
              fieldLabel="Delivery Method"
              record={data}
              setRecord={setData}
              selectData={deliveryOptions}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
            />
          </div>

          <div className="flex-row-each-one">
            <MyInput
              width={'20vw'}
              fieldName="anesthesia"
              fieldType="select"
              fieldLabel="Anesthesia"
              record={data}
              setRecord={setData}
              selectData={anesthesiaOptions}
              selectDataLabel="lovDisplayVale"
              selectDataValue="valueCode"
            />

            <MyInput
              width={'20vw'}
              fieldName="additionalInfo"
              fieldType="textarea"
              fieldLabel="Additional Info"
              record={data}
              setRecord={setData}
            />
          </div>
          <MyInput
            width={'20vw'}
            fieldName="numberOfBabies"
            fieldType="number"
            fieldLabel="Number of Babies"
            record={data}
            setRecord={setData}
            min={0}
            max={20}
          />
          {data.babies.map((baby, idx) => (
            <div key={idx} className="baby-info-block">
              <h5 className="baby-title">Baby {idx + 1}</h5>
              <div className='row-each-position-handler'>
                                           <div className='coulmn-each-position-handler-gndr-status'>
                   <Form.Group controlId={`liveDead-${idx}`}>
                  <RadioGroup
                  name={`liveDead-${idx}`}
                  value={baby.liveDead || ''}
                  onChange={val =>
                    updateBabyField(idx, { liveDead: val === 'live' ? 'live' : 'dead' })
                  }
                  inline
                >
                  <Radio value="live">Live</Radio>
                  <Radio value="dead">Dead</Radio>
                </RadioGroup>
              </Form.Group>
              <MyInput
                width={'13vw'}
                fieldName="gender"
                fieldType="select"
                fieldLabel="Gender"
                record={baby as any}
                setRecord={(newBaby: any) => updateBabyField(idx, { ...baby, ...newBaby })}
                selectData={genderOptions}
                selectDataLabel="lovDisplayVale"
                selectDataValue="valueCode"
              /></div>
                                                       <div className='coulmn-each-position-handler'>

              <MyInput
                width={'10vw'}
                fieldName="weight"
                fieldType="number"
                fieldLabel="Weight"
                rightAddon="g"
                record={baby as any}
                setRecord={(newBaby: any) => updateBabyField(idx, { ...baby, ...newBaby })}
                min={0}
              />
              <MyInput
                width={'10vw'}
                fieldName="height"
                fieldType="number"
                fieldLabel="Height"
                rightAddon="cm"
                record={baby as any}
                setRecord={(newBaby: any) => updateBabyField(idx, { ...baby, ...newBaby })}
                min={0}
              /></div>
                                           <div className='coulmn-each-position-handler'>

              <MyInput
                width={'10vw'}
                fieldName="headCircumference"
                fieldType="number"
                fieldLabel="Head Circumference"
                rightAddon="cm"
                record={baby as any}
                setRecord={(newBaby: any) => updateBabyField(idx, { ...baby, ...newBaby })}
                min={0}
              />
              <MyInput
                width={'10vw'}
                fieldName="length"
                fieldType="number"
                fieldLabel="Length"
                rightAddon="cm"
                record={baby as any}
                setRecord={(newBaby: any) => updateBabyField(idx, { ...baby, ...newBaby })}
                min={0}
              /></div>

           </div> </div>
          ))}
        </Form>
      }
    />
  );
};

export default EndPregnancyModal;
