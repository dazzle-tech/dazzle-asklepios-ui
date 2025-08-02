import MyModal from '@/components/MyModal/MyModal';
import React from 'react';
import { Form, Radio, RadioGroup } from 'rsuite';
import { faPills } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import "./styles.less";
const ActionModal = ({ open, setOpen, handleSave, width, icons }) => {

  // modal content
  const conjureFormContent = stepNumber => {
    switch (stepNumber) {
      case 0:
        return (
          <Form fluid>
            <RadioGroup>
              {icons.map((item, index) => {
                  if(item.key != "1"){
                  return(
                  <Radio value={item.key} key={index} >
                    <div className='container-of-icon-and-key'>
                    <>{item.icon}</>
                    <span>{item.title}</span>
                    </div>
                  </Radio>
                  );
                  }
              })}
            </RadioGroup>
          </Form>
        );
    }
  };
  return (
    <MyModal
      open={open}
      setOpen={setOpen}
      title="Action"
      position="right"
      content={conjureFormContent}
      actionButtonLabel="Save"
      actionButtonFunction={handleSave}
      size={width > 600 ? '30vw' : '50vw'}
      steps={[{ title: 'Action', icon: <FontAwesomeIcon icon={faPills} /> }]}
    />
  );
};
export default ActionModal;
