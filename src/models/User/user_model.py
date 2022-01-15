from storage import dbconn
from src.models.Address import address_model
import abc
from hashlib import sha256
from secrets import choice
from string import ascii_letters, digits

ALLCHARS = ascii_letters + digits

class User(abc.ABC):

    TABLE = None
    TABLES = ("customer", "employee", "administrator")

    def __init__(self):
        self.email = None
        self.first_name = None
        self.last_name = None
        self.country = None
        self.city = None
        self.address = None
        self.district = None
        self.postal_code = None
        self.phone = None
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
        self.active = res[5]
        self.create_date = res[6]
        self.get_address_data_by_id(res[4])

        pass_hash_index, pass_salt_index = 7, 8
        if isinstance(self, Customer):
            self.sub_type = res[7]
            pass_hash_index, pass_salt_index = 8, 9

        return res[pass_hash_index], res[pass_salt_index]

    def get_address_data_by_id(self, address_id):
        address_data = address_model.Address.get_address_by_id(address_id)
        if not address_data:
            raise ValueError

        self.country = address_data[0]
        self.city = address_data[1]
        self.address = address_data[2]
        self.district = address_data[3]
        self.postal_code = address_data[4]
        self.phone = address_data[5]


    def to_dict(self):
        return {
            "email": self.email,
            "first_name": self.first_name,
            "last_name": self.last_name,
            "create_date": self.create_date,
            "sub_type": self.sub_type,
            "country": self.country,
            "city": self.city,
            "address": self.address,
            "district": self.district,
            "postal_code": self.postal_code,
            "phone": self.phone
        }

    @staticmethod
    def find_user_table(email):
        cur = dbconn.cursor()

        for table in User.TABLES:
            cur.execute(f"SELECT {table}_id FROM {table} WHERE email = %s", params=(email,))
            res = cur.fetchone()
            if res:
                break
        else:
            raise ValueError

        cur.close()

        return table

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

    @staticmethod
    def get_users(table, start, end):
        cur = dbconn.cursor()
        cur.execute(f"SELECT email,first_name,last_name,create_date,subscription_type,address_id FROM {table} LIMIT %s,%s", (start, end))
        res = cur.fetchall()

        users = []

        for user in res:
            new_user = User()
            new_user.email = user[0]
            new_user.first_name = user[1]
            new_user.last_name = user[2]
            new_user.create_date = user[3]
            new_user.sub_type = user[4]
            new_user.get_address_data_by_id(user[5])
            users.append(new_user)

        cur.close()

        return users

    @staticmethod
    def create_user(table, first_name, last_name, email, address_id, password):
        salt = "".join(choice(ALLCHARS) for _ in range(8))
        pass_hash = sha256(password + salt).hexdigest()

        cur = dbconn.cursor()
        cur.execute(f"INSERT INTO {table}(first_name,last_name,email,address_id,pass_hash,pass_salt) VALUES (%s,%s,%s,%s,%s,%s)", (first_name, last_name, email, address_id, pass_hash, salt))
        dbconn.commit()
        cur.close()

    @staticmethod
    def delete_user(table, email):
        cur = dbconn.cursor()
        cur.execute(f"DELETE FROM {table} WHERE email=%s", (email,))
        dbconn.commit()
        cur.close()

    @staticmethod
    def move_user(from_table, to_table, email):
        cur = dbconn.cursor()
        cur.execute(f"SELECT * FROM {from_table} WHERE email=%s", (email,))
        res = cur.fetchall()
        if not res:
            raise ValueError

        # save data but remove unique ID
        data = res[0][0][1:]

        cur.execute(f"DELETE FROM {from_table} WHERE email=%s", (email,))
        cur.execute(f"INSERT INTO {to_table} (first_name, last_name, email, address_id, active, create_date, pass_hash, pass_salt) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", (*data,))
        dbconn.commit()
        cur.close()


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
        cur.execute("UPDATE customer SET first_name=%s, last_name=%s, address_id=%s, subscription_type=%s WHERE email=%s", (self.first_name, self.last_name, self.address_id, self.sub_type, self.email))
        dbconn.commit()
        cur.close()

    @staticmethod
    def get_users(start, end):
        return User.get_users(Customer.TABLE, start, end)

    @staticmethod
    def create_user(first_name, last_name, email, address_id, password):
        return User.create_user(Customer.TABLE, first_name, last_name, email, address_id, password)

    @staticmethod
    def delete_user(email):
        return User.delete_user(Customer.TABLE, email)
        

class Employee(User):
    TABLE = "employee"

    @staticmethod
    def get_users(start, end):
        return User.get_users(Employee.TABLE, start, end)

    @staticmethod
    def create_user(first_name, last_name, email, address_id, password):
        return User.create_user(Employee.TABLE, first_name, last_name, email, address_id, password)

    @staticmethod
    def delete_user(email):
        return User.delete_user(Employee.TABLE, email)

    @staticmethod
    def toggle_rank(email):
        return User.move_user(Employee.TABLE, Administrator.TABLE, email)


class Administrator(User):
    TABLE = "administrator"

    @staticmethod
    def get_users(start, end):
        return User.get_users(Administrator.TABLE, start, end)

    @staticmethod
    def toggle_rank(email):
        return User.move_user(Administrator.TABLE, Employee.TABLE, email)