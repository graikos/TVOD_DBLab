from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.User.user_model import User, Administrator, Customer, Employee


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
            "active": requested_data[8],
            "create_date": requested_data[9],
            "sub_type": requested_data[10]
        }), 200)

    def put(self):
        try:
            # authenticate
            user = tokens[request.headers["authorization"]]
            for_user = request.args.get("for_user")
            if not isinstance(user, Employee) and user.email != for_user:
                raise ValueError

            # ensure user is customer
            new_customer = Customer()
            new_customer.get_user_data_by_email(for_user)

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)

        new_customer.update_data(request.args.get("first_name"), request.args.get("last_name"),
        request.args.get("address_id"), request.args.get("sub_type"))

        return make_response(jsonify(""), 200)

