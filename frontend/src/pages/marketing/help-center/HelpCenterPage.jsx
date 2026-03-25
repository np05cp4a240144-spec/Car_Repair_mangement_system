import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const HelpCenterPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Help Center"
      title="Support for daily operations"
      intro="Use these channels when you need help with access, bookings, job tracking, billing, or payment confirmation."
      sections={[
        { title: 'Account and Access', text: 'For login issues or account setup, contact support@autoassist.com using your registered email address.' },
        { title: 'Bookings and Job Status', text: 'If appointment details or mechanic updates look incorrect, include booking ID and expected status in your request.' },
        { title: 'Payments and Invoices', text: 'For payment confirmation delays, share transaction reference, invoice number, and payment date for faster verification.' },
        { title: 'Support Hours', text: 'Support is available Mon - Sat, 8:00 AM to 7:00 PM.' }
      ]}
    />
  );
};
export default HelpCenterPage;
