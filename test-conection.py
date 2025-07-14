import pyodbc

# Definir los detalles de la conexión
server = r'WarMachine\SQLEXPRESS'
database = 'soccam'
username = 'soccam_user'
password = '1Asoccam'

# Probar con un driver más moderno si está instalado
connection_string = f'DRIVER={{ODBC Driver 17 for SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};'

def testDBConection(connection_string):
    try:
        conn = pyodbc.connect(connection_string)
        print("Conexión exitosa")
        conn.close()
    except pyodbc.Error as e:
        print("Error al conectar:", e)

testDBConection(connection_string)
