exports.handler = async (event) => {
  // Parse the webhook payload
  let data;
  try {
    data = JSON.parse(event.body);
    console.log('Received webhook:', data);
    // TODO: Add your order/email logic here
  } catch (e) {
    return {
      statusCode: 400,
      body: JSON.stringify({ success: false, error: 'Invalid JSON' }),
    };
  }

  // Always return 200 OK to stop retries
  return {
    statusCode: 200,
    body: JSON.stringify({ success: true }),
  };
};
