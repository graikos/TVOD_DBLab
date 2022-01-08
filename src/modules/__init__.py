from .login.rest_api import Login as login_rs
from flask_restful import Api

API = Api()

API.add_resource(login_rs, "/api/login", endpoint="/api/login")