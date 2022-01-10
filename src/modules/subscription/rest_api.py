from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Subscription import subscription_model

class Subscription(Resource):
    def get(self):
        sub_data = subscription_model.Subscription.get_all()

        sub_dict = {}

        for sub in sub_data:
            sub_dict[sub[0]] = {
                "film_cost": sub[1],
                "episode_cost": sub[2]
            }

        return make_response(jsonify(sub_data), 200)
