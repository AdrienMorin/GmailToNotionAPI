const express = require('express');
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
const port = 3000;

const CLIENT_ID = '983279840642-f4loo2o3hn0cignq1237msm005h0dmi4.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:3000/oauth2callback';
const TOKEN_PATH = 'token.json';

const { listUnreadEmails } = require('./services/GmailAPI');
const { addMailToNotion } = require('./services/NotionAPI');

app.get('/', (req, res) => {
    const oAuth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    // Charger ou créer le jeton d'accès
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) {
            return res.redirect(oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: ['https://www.googleapis.com/auth/gmail.readonly'],
            }));
        }
        oAuth2Client.setCredentials(JSON.parse(token));
        listUnreadEmails(oAuth2Client, res);
    });
});

app.get('/oauth2callback', (req, res) => {
    const oAuth2Client = new google.auth.OAuth2(
        CLIENT_ID,
        CLIENT_SECRET,
        REDIRECT_URI
    );

    oAuth2Client.getToken(req.query.code, (err, token) => {
        if (err) {
            console.error('Error retrieving access token', err);
            return res.status(500).send('Error retrieving access token');
        }
        oAuth2Client.setCredentials(token);
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) {
                console.error('Error writing token file', err);
                return res.status(500).send('Error writing token file');
            }
            console.log('Token stored to', TOKEN_PATH);
        });
        listUnreadEmails(oAuth2Client, res);
    });
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
