import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const ReleaseNotesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Release Notes"
      title="Recent platform updates"
      intro="A quick summary of recently completed improvements across the product experience."
      sections={[
        { title: 'Role-Based Page Structure', text: 'Refactored frontend pages into cleaner feature folders for admin, customer, and mechanic modules.' },
        { title: 'Payment Flow Improvements', text: 'Improved parts payment verification path and post-payment inventory update behavior.' },
        { title: 'Support Chat Enhancements', text: 'Added support message routes and admin support chat experience for quicker issue handling.' },
        { title: 'Landing and Marketing Refresh', text: 'Updated landing page visuals and created dedicated information pages linked from footer navigation.' }
      ]}
    />
  );
};

export default ReleaseNotesPage;
