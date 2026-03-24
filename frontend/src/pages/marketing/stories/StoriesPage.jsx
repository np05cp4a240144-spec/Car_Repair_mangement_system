import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const StoriesPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="Customer Stories"
      title="How garages use Auto Assist"
      intro="Different workshop sizes use the platform in different ways, but all of them gain visibility and speed."
      sections={[
        { title: 'Independent Workshop', text: 'A 4-person team replaced manual phone follow-ups with in-app status tracking and reduced missed updates.' },
        { title: 'Growing Service Center', text: 'A multi-bay garage used appointment planning and dashboard reporting to improve daily job throughput.' },
        { title: 'Parts-Heavy Operations', text: 'A shop with frequent parts usage improved stock control and avoided service delays from stockouts.' },
        { title: 'Customer Communication', text: 'Support chat reduced repetitive calls by giving customers direct access to updates and clarifications.' }
      ]}
    />
  );
};

export default StoriesPage;
