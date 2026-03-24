import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const RolesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Who It Is For"
      title="Three roles, one workflow"
      intro="Auto Assist is designed so every user type works in the same system with role-specific views and permissions."
      sections={[
        { title: 'Admin', text: 'Manage appointments, customers, staff performance, inventory, revenue, and support from one command center.' },
        { title: 'Mechanic', text: 'Access assigned jobs, update work status, request parts, and communicate through chat for faster turnaround.' },
        { title: 'Customer', text: 'Book services, track repair status, view history, make payments, and receive updates in one place.' },
        { title: 'Shared Data Flow', text: 'When one role updates a record, the right users see it immediately to reduce miscommunication.' }
      ]}
    />
  );
};

export default RolesPage;
