const { Client } = require('@notionhq/client');

// Remplacez 'YOUR_NOTION_API_KEY' par votre clé d'API Notion
const NOTION_API_KEY = 'secret_mfKV4w75Vr3J1pkSGA5YIgQbCUPrVtesBtSMxgZOyJl';

// Remplacez 'YOUR_DATABASE_ID' par l'ID de votre base de données Notion
const DATABASE_ID = '412e44aadb284f0d8b3f536aadf906c6';

const notion = new Client({ auth: NOTION_API_KEY });

async function addMailToNotion(mailInfos) {
    const response = await notion.pages.create({
        parent: {
            database_id: DATABASE_ID,
        },
        properties: mailInfos.properties,
        children: mailInfos.children,
    });
    console.log(response);
}

module.exports = {
    addMailToNotion,
};