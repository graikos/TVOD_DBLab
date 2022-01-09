from hashlib import sha256
from src.models.User.user_model import Customer, Employee, Administrator
from storage import dbconn

user_types = (Customer, Employee, Administrator)

def hash_and_salt(phrase, salt):
    return sha256((phrase + salt).encode()).hexdigest()


def check_credentials(uname, pwd):
    pass_data = None
    user = None
    for user_type in user_types:
        user = user_type()
        try:
            pass_data = user.get_user_data_by_email(uname)
        except ValueError:
            continue
        if pass_data:
            break

    print(f"reached this point and have user of type {type(user)}")

    if not pass_data:
        raise ValueError

    print("Hash got:" + pass_data[0])
    print("Salt got:" + pass_data[1])
    if hash_and_salt(pwd, pass_data[1]) == pass_data[0]:
        return user
    
    raise ValueError
        