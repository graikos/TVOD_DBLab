import json
from flask_restful import Resource
from flask import request, jsonify, make_response
from storage import tokens
from src.models.Actor.actor_model import Actor
from src.models.Film.film_model import Film
from src.models.Show.show_model import Show
from src.models.Language.language_model import Language
from src.models.Category.category_model import Category
from src.models.Address.address_model import Address
from src.models.City.city_model import City
from src.models.Country.country_model import Country
from src.models.Inventory.inventory_model import Inventory
from src.models.User.user_model import Customer


METHODS = {
    "ACTOR": {
        "ADD": (Actor.add_actor, ("first_name", "last_name")),
        "UPDATE": (Actor.update_actor, ("actor_id", "first_name", "last_name")),
        "DELETE": (Actor.delete_actor, ("actor_id",))
    },
    "FILM": {
        "ADD": (Film.add_film, ("title", "description", "release_year", "language", "original_language", "length", "rating", "special_features")),
        "UPDATE": (Film.update_film, ("film_id", "title", "description", "release_year", "language", "original_language", "length", "rating", "special_features")),
        "UPDATE_ACTORS": (Film.update_film_actors, ("film_id", "new_actors")),
        "UPDATE_CATEGORIES": (Film.update_film_categories, ("film_id", "categories")),
        "DELETE": (Film.delete_film, ("film_id",))
    },
    "SHOW": {
        "ADD": (Show.add_show, ("title", "description", "release_year", "language", "original_language", "length", "rating", "special_features")),
        "UPDATE": (Show.update_show, ("show_id", "title", "description", "release_year", "language", "original_language", "length", "rating", "special_features")),
        "UPDATE_ACTORS": (Show.update_show_actors, ("show_id", "new_actors")),
        "UPDATE_CATEGORIES": (Show.update_show_categories, ("show_id", "categories")),
        "DELETE": (Show.delete_show, ("show_id",))
    },
    "LANGUAGE": {
        "ADD": (Language.add_language, ("name",)),
        "DELETE": (Language.delete_language, ("language_id",))
    },
    "CATEGORY": {
        "ADD": (Category.add_category, ("name",)),
        "UPDATE": (Category.update_category, ("category_id", "name")),
        "DELETE": (Category.delete_category, ("category_id",))
    },
    "ADDRESS": {
        "ADD": (Address.add_address, ("to_country", "to_city", "address", "district", "postal_code", "phone")),
        "UPDATE": (Address.update_address, ("address_id", "address", "district", "city_id", "postal_code", "phone")),
        "DELETE": (Address.delete_address, ("address_id",))
    },
    "CITY": {
        "ADD": (City.add_city, ("to_country", "city")),
        "UPDATE": (City.update_city, ("city_id", "city")),
        "DELETE": (City.delete_city, ("city_id",))
    },
    "COUNTRY": {
        "ADD": (Country.add_country, ("country",)),
        "UPDATE": (Country.update_country, ("country_id", "country")),
        "DELETE": (Country.delete_country, ("country_id",))
    },
    "INVENTORY": {
        "ADD_FILM": (Inventory.add_film, ("film_id",)),
        "ADD_SHOW": (Inventory.add_show, ("show_id",)),
        "DELETE_FILM": (Inventory.remove_film, ("film_id",)),
        "REMOVE_SHOW": (Inventory.remove_show, ("show_id",))
    }
}


class Edit(Resource):
    def put(self):
        try:
            # authenticate
            user = tokens[request.headers["authorization"]]
            if isinstance(user, Customer):
                raise ValueError

            data = json.loads(request.data)

            expected_args = METHODS[data["type"]][data["action"]][1]

            for arg in data:
                if not (arg in {"type", "action"} or arg in expected_args):
                    raise ValueError

            METHODS[data["type"]][data["action"]][0](*(data[x] for x in METHODS[data["type"]][data["action"]][1]))
            
            return make_response(jsonify(""), 200)

        except (KeyError, ValueError, AttributeError):
            return make_response(jsonify(""), 403)