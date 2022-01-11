from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.User.user_model import User, Administrator, Customer, Employee
from src.models.Address.address_model import Address
import json


class Profile(Resource):
    def get(self):
        try:
            user = tokens[request.headers["authorization"]]
            for_user = request.args.get("for_user")
            if not (isinstance(user, Employee) or isinstance(user, Administrator)) and user.email != for_user:
                raise ValueError

            requested_data = User.find_user_data(for_user)

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
            for_user = data["for_user"]
            if not isinstance(user, Employee) and user.email != for_user:
                raise ValueError

            if isinstance(user, Customer):
                new_customer = user
            else:
                new_customer = Customer()
                new_customer.get_user_data_by_email(for_user)

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)

        address_id = Address.add_address(data["country"], data["city"], data["address"], data["district"], data["postal_code"], data["phone"])

        new_customer.update_data(data["first_name"], data["last_name"],
        address_id, data["sub_type"].upper())

        return make_response(jsonify(""), 200)

