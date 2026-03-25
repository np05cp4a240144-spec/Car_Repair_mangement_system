import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const StoriesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Customer Stories"
      title="How garages use Auto Assist"
      intro="Workshops of different sizes use the same platform structure and gain clearer visibility across operations."
      sections={[
        { title: 'Independent Workshop', text: 'A small team used booking timelines and mechanic updates to reduce manual status calls to customers.' },
        { title: 'Growing Service Center', text: 'A multi-bay garage improved daily scheduling by assigning jobs and tracking pending work from one dashboard.' },
        { title: 'Parts-Focused Repair Shop', text: 'Inventory-linked job parts helped prevent stock surprises and reduced repair delays caused by unavailable items.' },
        { title: 'Billing and Communication', text: 'Invoice visibility, payment tracking, and support messaging reduced confusion at handover time.' }
      ]}
    />
  );
};

export default StoriesPage;
