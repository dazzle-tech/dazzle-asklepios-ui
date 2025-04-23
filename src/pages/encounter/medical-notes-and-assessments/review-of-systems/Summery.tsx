import MyModal from '@/components/MyModal/MyModal';
import { faListCheck } from '@fortawesome/free-solid-svg-icons';
import React, { useEffect, useState } from 'react';
const Summary =({open ,setOpen,list})=>{
    return(<>
          <MyModal
        position='right'
        open={open} 
        setOpen={setOpen}
        title="Summery"
        hideActionBtn
        hideCanel
        steps={[

          {
            title: "Summery", icon:faListCheck,
           
          },
        ]}
        content={
           <div className='summery-div'>
          
            {list?.map((item, index) => (
              <div key={index} className='summery-div-child'>
                <p>{item.systemLkey}</p>
                <p>{item.systemDetailLvalue ? item.systemDetailLvalue.lovDisplayVale
                  : item.systemDetailLkey}</p>
                <p> {item.notes}</p>
              </div>
            ))}

         
        </div>}>
        </MyModal></>)
}
export default Summary;