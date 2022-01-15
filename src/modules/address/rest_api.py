from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Address import address_model


class Address(Resource):
    def get(self):
        address_data = address_model.Address.get_all()

        return make_response(jsonify(address_data), 200)
