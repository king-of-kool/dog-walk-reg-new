const twilio = require('twilio');

const accountSid = 'AC047f83d312efa8af9cba87f7b5961513';
const authToken = 'dac81b272be9c7b75999d9888106199e';
const client = twilio(accountSid, authToken);

exports.handler = async function(event, context) {
  console.log('Function invoked with method:', event.httpMethod);

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let data;
  try {
    data = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const message = data.message;
  if (!message || message.trim().length === 0) {
    return { statusCode: 400, body: 'Message is required' };
  }

  try {
    const twilioResponse = await client.messages.create({
      body: message,
      from: '+15512399091',  // Your Twilio number (E.164 format)
      to: '+447394591899',    // Recipient number (E.164 format)
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ sid: twilioResponse.sid }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: `Failed to send message: ${error.message}`,
    };
  }
};
