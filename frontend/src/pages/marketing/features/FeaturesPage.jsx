import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const FeaturesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Product Features"
      title="Core modules for complete service operations"
      intro="Auto Assist keeps booking, repair progress, parts control, invoicing, and payment records connected in one daily workflow."
      sections={[
        { title: 'Appointment and Vehicle Records', text: 'Register customer bookings with vehicle details, service notes, and schedule timelines in one place.' },
        { title: 'Mechanic Assignment and Updates', text: 'Assign work to mechanics and track job status updates in real time from pending to completed.' },
        { title: 'Inventory and Parts Usage', text: 'Manage stock, low-stock alerts, and part deduction directly from active repair jobs.' },
        { title: 'Invoices, Tax, and Discounts', text: 'Generate invoice summaries with labor, parts, VAT, and discount values stored as clear records.' },
        { title: 'Payments and Pending Parts Flow', text: 'Track payment status for service and parts, including pending parts settlement workflows.' },
        { title: 'Ratings and Support Messages', text: 'Capture service ratings and resolve customer questions through built-in messaging.' }
      ]}
    />
  );
};

export default FeaturesPage;
