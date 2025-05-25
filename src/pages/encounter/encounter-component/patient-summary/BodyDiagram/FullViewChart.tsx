import React from 'react';
import { faPerson } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const FullViewChart = ({ 
    open, 
    setOpen, 
    content
}) => {
    return (
        <MyModal
            open={open}
            setOpen={setOpen}
            title="Body Diagram"
            content={content}
            hideCancel={false}
            bodyheight="60vh"
            hideBack={true}
            steps={[{ title:"Body Diagram", icon:  <FontAwesomeIcon icon={faPerson }/>}]}
            hideActionBtn={true}
        />
    );
};
export default FullViewChart;