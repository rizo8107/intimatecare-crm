# Intimatecare CRM

A modern CRM application for managing leads, tasks, and sales data with a focus on eBook and Telegram subscription products.

## Features

- **Dashboard**: View key metrics, purchase trends, and sales distribution
- **Lead Management**: Track and manage leads through the sales pipeline
- **Task Management**: Create and manage tasks associated with leads
- **Notes System**: Add and track notes for each lead
- **Telegram Subscriptions**: Track and manage Telegram subscription sales
- **eBook Sales**: Monitor eBook sales and customer access
- **Toast Notifications**: Real-time feedback for user actions

## Technology Stack

- React 18
- TypeScript
- Tailwind CSS
- Chart.js for data visualization
- Supabase for backend and database

## Development

1. Clone the repository
```bash
git clone https://github.com/rizo8107/intimatecare-crm.git
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

## Deployment

This project is configured for easy deployment to Netlify.

### Manual Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to your hosting provider

### Netlify Deployment
The repository includes a `netlify.toml` configuration file for automatic deployment.

## Environment Variables

Create a `.env` file with the following variables:
```
VITE_API_URL=your_api_url
VITE_API_KEY=your_api_key
```

## License

[MIT](LICENSE)
