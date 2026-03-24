import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const HelpCenterPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Help Center"
      title="Get support quickly"
      intro="Use these support paths when you need onboarding help, troubleshooting, or account assistance."
      sections={[
        { title: 'Account and Access', text: 'For login issues or account setup support, contact support@autoassist.com with your registered email.' },
        { title: 'Booking and Tracking', text: 'If appointment or tracking data appears incorrect, share booking ID and expected status for quick investigation.' },
        { title: 'Payments and Invoices', text: 'For payment confirmation delays, provide transaction reference and invoice number in your support request.' },
        { title: 'Business Hours', text: 'Support team is available sunday to Friday, 8:00 AM to 7:00 PM.' }
      ]}
    />
  );
};
export default HelpCenterPage;
