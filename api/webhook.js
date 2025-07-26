export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const webhookData = req.body;
    console.log('Received webhook data:', webhookData);

    // Format the message for Slack
    const slackMessage = {
      text: `🔔 Google Ads Event Received`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Event from Levo.so:*\n\`\`\`${JSON.stringify(webhookData, null, 2)}\`\`\``
          }
        }
      ]
    };

    // Send to Slack (only if Slack webhook URL is configured)
    if (process.env.SLACK_WEBHOOK_URL) {
      const slackResponse = await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify(slackMessage)
      });

      if (!slackResponse.ok) {
        console.error('Slack webhook failed:', await slackResponse.text());
      }
    }

    // Respond to Levo.so
    res.status(200).json({ 
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}
