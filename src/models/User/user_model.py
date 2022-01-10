from storage import dbconn
from src.models.Address import address_model
import abc

class User(abc.ABC):

    TABLE = None
    TABLES = ("customer", "employee", "administrator")

    def __init__(self):
        self.email = None
        self.first_name = None
        self.last_name = None
        self.address_id = None
        self.active = None
        self.create_date = None
        self.sub_type = None

    def get_user_data_by_email(self, email):
        cur = dbconn.cursor()
        cur.execute(f"SELECT * FROM {self.TABLE} WHERE email = %s", params=(email,))
        res = cur.fetchone()
        cur.close()

        if not res:
            raise ValueError("User with given email not found in database")

        self.email = email
        self.first_name = res[1]
        self.last_name = res[2]
        self.address_id = res[4]
        self.active = res[5]
        self.create_date = res[6]

        pass_hash_index, pass_salt_index = 7, 8
        if type(self) is Customer:
            self.sub_type = res[7]
            pass_hash_index, pass_salt_index = 8, 9

        return res[pass_hash_index], res[pass_salt_index]

    @staticmethod
    def find_user_data(email):
        cur = dbconn.cursor()

        for table in User.TABLES:
            cur.execute(f"SELECT * FROM {table} WHERE email = %s", params=(email,))
            res = cur.fetchone()
            if res:
                break

        cur.close()

        if not res:
            raise ValueError("User with given email not found in database")

        address_data = address_model.Address.get_address_by_id(res[4])
        
        if not address_data:
            raise ValueError("Address not found")
        
        return res[:4] + address_data + res[5:]

class Customer(User):
    TABLE = "customer"

    def update_data(self, first_name = None, last_name = None, address_id = None, sub_type = None):
        if first_name is not None:
            self.first_name = first_name
        if last_name is not None:
            self.last_name = last_name
        if address_id is not None:
            self.address_id = address_id
        if sub_type is not None:
            self.sub_type = sub_type

        cur = dbconn.cursor()
        cur.execute("UPDATE customer SET first_name=%s, last_name=%s, address_id=%s, sub_type=%s WHERE email=%s", (self.first_name, self.last_name, self.address_id, self.sub_type, self.email))
        cur.close()
        

class Employee(User):
    TABLE = "employee"


class Administrator(User):
    TABLE = "administrator"