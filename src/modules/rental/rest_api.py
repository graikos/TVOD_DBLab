from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.User.user_model import Customer, Employee, Administrator
from src.models.Rental import rental_model
import json


class Rental(Resource):
    def get(self):
        try:
            user = tokens[request.headers["authorization"]]
            if "for_user" in request.args:
                if isinstance(user, Customer) and user.email != request.args.get("for_user"):
                    raise ValueError

                requested_data = rental_model.Rental.get_rentals_for_customer(request.args.get("for_user"))

            elif "most_rented" in request.args:
                if isinstance(user, Customer) or request.args["most_rented"] not in {"m", "s"}:
                    raise ValueError

                requested_data = rental_model.Rental.get_most_rented(request.args.get("most_rented"))
            elif "income" in request.args:
                if not isinstance(user, Administrator):
                    raise ValueError

                requested_data = rental_model.Rental.get_income()
            else:
                raise KeyError

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)

        return make_response(jsonify(requested_data), 200)

    def post(self):
        try:
            user = tokens[request.headers["authorization"]]

            if not isinstance(user, Customer):
                raise ValueError

            data = json.loads(request.data)
            rental_type = data["rental_type"]
            if user.sub_type != "BOTH" and rental_type != user.sub_type or user.email != data["for_user"]:
                raise ValueError

            if rental_type == "SHOWS":
                rental_model.Rental.rent_show(data["for_user"], data["show_id"], data["season_number"], data["episode_number"])
            else:
                rental_model.Rental.rent_film(data["for_user"], data["film_id"])

            return make_response(jsonify(""), 200)

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)

        

        

        