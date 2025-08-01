import React from 'react';
import MyCard from '@/components/MyCard';
import MyBadgeStatus from '@/components/MyBadgeStatus/MyBadgeStatus';
import { sampleData } from './OpenDetailsTableModal';
import './Styles.less';
//Table Static Data


const DetailCard = () => {
  //Mycard Content
  return (
    <div className="card-grid">
      {sampleData.map(item => (
        <MyCard
          key={item.id}
          title={
            <>
              Name: {item.itemName}
              <br />
              Code: {item.itemCode}
            </>
          }
          contant={
            <>
              Specs: {item.specs}
              <br />
              Quantity: {item.quantity}
              <br />
              <div className='status-card-position'>
              <MyBadgeStatus
                backgroundColor={
                  item.status === 'Available' ? 'var(--light-green)' : 'var(--background-gray)'
                }
                color={item.status === 'Available' ? 'var(--primary-green)' : 'var(--primary-gray)'}
                contant={item.status}
              />
            </div></>
          }
          footerContant={''}
          avatar={item.avatar}
          showMore={true}
          showArrow={false}
          width="100%"
          variant="basic"
        />
      ))}
    </div>
  );
};

export default DetailCard;
