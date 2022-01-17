from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Subscription import subscription_model
from src.models.User.user_model import Administrator
import json

class Subscription(Resource):
    def get(self):
        sub_data = subscription_model.Subscription.get_all()

        return make_response(jsonify(sub_data), 200)

    def post(self):
        try:
            user = tokens[request.headers["authorization"]]

            if not isinstance(user, Administrator):
                raise ValueError

            data = json.loads(request.data)
            
            if data["for_sub_type"] not in {"FILMS", "SHOWS", "BOTH"}:
                raise ValueError

            film_cost = None
            episode_cost = None

            try:
                film_cost = data["film"]
            except KeyError:
                pass
            try:
                episode_cost = data["episode"]
            except KeyError:
                pass

            subscription_model.Subscription.update(data["for_sub_type"], film_cost, episode_cost)            
            return make_response(jsonify(""), 200)

        except (KeyError, ValueError):
            return make_response(jsonify(""), 403)
