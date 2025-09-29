import React from 'react';
import MyInput from '@/components/MyInput';
import SectionContainer from '@/components/SectionsoContainer';
import '../style.less';

interface Props {
  record: any;
  setRecord: (value: any) => void;
}

const Measurements: React.FC<Props> = ({ record, setRecord }) => {
  return (
    <SectionContainer
      title="Measurements - M-mode / 2D"
      content={
        <div className="handle-inputs-positions-size">
          <div className="for-right-adons-position-align">
            <MyInput
              fieldLabel="LVEDD"
              fieldName="LVEDD"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="LVESD"
              fieldName="LVESD"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="IVS Thickness"
              fieldName="IVSThickness"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="Posterior Wall Thickness"
              fieldName="posteriorWallThickness"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="LVEF"
              fieldName="LVEF"
              fieldType="number"
              rightAddon="%"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="LV Mass Index"
              fieldName="LVMassIndex"
              fieldType="number"
              rightAddon="g/m²"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="LA Diameter"
              fieldName="LADiameter"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="RA Area"
              fieldName="RAArea"
              fieldType="number"
              rightAddon="cm²"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="RV Diameter"
              fieldName="RVDiameter"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
            <MyInput
              fieldLabel="Ascending Aorta Diameter"
              fieldName="ascendingAortaDiameter"
              fieldType="number"
              rightAddon="mm"
              width={160}
              record={record}
              setRecord={setRecord}
              rightAddonwidth={'auto'}
            />
          </div>
        </div>
      }
    />
  );
};

export default Measurements;
