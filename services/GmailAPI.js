const { google } = require('googleapis');
const {addMailToNotion} = require("./NotionAPI");
const moment = require('moment-timezone');

async function listUnreadEmails(auth, res) {
    try {
        const gmail = google.gmail({ version: 'v1', auth });
        const response = await gmail.users.messages.list({
            userId: 'me',
            q: 'is:unread', // Filtre les emails non lus
        });

        const messages = response.data.messages;

        if (messages != null && messages.length) {
            const unreadEmails = messages.map((message) => message);
            for (const message of messages) {
                const mailInfos = await getUnreadMailInfo(auth, message.id);
                console.log(mailInfos);
                await addMailToNotion(mailInfos);
            }

            return res.send(`Unread emails: ${unreadEmails.join(', ')}`);
        } else {
            return res.send('No unread emails found.');
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des e-mails non lus:', error);
        return res.status(500).send('Erreur lors de la récupération des e-mails non lus.');
    }
}

async function getUnreadMailInfo(auth, messageId, res) {
    return new Promise((resolve, reject) => {
        const gmail = google.gmail({version: 'v1', auth});
        gmail.users.messages.get(
            {
                userId: 'me',
                id: messageId,
                format: 'full', // Demander le format complet du message
            },
            (err, res) => {
                if (err) {
                    console.error('Error fetching email:', err);
                    return;
                }

                const message = res.data;

                // Afficher les informations de l'e-mail
                //console.log("------------------------------------");
                let from = message.payload.headers.find((header) => header.name === 'From').value;
                //console.log('From:', from);
                let to = message.payload.headers.find((header) => header.name === 'To').value;
                //console.log('To:', to);
                let subject = message.payload.headers.find((header) => header.name === 'Subject').value;
                //console.log('Subject:', subject);
                let date = message.payload.headers.find((header) => header.name === 'Date').value;
                date = moment(date, 'ddd, D MMM YYYY HH:mm:ss ZZ').toISOString()
                //console.log('Date:', date);
                let mailId = message.id;

                // Afficher le contenu du message
                //console.log('Message Snippet:');
                //console.log(message.snippet);
                let bodySnippet = message.snippet;
                //onsole.log('Message Body:');
                let body = Buffer.from(message.payload.parts[0].body.data, 'base64').toString('utf-8');
                if (body === null || body === undefined) body = " ";
                console.log("body : "+body);
                //console.log("------------------------------------");

                // Si vous souhaitez afficher le contenu complet du message, décommentez la ligne suivante
                // console.log('Message Body:', Buffer.from(message.payload.parts[0].body.data, 'base64').toString('utf-8'));

                const bodyContent = body.toString(); // Convertit le contenu en chaîne de caractères

                let mailInfos = {
                    properties: {
                        'Id': {
                            'rich_text': [
                                {
                                    'text': {
                                        'content': mailId,
                                    },
                                },
                            ],
                        },
                        'Objet': {
                            'title': [
                                {
                                    'text': {
                                        'content': subject, // Remplacez par le titre souhaité
                                    },
                                },
                            ],
                        },
                        'De': {
                            'email': from, // Remplacez par l'adresse e-mail souhaitée
                        },
                        'A': {
                            'email': to, // Remplacez par l'adresse e-mail souhaitée
                        },
                        'Message': {
                            'rich_text': [
                                {
                                    'text': {
                                        'content': bodySnippet, // Remplacez par le contenu souhaité
                                    },
                                },
                            ],
                        },
                        'Date': {
                            'date': {
                                'start': date, // Remplacez par la date souhaitée au format YYYY-MM-DD
                            },
                        },
                    },
                    "children": [
                        {
                            object: 'block',
                            type: 'paragraph',
                            paragraph: {
                                rich_text: [],
                                color: 'default',
                            },
                        }
                    ]
                }

                // Division du contenu en blocs de paragraphe de 2000 caractères ou moins
                const CHUNK_SIZE = 2000;
                for (let i = 0; i < bodyContent.length; i += CHUNK_SIZE) {
                    const chunk = bodyContent.substring(i, i + CHUNK_SIZE);
                    mailInfos.children[0].paragraph.rich_text.push({
                        type: 'text',
                        text: {
                            content: chunk,
                        },
                    },);
                }
                //console.log(mailInfos)
                resolve(mailInfos);

            }
        );
    });
}

module.exports = {
    listUnreadEmails,
};