from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Film import Film
from src.models.Show import Show

METHODS = {"FILMS": Film.get_available_films, "SHOWS": Show.get_available_shows}

class Fetch(Resource):
    def get(self):
        try:
            user = tokens[request.headers["authorization"]]
            fetch_type = request.args.get("type")
            if user.sub_type != "BOTH" and fetch_type != user.sub_type or fetch_type not in METHODS:
                raise ValueError

        except (KeyError, ValueError):
            return make_response("", 403)
        
        method = METHODS[request.args.get("type")]

        res = method(int(request.args.get("start")), int(request.args.get("end")))
        res_json = [r.to_dict() for r in res]

        return make_response(jsonify(res_json), 200)
        

        

        