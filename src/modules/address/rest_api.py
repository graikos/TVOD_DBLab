from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Address import address_model


class Address(Resource):
    def get(self):
        address_data = address_model.Address.get_all()

        return make_response(jsonify(address_data), 200)
        
        '''
        # for getting address data for specific ID
        address_details = address_model.Address.get_address_by_id(request.args.get("address_id"))

        if not address_details:
            return make_response(jsonify(""), 404)

        return make_response(jsonify({
            "country": address_details[0],
            "city": address_details[1],
            "address": address_details[2],
            "district": address_details[3]
        }), 200)
        '''
