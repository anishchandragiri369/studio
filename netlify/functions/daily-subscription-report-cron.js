exports.handler = async (event, context) => {
  console.log('Daily subscription report cron job triggered');

  try {
    // Get the base URL for the API call
    const baseUrl = process.env.URL || 'https://develixr.netlify.app';
    const apiUrl = `${baseUrl}/api/daily-subscription-report`;
    
    // Dynamic import for fetch in Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Make request to the daily report API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-secret-token'}`
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('Daily subscription report sent successfully:', result.messageId);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Daily subscription report cron job completed successfully',
          data: result
        })
      };
    } else {
      console.error('Failed to send daily subscription report:', result.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Failed to send daily subscription report',
          error: result.message
        })
      };
    }

  } catch (error) {
    console.error('Error in daily subscription report cron job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Cron job failed',
        error: error.message
      })
    };
  }
};
