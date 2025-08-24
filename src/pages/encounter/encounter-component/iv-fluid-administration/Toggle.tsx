import React, { useState } from 'react';
import MyInput from '@/components/MyInput';
import { Form } from 'rsuite';

const Toggle = () => {
  const [formRecord, setFormRecord] = useState({ anyReaction: false, reaction: '' });
  const [showTagField, setShowTagField] = useState(false);

  return (
    <Form fluid>
      <div className="flexing">
        {/* Checkbox */}
        <MyInput
          fieldType="checkbox"
          fieldName="anyReaction"
          fieldLabel="Any Reaction"
          width={100}
          record={formRecord}
          setRecord={val => {
            setFormRecord(val);
            setShowTagField(val.anyReaction === true);
          }}
        />

        {/* Tag field */}
        {showTagField && (
          <div className="margin-but">
            <MyInput
              fieldType="text"
              fieldName="reaction"
              fieldLabel="Reactions"
              placeholder="Enter tag"
              record={formRecord}
              setRecord={setFormRecord}
              width={200}
            />
          </div>
        )}
      </div>
    </Form>
  );
};

export default Toggle;
