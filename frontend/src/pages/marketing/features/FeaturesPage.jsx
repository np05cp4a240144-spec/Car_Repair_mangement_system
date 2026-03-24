import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const FeaturesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Product Features"
      title="Everything needed to run a modern garage"
      intro="Auto Assist modules are connected from booking to payment, so your team can work from one shared operational system."
      sections={[
        { title: 'Appointment Management', text: 'Create, update, and track appointments with service details, customer details, and vehicle records in one timeline.' },
        { title: 'Job Progress Tracking', text: 'Mechanics can update status in real time so admins and customers always see accurate progress.' },
        { title: 'Inventory and Parts', text: 'Track stock levels, monitor low-stock alerts, and deduct parts from inventory as jobs are completed.' },
        { title: 'Payments and Invoices', text: 'Support online payment flow and generate invoice records for both service and parts transactions.' },
        { title: 'Role-Based Dashboards', text: 'Admins, mechanics, and customers each get focused screens with only the tools they need.' },
        { title: 'Integrated Support Chat', text: 'Built-in messaging helps resolve support questions faster without leaving the platform.' }
      ]}
    />
  );
};

export default FeaturesPage;
