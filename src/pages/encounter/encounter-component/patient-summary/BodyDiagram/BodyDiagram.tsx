import React, { useState } from 'react';
import { Divider } from 'rsuite';
import '../styles.less'
import ChildBoy from '../../../../../images/Chart_Child_Boy.svg';
import ChildGirl from '../../../../../images/Chart_Child_Girl.svg';
import Female from '../../../../../images/Chart_Female.svg';
import Male from '../../../../../images/Chart_Male.svg';
import { useGetAgeGroupValueQuery } from '@/services/patientService';
import FullViewChart from './FullViewChart';

const BodyDiagram = ({ patient }) => {
    const [chartModelIsOpen, setChartModelIsOpen] = useState(false);

    // Handle Open Chart Modal Function
    const handleopenchartModel = () => { setChartModelIsOpen(true); };

    // Fetch patient's age group based on their date of birth
    const { data: patientAgeGroupResponse, refetch: patientAgeGroupRefetch } =
        useGetAgeGroupValueQuery(
            {
                dob: patient?.dob ? new Date(patient.dob).toISOString() : null
            },
            { skip: !patient?.dob }
        );
   
    // Render appropriate body image based on patient's age group and gender
    const content = (
        <>
            {
                (patientAgeGroupResponse?.object?.valueCode=== 'AG_INFANT' ||
                    patientAgeGroupResponse?.object?.valueCode === 'AG_CHILD' ||
                    patientAgeGroupResponse?.object?.valueCode=== 'AG_ADOLS' ||
                    patientAgeGroupResponse?.object?.valueCode === 'AG_TODDLER' ||
                    patientAgeGroupResponse?.object?.valueCode=== 'AG_NEONATE')
                && (
                    patient?.genderLkey === '1' ? (
                        <img className='image-style' src={ChildBoy} onClick={handleopenchartModel} />
                    ) : (
                        <img className='image-style' src={ChildGirl} onClick={handleopenchartModel} />
                    )
                )
            }
            {
                (patientAgeGroupResponse?.object?.valueCode === 'AG_ADULT' ||

                    patientAgeGroupResponse?.object?.valueCode=== 'AG_GER')
                && (
                    patient?.genderLkey === '1' ? (
                        <img className='image-style' src={Male} onClick={handleopenchartModel} />
                    ) : (
                        <img className='image-style' src={Female} onClick={handleopenchartModel} />
                    )
                )
            }
        </>
    );
    return (
        <div className='medical-dashboard-main-container'>
            <div className='medical-dashboard-container-div'>
                <div className='medical-dashboard-header-div'>
                    <div className='medical-dashboard-title-div'>
                        Body Diagram
                    </div>
                </div>
                <Divider className="divider-line" />
                <div className='medical-dashboard-table-div'>
                    {content}
                </div>
            </div>
            <FullViewChart open={chartModelIsOpen} setOpen={setChartModelIsOpen} content={content} />
        </div>
    );
};
export default BodyDiagram;