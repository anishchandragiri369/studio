exports.handler = async (event, context) => {
  console.log('Delivery scheduler cron job triggered');

  try {
    // Get the base URL for the API call
    const baseUrl = process.env.URL || 'https://develixr.netlify.app';
    const apiUrl = `${baseUrl}/api/cron/delivery-scheduler`;
    
    // Dynamic import for fetch in Node.js
    const fetch = (await import('node-fetch')).default;
    
    // Make request to the delivery scheduler API
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.CRON_SECRET || 'your-secret-token'}`
      }
    });

    const result = await response.json();

    if (result.success) {
      console.log('Delivery scheduler completed successfully:', result.data);
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: 'Delivery scheduler cron job completed successfully',
          data: result.data
        })
      };
    } else {
      console.error('Failed to run delivery scheduler:', result.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          success: false,
          message: 'Failed to run delivery scheduler',
          error: result.message
        })
      };
    }

  } catch (error) {
    console.error('Error in delivery scheduler cron job:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: 'Error in delivery scheduler cron job',
        error: error.message
      })
    };
  }
};
