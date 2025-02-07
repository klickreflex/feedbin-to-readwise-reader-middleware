const axios = require("axios");

module.exports = async (req, res) => {
    // Set headers first
    res.setHeader('Access-Control-Allow-Origin', 'https://feedbin.com');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    if (req.method !== "GET") {
        return res.status(405).json({ error: "Only GET requests are allowed" });
    }

    const { url, title, source } = req.query;
    const READWISE_API_TOKEN = process.env.READWISE_API_TOKEN;

    // Validate API token
    if (!READWISE_API_TOKEN) {
        return res.status(500).json({ error: "Readwise API token not configured" });
    }

    // Validate URL
    if (!url) {
        return res.status(400).json({ error: "Missing URL parameter" });
    }

    try {
        // Basic URL validation
        new URL(url);
    } catch (e) {
        return res.status(400).json({ error: "Invalid URL format" });
    }

    console.log(`Incoming request: ${new Date().toISOString()} - URL: ${url}`);

    try {
        const response = await axios.post(
            "https://readwise.io/api/v3/save/",
            {
                url,
                title: title || "Untitled",
                source: source || "Feedbin"
            },
            {
                headers: {
                    "Authorization": `Token ${READWISE_API_TOKEN}`,
                    "Content-Type": "application/json"
                },
                timeout: 5000
            }
        );

        console.log(`Successfully saved article: ${url} at ${new Date().toISOString()}`);

        // Return HTML page that auto-closes
        res.setHeader('Content-Type', 'text/html');
        return res.status(200).send(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Saved to Readwise</title>
                    <style>
                        body {
                            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            height: 100vh;
                            margin: 0;
                            background-color: #f5f5f5;
                        }
                        .message {
                            text-align: center;
                            padding: 20px;
                            background: white;
                            border-radius: 8px;
                            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                        }
                    </style>
                </head>
                <body>
                    <div class="message">
                        <h3>✅ Saved to Readwise Reader</h3>
                        <p>This window will close automatically...</p>
                    </div>
                    <script>
                        setTimeout(() => window.close(), 1500);
                    </script>
                </body>
            </html>
        `);
    } catch (error) {
        // More detailed error handling
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            return res.status(error.response.status).json({
                error: "Readwise API error",
                details: error.response.data
            });
        } else if (error.request) {
            // The request was made but no response was received
            return res.status(503).json({
                error: "No response from Readwise API",
                details: "Service may be down"
            });
        } else {
            // Something happened in setting up the request
            return res.status(500).json({
                error: "Request setup error",
                details: error.message
            });
        }
    }
};
