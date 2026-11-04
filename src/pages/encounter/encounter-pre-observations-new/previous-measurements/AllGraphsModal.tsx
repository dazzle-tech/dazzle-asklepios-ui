import React from 'react';
import { faChartLine } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import MyModal from '@/components/MyModal/MyModal';
import AllGraphsTab from './AllGraphsTab';

type Props = {
    open: boolean;
    setOpen: (value: boolean) => void;
    patient: any;
};

const AllGraphsModal = ({
    open,
    setOpen,
    patient
}: Props) => {

    // Direction handling for RTL/LTR
    const direction = localStorage.getItem('direction') || 'LTR';
    const isRTL = direction === 'RTL';

    const dir = isRTL ? 'rtl' : 'ltr';

    return (
        <div dir={dir}>
            <MyModal
                open={open}
                setOpen={setOpen}
                title="Patient Measurements"

                size="90vw"
                bodyheight="80vh"

                hideActionBtn
                hideCancel

                steps={[
                    {
                        title: 'Graphs',
                        icon: (
                            <FontAwesomeIcon
                                icon={faChartLine}
                            />
                        )
                    }
                ]}

                content={
                    <div>
                        <AllGraphsTab
                            patient={patient}
                        />
                    </div>
                }
            />
        </div>
    );
};

export default AllGraphsModal;