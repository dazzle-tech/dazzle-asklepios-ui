import React, { useState } from 'react';
import './styles.less';

const DepartmentStock = () => {
//   // Sample data for department stock
//   const [departmentStockData] = useState([
//     {
//       key: '1',
//       department: 'Emergency Department',
//       itemName: 'Paracetamol 500mg',
//       currentStock: 150,
//       minStock: 50,
//       maxStock: 200,
//       unit: 'Tablets',
//       lastUpdated: '2024-01-15',
//       status: 'Normal'
//     },
//     {
//       key: '2',
//       department: 'ICU',
//       itemName: 'Morphine 10mg',
//       currentStock: 25,
//       minStock: 30,
//       maxStock: 100,
//       unit: 'Vials',
//       lastUpdated: '2024-01-14',
//       status: 'Low'
//     },
//     {
//       key: '3',
//       department: 'Cardiology',
//       itemName: 'Aspirin 100mg',
//       currentStock: 200,
//       minStock: 75,
//       maxStock: 250,
//       unit: 'Tablets',
//       lastUpdated: '2024-01-16',
//       status: 'Normal'
//     },
//     {
//       key: '4',
//       department: 'Pediatrics',
//       itemName: 'Amoxicillin 250mg',
//       currentStock: 0,
//       minStock: 40,
//       maxStock: 150,
//       unit: 'Capsules',
//       lastUpdated: '2024-01-13',
//       status: 'Out of Stock'
//     }
//   ]);

//   // Table columns configuration
//   const tableColumns = [
//     {
//       key: 'department',
//       title: <Translate>Department</Translate>,
//       width: 150
//     },
//     {
//       key: 'itemName',
//       title: <Translate>Item Name</Translate>,
//       width: 200
//     },
//     {
//       key: 'currentStock',
//       title: <Translate>Current Stock</Translate>,
//       width: 120
//     },
//     {
//       key: 'minStock',
//       title: <Translate>Min Stock</Translate>,
//       width: 100
//     },
//     {
//       key: 'maxStock',
//       title: <Translate>Max Stock</Translate>,
//       width: 100
//     },
//     {
//       key: 'unit',
//       title: <Translate>Unit</Translate>,
//       width: 100
//     },
//     {
//       key: 'lastUpdated',
//       title: <Translate>Last Updated</Translate>,
//       width: 120
//     },
//     {
//       key: 'status',
//       title: <Translate>Status</Translate>,
//       width: 120,
//       render: (rowData: any) => {
//         const getStatusColor = (status: string) => {
//           switch (status) {
//             case 'Normal':
//               return { backgroundColor: 'var(--light-green)', color: 'var(--primary-green)' };
//             case 'Low':
//               return { backgroundColor: 'var(--light-orange)', color: 'var(--primary-orange)' };
//             case 'Out of Stock':
//               return { backgroundColor: 'var(--light-red)', color: 'var(--primary-red)' };
//             default:
//               return { backgroundColor: 'var(--background-gray)', color: 'var(--primary-gray)' };
//           }
//         };

//         const statusStyle = getStatusColor(rowData.status);
//         return (
//           <span
//             style={{
//               padding: '4px 8px',
//               borderRadius: '4px',
//               fontSize: '12px',
//               fontWeight: '500',
//               ...statusStyle
//             }}
//           >
//             {rowData.status}
//           </span>
//         );
//       }
//     }
//   ];

  return (
    <>
    hello
    </>
    // <div className="department-stock-container">
    //   <div className="header-section">
    //     <h2>
    //       <Translate>Department Stock Management</Translate>
    //     </h2>
    //     <p>
    //       <Translate>Monitor and manage stock levels across all departments</Translate>
    //     </p>
    //   </div>

    //   <div className="table-section">
    //     <MyTable data={departmentStockData} columns={tableColumns} height={500} />
    //   </div>
    // </div>
  );
};

export default DepartmentStock;
