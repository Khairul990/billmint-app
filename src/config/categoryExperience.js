export const CATEGORY_EXPERIENCES = {
  embroidery: {
    icon: 'Palette',
    labels: {
      customer: 'Client',
      invoice: 'Order',
      estimate: 'Quote',
      product: 'Design',
      expense: 'Supply Cost'
    },
    dashboardHints: [
      'Track pending orders by due date',
      'Monitor thread & material costs',
      'Review design book for new requests'
    ],
    quickTips: [
      'Save fabric measurements for repeat clients',
      'Use design book to showcase your portfolio'
    ],
    sampleData: {
      products: [
        { name: 'Kurti Embroidery', price: 1500 },
        { name: 'Saree Fall Work', price: 2500 }
      ],
      expenses: [
        { name: 'Thread Stock', amount: 5000 },
        { name: 'Sequins Pack', amount: 2000 }
      ]
    }
  },
  tailor: {
    icon: 'Scissors',
    labels: {
      customer: 'Client',
      invoice: 'Bill',
      estimate: 'Estimate',
      product: 'Garment',
      expense: 'Material Cost'
    },
    dashboardHints: [
      'Track stitching orders by delivery date',
      'Monitor cloth inventory levels',
      'Review measurement book for alterations'
    ],
    quickTips: [
      'Save body measurements for repeat clients',
      'Use design book to show fabric swatches'
    ]
  },
  retail: {
    icon: 'Store',
    labels: {
      customer: 'Customer',
      invoice: 'Receipt',
      estimate: 'Quote',
      product: 'Item',
      expense: 'Inventory Cost'
    },
    dashboardHints: [
      'Track daily sales vs targets',
      'Monitor fast-moving inventory',
      'Review customer purchase history'
    ],
    quickTips: [
      'Create bills faster with saved products',
      'Track supplier payments in expenses'
    ]
  },
  doctor: {
    icon: 'Stethoscope',
    labels: {
      customer: 'Patient',
      invoice: 'Prescription Bill',
      estimate: 'Treatment Quote',
      product: 'Medicine',
      expense: 'Clinic Cost'
    },
    dashboardHints: [
      'Track patient follow-ups and appointments',
      'Monitor medicine stock and expiry',
      'Review monthly clinic revenue'
    ],
    quickTips: [
      'Save patient medical history for reference',
      'Use appointments for scheduling checkups'
    ]
  },
  teacher: {
    icon: 'BookOpen',
    labels: {
      customer: 'Student',
      invoice: 'Fee Receipt',
      estimate: 'Fee Quote',
      product: 'Course',
      expense: 'Teaching Material'
    },
    dashboardHints: [
      'Track monthly fee collections',
      'Monitor student attendance records',
      'Review course enrollment trends'
    ],
    quickTips: [
      'Generate fee receipts for each student',
      'Track teaching expenses separately'
    ]
  },
  repair: {
    icon: 'Wrench',
    labels: {
      customer: 'Customer',
      invoice: 'Service Bill',
      estimate: 'Repair Quote',
      product: 'Part',
      expense: 'Service Cost'
    },
    dashboardHints: [
      'Track repair jobs by status',
      'Monitor spare parts inventory',
      'Review service completion rate'
    ],
    quickTips: [
      'Save device details for repeat customers',
      'Use service jobs to track repairs'
    ]
  },
  general: {
    icon: 'Briefcase',
    labels: {
      customer: 'Client',
      invoice: 'Invoice',
      estimate: 'Estimate',
      product: 'Product',
      expense: 'Expense'
    },
    dashboardHints: [
      'Track all pending invoices',
      'Monitor monthly revenue growth',
      'Review client payment history'
    ],
    quickTips: [
      'Use templates to speed up billing',
      'Track all business expenses regularly'
    ]
  }
};

export const getCategoryExperience = (wsType) => {
  return CATEGORY_EXPERIENCES[wsType] || CATEGORY_EXPERIENCES.general;
};
