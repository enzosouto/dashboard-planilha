from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

# Caminho para o arquivo de credenciais
SERVICE_ACCOUNT_FILE = 'path/to/credentials.json'
SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

# ID da planilha e intervalo
SPREADSHEET_ID = '13Pxh0jDPFY54-sKBs7doD3ZlTkrm5HOh0rzYd__oAcE'
RANGE_NAME = 'Sheet1!A1:Z200'  # Ajuste para o intervalo desejado

creds = Credentials.from_service_account_file(SERVICE_ACCOUNT_FILE, scopes=SCOPES)

service = build('sheets', 'v4', credentials=creds)
sheet = service.spreadsheets()
result = sheet.values().get(spreadsheetId=SPREADSHEET_ID, range=RANGE_NAME).execute()
values = result.get('values', [])

if not values:
    print('Nenhum dado encontrado.')
else:
    print('Dados extraídos:')
    for row in values:
        print(row)
