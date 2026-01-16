const express = require('express');
const { google } = require('googleapis');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/import-from-drive', async (req, res) => {
    const { fileId, accessToken } = req.body;
    if (!fileId || !accessToken) {
        return res.status(400).json({ success: false, message: 'Missing fileId or accessToken.' });
    }

    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });

    const drive = google.drive({ version: 'v3' });

    try {
        console.log(`Attempting to download file with ID: ${fileId}`);
        const fileResponse = await drive.files.get({
            fileId: fileId,
            alt: 'media',
            auth: oauth2Client
        }, { responseType: 'stream' });
        console.log("File downloaded successfully.");

        // In a real app, you would now upload fileResponse.data to IPFS.
        // For now, we simulate this.
        const simulatedIpfsHash = `QmSimulatedHash_${fileId.slice(0, 10)}`;
        console.log(`Simulated IPFS Hash: ${simulatedIpfsHash}`);

        res.json({ success: true, ipfsHash: simulatedIpfsHash });
    } catch (error) {
        console.error("Backend Error:", error.message);
        res.status(500).json({ success: false, message: 'Failed to process file from Google Drive.' });
    }
});

const PORT = 3001;
app.listen(PORT, () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
});