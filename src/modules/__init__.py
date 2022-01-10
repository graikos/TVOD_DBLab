from .login.rest_api import Login as login_rs
from .fetch.rest_api import Fetch as fetch_rs
from .profile.rest_api import Profile as profile_rs
from .address.rest_api import Address as address_rs
from .subscription.rest_api import Subscription as subscription_rs
from flask_restful import Api

API = Api()

API.add_resource(fetch_rs, "/api/fetch", endpoint="/api/fetch")
API.add_resource(login_rs, "/api/login", endpoint="/api/login")
API.add_resource(profile_rs, "/api/profile", endpoint="/api/profile")
API.add_resource(address_rs, "/api/address", endpoint="/api/address")
API.add_resource(subscription_rs, "/api/subscription", endpoint="/api/subscription")
