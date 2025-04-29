import React from 'react';
import { faPerson } from '@fortawesome/free-solid-svg-icons';
import MyModal from '@/components/MyModal/MyModal';
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
            hideCanel={false}
            bodyheight={400}
            hideBack={true}
            steps={[{ title:"Body Diagram", icon: faPerson }]}
            hideActionBtn={true}
        />
    );
};
export default FullViewChart;