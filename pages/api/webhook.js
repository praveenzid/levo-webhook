export default async function handler(req, res) {
  try {
    console.log('Received request:', {
      method: req.method,
      headers: req.headers,
      body: req.body,
      query: req.query
    });

    // Handle GET requests (often used for webhook validation)
    if (req.method === 'GET') {
      console.log('GET request received - webhook validation');
      return res.status(200).json({ 
        message: 'Webhook endpoint is active',
        status: 'ok',
        timestamp: new Date().toISOString()
      });
    }

    // Handle POST requests (actual webhook data)
    if (req.method === 'POST') {
      const webhookData = req.body;
      console.log('POST request received with data:', webhookData);

      // Handle different webhook validation patterns
      if (webhookData && webhookData.challenge) {
        // Some services send a challenge parameter for validation
        console.log('Challenge validation received');
        return res.status(200).json({ challenge: webhookData.challenge });
      }

      // Format the message for Slack
      const slackMessage = {
        text: `🔔 New Event from Levo.so`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Webhook Data Received:*\n\`\`\`${JSON.stringify(webhookData, null, 2)}\`\`\``
            }
          }
        ]
      };

      // Send to Slack (only if Slack webhook URL is configured)
      if (process.env.SLACK_WEBHOOK_URL) {
        try {
          const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json' 
            },
            body: JSON.stringify(slackMessage)
          });

          if (!slackResponse.ok) {
            console.error('Slack webhook failed:', await slackResponse.text());
          } else {
            console.log('Successfully sent to Slack');
          }
        } catch (slackError) {
          console.error('Error sending to Slack:', slackError);
        }
      } else {
        console.log('No Slack webhook URL configured');
      }

      // Always respond successfully to the webhook sender
      return res.status(200).json({ 
        message: 'Webhook received successfully',
        timestamp: new Date().toISOString(),
        received: true
      });
    }

    // Handle other HTTP methods
    return res.status(405).json({ 
      message: `Method ${req.method} not allowed`,
      allowed: ['GET', 'POST']
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
