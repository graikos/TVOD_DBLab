from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Film import Film
from src.models.Show import Show
from src.models.User.user_model import User, Customer, Employee, Administrator
from src.models.Actor.actor_model import Actor
from src.models.Language.language_model import Language
from src.models.Category.category_model import Category
from src.models.Address.address_model import Address
from src.models.Country.country_model import Country
from src.models.City.city_model import City
from src.models.Inventory.inventory_model import Inventory

METHODS = {
    "FILMS": Film.get_available_films,
    "SHOWS": Show.get_available_shows,
    "CUSTOMERS": Customer.get_users,
    "EMPLOYEES": Employee.get_users,
    "ACTORS": Actor.get_actors,
    "LANGUAGES": Language.get_languages,
    "CATEGORIES": Category.get_categories,
    "ADDRESSES": Address.get_addresses,
    "COUNTRIES": Country.get_countries,
    "CITIES": City.get_cities,
    "INVENTORY": Inventory.get_inventory,
    "ALL_FILMS": Film.get_all_films,
    "ALL_SHOWS": Show.get_all_shows
}

ALLOWED_METHODS = {
    Customer: {"FILMS", "SHOWS"},
    Employee: {"CUSTOMERS", "ACTORS", "LANGUAGES", "CATEGORIES", "ADDRESSES", "COUNTRIES", "CITIES", "INVENTORY", "ALL_FILMS", "ALL_SHOWS"},
    Administrator: {"EMPLOYEES"}
}

ALLOWED_METHODS[Employee] |= ALLOWED_METHODS[Customer]
ALLOWED_METHODS[Administrator] |= ALLOWED_METHODS[Employee]

class Fetch(Resource):
    def get(self):
        try:
            user = tokens[request.headers["authorization"]]
            fetch_type = request.args.get("type")

            if fetch_type not in METHODS:
                raise ValueError

            if fetch_type not in ALLOWED_METHODS[type(user)]:
                raise ValueError

            if isinstance(user, Customer):
                if user.sub_type != "BOTH" and fetch_type != user.sub_type:
                    raise ValueError        

        except (KeyError, ValueError):
            return make_response("", 403)

        res = METHODS[request.args.get("type")](int(request.args.get("start")), int(request.args.get("end")))
        res_json = [r.to_dict() for r in res]

        return make_response(jsonify(res_json), 200)
        

        

        