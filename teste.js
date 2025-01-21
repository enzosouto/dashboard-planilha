const { google } = require('googleapis');
const sheets = google.sheets('v4');
const fs = require('fs');

// Carregar as credenciais do arquivo JSON
const credentials = JSON.parse(fs.readFileSync('C:/Users/Enzo Souto/Documents/dash figma novo/credentials.json'));
const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

async function getSheetData() {
    const authClient = await auth.getClient();
    const spreadsheetId = '13Pxh0jDPFY54-sKBs7doD3ZlTkrm5HOh0rzYd__oAcE';
    const range = 'Sheet1!A1:Z200'; // Ajuste o intervalo desejado

    const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range,
    });

    const rows = response.data.values;
    if (rows.length) {
        console.log('Dados extraídos:');
        rows.forEach((row) => console.log(row));
    } else {
        console.log('Nenhum dado encontrado.');
    }
}

getSheetData().catch(console.error);
