import pyodbc

# Definir los detalles de la conexión
server = 'DESKTOP-8RF1888\SQLEXPRESS'
database = 'soccam'
username = 'soccam_user'
password = '1Aleonardo'


# Establecer la cadena de conexión
# connection_string = f'DRIVER={{SQL Server}};SERVER={server};DATABASE={database};UID={username};PWD={password};'
# connection_string = "DRIVER={ODBC Driver 17 for SQL Server};SERVER=soccamapp.database.windows.net;DATABASE=SoccamTest;UID=soccamadmin;PWD=Pablolezcano16;"
connection_string = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=intercam-bolivar.database.windows.net,1433;"
    "DATABASE=intercam-bolivar;"
    "UID=intercam-dba;"
    "PWD=kwxh/$yz@}KZ"
)


def testDBConection(connection_string):
    try:
        # Intentar establecer la conexión
        conn = pyodbc.connect(connection_string)
        print(connection_string)
        
        # Si la conexión tiene éxito, imprimir un mensaje
        print("Conexión exitosa")
        
        # Cerrar la conexión
        conn.close()
    except pyodbc.Error as e:
        # Si hay un error al conectar, imprimir el mensaje de error
        print("Error al conectar:", e)

testDBConection(connection_string=connection_string)