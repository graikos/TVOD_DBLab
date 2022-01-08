import mysql.connector
import json

params = None
with open("config/params.json", "r") as f:
    params = json.load(f)

if not params:
    print("Failed to load params")
    exit(1)
        
dbconn = mysql.connector.connect(
    host=params["database"]["host"],
    user=params["database"]["user"],
    password=params["database"]["password"],
    database=params["database"]["database_name"]
)

tokens = {}
