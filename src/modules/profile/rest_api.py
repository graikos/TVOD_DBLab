from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.User.user_model import User, Administrator, Customer, Employee
from src.models.Address.address_model import Address
import json

USER_TYPES = {
    "customer": Customer,
    "employee": Employee,
    "administrator": Administrator
}

class Profile(Resource):
    def get(self):
        try:
            user = tokens[request.headers["authorization"]]
            if not (isinstance(user, Employee) or isinstance(user, Administrator)) and user.email != request.args.get("for_user"):
                raise ValueError

            requested_data = User.find_user_data(request.args.get("for_user"))

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)

        return make_response(jsonify({
            "email": requested_data[3],
            "first_name": requested_data[1],
            "last_name": requested_data[2],
            "country": requested_data[4],
            "city": requested_data[5],
            "address": requested_data[6],
            "district": requested_data[7],
            "postal_code": requested_data[8],
            "phone": requested_data[9],
            "active": requested_data[10],
            "create_date": requested_data[11],
            "sub_type": requested_data[12]
        }), 200)

    def put(self):
        try:
            # authenticate
            user = tokens[request.headers["authorization"]]
            data = json.loads(request.data)
            if isinstance(user, Customer) and user.email != data["for_user"]:
                raise ValueError

            if "change_to" in data:
                if not isinstance(user, Administrator):
                    raise ValueError

                user_table = User.find_user_table(data["for_user"])
                if user_table not in {"administrator", "employee"}:
                    raise ValueError

                USER_TYPES[user_table].toggle_rank(data["for_user"])
                return make_response(jsonify(""), 200)

            if isinstance(user, Customer):
                new_customer = user
            else:
                new_customer = Customer()
                try:
                    new_customer.get_user_data_by_email(data["for_user"])
                except ValueError:
                    if not isinstance(user, Administrator):
                        raise ValueError

                    USER_TYPES[data["type"]].create_user(data["first_name"], data["last_name"], data["email"], data["address_id"], data["password"])
                    return make_response(jsonify(""), 201)


        except (KeyError, ValueError, AttributeError):
            return make_response(jsonify(""), 403)

        address_id = Address.add_address(data["country"], data["city"], data["address"], data["district"], data["postal_code"], data["phone"])

        new_customer.update_data(data["first_name"], data["last_name"],
        address_id, data["sub_type"].upper())

        return make_response(jsonify(""), 200)

    def delete(self):
        try:
            user = tokens[request.headers["authorization"]]

            if not isinstance(user, Administrator):
                raise ValueError

            data = json.loads(request.data)
            user_table = User.find_user_table(data["for_user"])
            
            USER_TYPES[user_table].delete_user(data["for_user"])
            return make_response(jsonify(""), 200)

        except (KeyError, ValueError, AttributeError):
            return make_response(jsonify(""), 404)

