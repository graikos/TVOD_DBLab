from .login.rest_api import Login as login_rs
from .fetch.rest_api import Fetch as fetch_rs
from flask_restful import Api

API = Api()

API.add_resource(fetch_rs, "/api/fetch", endpoint="/api/fetch")
API.add_resource(login_rs, "/api/login", endpoint="/api/login")