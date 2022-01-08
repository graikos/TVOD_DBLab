from storage import dbconn
import abc

class User(abc.ABC):

    TABLE = None

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
        print(self.TABLE)
        cur.execute(f"SELECT * FROM {self.TABLE} WHERE email = %s", params=(email,))
        res = cur.fetchone()
        cur.close()

        print(f"Got {res}")

        if not res:
            raise ValueError("User with given email not found in database")

        self.email = email
        self.first_name = res[1]
        self.last_name = res[2]
        self.address_id = res[4]
        self.active = res[5]
        self.create_date = res[6]
        self.sub_type = res[7]

        return res[8], res[9]


class Customer(User):
    TABLE = "customer"

class Employee(User):
    TABLE = "employee"


class Administrator(User):
    TABLE = "administrator"