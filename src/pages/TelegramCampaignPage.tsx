import React, { useEffect } from 'react';
import TelegramCampaign from '../components/campaigns/TelegramCampaign';

const TelegramCampaignPage: React.FC = () => {
  // Update document title when component mounts
  useEffect(() => {
    document.title = 'Telegram Campaigns | Intimatecare CRM';
  }, []);

  return <TelegramCampaign />;
};

export default TelegramCampaignPage;
