import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const RolesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Who It Is For"
      title="Three roles, one workflow"
      intro="Each role works in one connected platform with the permissions and tools needed for daily garage operations."
      sections={[
        { title: 'Admin', text: 'Control appointments, mechanic assignments, inventory levels, invoices, payment status, and support handling from one dashboard.' },
        { title: 'Mechanic', text: 'View assigned jobs, update repair progress, and confirm parts usage so billing and status remain accurate.' },
        { title: 'Customer', text: 'Book service, check progress, review invoices, complete payments, and submit ratings after service completion.' },
        { title: 'Shared Data Flow', text: 'Updates from one role are reflected across related screens to reduce delays and communication gaps.' }
      ]}
    />
  );
};

export default RolesPage;
