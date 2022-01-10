from flask_restful import Resource
from flask import request, jsonify, make_response
from . import lib
from secrets import token_hex
from src.models.User.user_model import Administrator, Customer, Employee
from storage import tokens

user_types = {Customer: "Customer", Employee: "Employee", Administrator: "Administrator"}

class Login(Resource):
    def post(self):
        user = request.authorization["username"]
        password = request.authorization["password"]
        try:
            user = lib.check_credentials(user, password)
            token = token_hex(64)
            tokens[token] = user

            return make_response(jsonify({
                "type": user_types[type(user)],
                "email": user.email,
                "first_name": user.first_name,
                "last_name": user.last_name,
                "token": token,
                "sub_type": user.sub_type
            }), 200)
            
        except ValueError:
            return make_response(jsonify(""), 404)

        

            
        
        