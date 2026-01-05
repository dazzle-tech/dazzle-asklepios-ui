import React, { useState } from 'react';
import { Form, CheckboxGroup, Checkbox } from 'rsuite';
import MyInput from '@/components/MyInput';
import './AddChannelModal.less';
import MyModal from '@/components/MyModal/MyModal';
import Translate from '@/components/Translate';

type ChannelForm = {
  name: string;
  type: 'DEPARTMENT_POOL' | 'PRACTITIONER';
  facility?: string;
  department?: string;
  capacity: number;
  services?: string[];
  color?: string;
 
};

const channelTypeOptions = [
  { label: 'Department Pool', value: 'DEPARTMENT_POOL' },
  { label: 'Practitioner', value: 'PRACTITIONER' }
];

const serviceOptions = [
  { label: 'Vaccination', value: 'VACCINATION' },
  { label: 'Follow-up', value: 'FOLLOW_UP' },
  { label: 'Consultation', value: 'CONSULTATION' }
];

const AddChannelModal = ({
  record,
  setRecord,
   open,
  setOpen,
  // width,
  // resource,
  // setResource,
  // handleAddNew,
  // handleUpdate,
}: {
  record: any;
  setRecord: any;
   open: boolean;
  setOpen: any
}) => {
   const [currentColor, setCurrentColor] = useState(record?.color);
  // Modal content
    const conjureFormContent = (stepNumber = 0) => {
      switch (stepNumber) {
        case 0:
          return (
             <Form fluid className="add-channel-form">

       
       <MyInput
        column
        fieldName="name"
        fieldType="text"
        label="Channel Name"
        record={record}
        setRecord={setRecord}
        required
        width="100%"
      />
        <MyInput
          column
          fieldName="type"
          label="Channel Type"
          fieldType="select"
          record={record}
          setRecord={setRecord}
          selectData={channelTypeOptions}
          selectDataLabel="label"
          selectDataValue="value"
           width="100%"
          required
        />
       

      

      

      <div className="block">
        {/* <div className="label">
          Services Allowed <span className="muted">(optional)</span>
        </div> */}
        <Translate>Services Allowed(optional):</Translate>
        <CheckboxGroup
          inline
          value={record.services ?? []}
          onChange={(values) =>
            setRecord({ services: values as string[] })
          }
        >
          {serviceOptions.map(s => (
            <Checkbox key={s.value} value={s.value}>
              {s.label}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>

      <div className="block">
        <Translate>Channel Color</Translate> 

        <div className="color-picker-row">
            <input
            type="color"
            value={currentColor}
            onChange={e => {
                const nextColor = e.target.value;
                setCurrentColor(nextColor);
            }}
            />
            

          {/* <div
            className="color-preview"
            style={{ background: record.color ?? '#4C7EF3' }}
          /> */}

         
        </div>
        
      </div>
      <div className="help-text">
          Book into pool; assign practitioner near appointment time.
        </div>
    </Form>
          );
        default:
          return null;
      }
    };

  return( 
    <MyModal
                open={open}
                setOpen={setOpen}
                title="Add Channel"
                size="xs"
               content={conjureFormContent}
                actionButtonLabel="Add"
                // isDisabledActionBtn={
                //     !channelForm.name?.trim() || channelForm.capacity < 1
                // }
                actionButtonFunction={() => {
                    // const payload = {
                    //     name: channelForm.name.trim(),
                    //     color: channelForm.color
                    // };

                    // console.log('[AvailabilityDayGrid] onAddChannel payload:', payload);

                    // onAddChannel(payload);

                    // setChannelForm({
                    //     name: '',
                    //     type: 'DEPARTMENT_POOL',
                    //     facility: '',
                    //     department: '',
                    //     capacity: 1,
                    //     color: '#4C7EF3'
                    // });

                    // setOpenAddChannel(false);
                }}

            />
  )
};

export default AddChannelModal;
