const { google } = require('googleapis');
const path = require('path');

// NOTE: User must provide credentials.json in the server root
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const appendAttendance = async (data) => {
    if (!SPREADSHEET_ID) {
        console.warn('SPREADSHEET_ID not set. Skipping Google Sheets update.');
        return;
    }

    try {
        const auth = new google.auth.GoogleAuth({
            keyFile: CREDENTIALS_PATH,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const sheets = google.sheets({ version: 'v4', auth });

        // Data: [EmployeeID, Name, Type, Timestamp]
        const values = [
            [data.employeeId, data.name, data.type, data.timestamp]
        ];

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:D', // Adjust range as needed
            valueInputOption: 'USER_ENTERED',
            resource: { values },
        });
        console.log('Added to Google Sheets');
    } catch (error) {
        console.error('Error updating Google Sheets:', error.message);
    }
};

const getAttendanceLogs = async () => {
    if (!SPREADSHEET_ID) return [];

    try {
        let auth;
        if (process.env.GOOGLE_CREDENTIALS) {
            // Deploy Mode: Use credentials from Env Var
            const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
            auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        } else {
            // Local Mode: Use file
            auth = new google.auth.GoogleAuth({
                keyFile: CREDENTIALS_PATH,
                scopes: ['https://www.googleapis.com/auth/spreadsheets'],
            });
        }

        const sheets = google.sheets({ version: 'v4', auth });
        const res = await sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Sheet1!A:D',
        });
        return res.data.values || [];
    } catch (error) {
        console.error('Error fetching Sheets:', error.message);
        throw error;
    }
};

module.exports = { appendAttendance, getAttendanceLogs };
