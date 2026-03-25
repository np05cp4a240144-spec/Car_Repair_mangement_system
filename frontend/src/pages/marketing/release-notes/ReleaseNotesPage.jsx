import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const ReleaseNotesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Release Notes"
      title="Recent system updates"
      intro="A summary of operational improvements across booking, workshop flow, billing, and customer experience."
      sections={[
        { title: 'Mechanic Assignment Workflow', text: 'Improved appointment-to-mechanic assignment handling for clearer responsibility and faster job progression.' },
        { title: 'Invoice Calculation Updates', text: 'Added stronger invoice handling for discounts, tax values, and pending parts payment scenarios.' },
        { title: 'Service Rating Improvements', text: 'Extended rating support so customer feedback can be recorded directly after service completion.' },
        { title: 'Marketing and Help Content Refresh', text: 'Revised landing-linked pages with clearer system-focused content for features, roles, updates, and support.' }
      ]}
    />
  );
};

export default ReleaseNotesPage;
