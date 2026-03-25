import React from 'react';
import MarketingInfoPage from '../shared/MarketingInfoPage';

const AboutPage = () => {
  return (
    <MarketingInfoPage
      eyebrow="About"
      title="Built for real garage operations"
      intro="Auto Assist was built to replace scattered calls, notes, and spreadsheets with one structured service management system."
      sections={[
        { title: 'Mission', text: 'Help service centers run faster with transparent records from appointment booking to final payment.' },
        { title: 'Approach', text: 'Design role-based workflows for admins, mechanics, and customers without adding unnecessary complexity.' },
        { title: 'Focus', text: 'Prioritize accurate status tracking, inventory clarity, invoice reliability, and support responsiveness.' },
        { title: 'Product Direction', text: 'Continue improving assignment automation, reporting quality, and communication flows based on workshop feedback.' }
      ]}
    />
  );
};

export default AboutPage;
