from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Film import Film
from src.models.Show import Show
from src.models.Season import Season
from src.models.User import Customer, Employee, Administrator
from src.models.Actor import Actor
from src.models.Language import Language
from src.models.Category import Category
from src.models.Address import Address
from src.models.Country import Country
from src.models.City import City
from src.models.Inventory import Inventory

METHODS = {
    "FILMS": (Film.get_available_films, ("start", "end")),
    "SHOWS": (Show.get_available_shows, ("start", "end")),
    "CUSTOMERS": (Customer.get_users, ("start", "end")),
    "EMPLOYEES": (Employee.get_users, ("start", "end")),
    "ACTORS": (Actor.get_actors, ("start", "end")),
    "LANGUAGES": (Language.get_languages, ("start", "end")),
    "CATEGORIES": (Category.get_categories, ("start", "end")),
    "ADDRESSES": (Address.get_addresses, ("start", "end")),
    "COUNTRIES": (Country.get_countries, ("start", "end")),
    "CITIES": (City.get_cities, ("start", "end")),
    "INVENTORY": (Inventory.get_inventory, ("start", "end")),
    "ALL_FILMS": (Film.get_all_films, ("start", "end")),
    "ALL_SHOWS": (Show.get_all_shows, ("start", "end")),
    "ACTORS_BY_FILM_ID": (Actor.get_actor_by_film_id, ("film_id",)),
    "ACTORS_BY_SHOW_ID": (Actor.get_actor_by_show_id, ("show_id",)),
    "CATEGORIES_BY_FILM_ID": (Category.get_category_by_film_id, ("film_id",)),
    "CATEGORIES_BY_SHOW_ID": (Category.get_category_by_show_id, ("show_id",)),
    "SEASONS_BY_SHOW_ID": (Season.get_show_seasons_by_id, ("show_id",)),
    "ALL_COUNTRIES": (Country.get_all_countries, ()),
    "ALL_CITIES": (City.get_all_cities, ())
}

ALLOWED_METHODS = {
    Customer: {"FILMS", "SHOWS"},
    Employee: {"CUSTOMERS", "ACTORS", "LANGUAGES", "CATEGORIES", "ADDRESSES", "COUNTRIES", "CITIES", "INVENTORY", "ALL_FILMS", "ALL_SHOWS", "ACTORS_BY_FILM_ID", "ACTORS_BY_SHOW_ID", "CATEGORIES_BY_FILM_ID", "CATEGORIES_BY_SHOW_ID", "SEASONS_BY_SHOW_ID", "ALL_COUNTRIES", "ALL_CITIES"},
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


        for arg in request.args:
            if arg != "type" and arg not in METHODS[request.args.get("type")][1]:
                raise ValueError

        res = METHODS[request.args.get("type")][0](*(int(request.args.get(x)) for x in METHODS[request.args.get("type")][1]))
        res_json = [r.to_dict() for r in res]

        return make_response(jsonify(res_json), 200)
        

        

        