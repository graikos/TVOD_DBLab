from .login.rest_api import Login as login_rs
from .fetch.rest_api import Fetch as fetch_rs
from .profile.rest_api import Profile as profile_rs
from .address.rest_api import Address as address_rs
from .subscription.rest_api import Subscription as subscription_rs
from .rental.rest_api import Rental as rental_rs
from .edit.rest_api import Edit as edit_rs
from flask_restful import Api

API = Api()

API.add_resource(fetch_rs, "/api/fetch", endpoint="/api/fetch")
API.add_resource(login_rs, "/api/login", endpoint="/api/login")
API.add_resource(profile_rs, "/api/profile", endpoint="/api/profile")
API.add_resource(address_rs, "/api/address", endpoint="/api/address")
API.add_resource(subscription_rs, "/api/subscription", endpoint="/api/subscription")
API.add_resource(rental_rs, "/api/rental", endpoint="/api/rental")
API.add_resource(edit_rs, "/api/edit", endpoint="/api/edit")
