import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const AboutPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="About"
      title="Built for real garage operations"
      intro="Auto Assist was created to reduce manual coordination and make garage workflows predictable, traceable, and faster."
      sections={[
        { title: 'Mission', text: 'Help auto service businesses run with less paperwork and better visibility from booking to handover.' },
        { title: 'Approach', text: 'Combine practical operations tools with a clean user experience for admins, mechanics, and customers.' },
        { title: 'Focus', text: 'We prioritize reliability, clear records, and communication so shops can serve more customers with confidence.' },
        { title: 'Product Direction', text: 'We continue improving automation, reporting, and integrations based on real usage feedback.' }
      ]}
    />
  );
};

export default AboutPage;
