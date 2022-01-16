from storage import dbconn
from src.models.lib import pack_values_into_sql_insert, get_value_tuple
from src.models.Language.language_model import Language
from src.models.Actor.actor_model import Actor
from src.models.Category.category_model import Category


class Film:
    def __init__(self, film_id, title, description, release_year, language, original_language, length, rating, special_features, categories, actors, in_inventory):
        self.film_id = film_id
        self.title = title
        self.description = description
        self.release_year = release_year
        self.language = language
        self.original_language = original_language
        self.length = length
        self.rating = rating
        self.special_features = tuple(special_features) if special_features else None
        self.categories = categories
        self.actors = actors
        self.in_inventory = in_inventory

    def to_dict(self):
        return {
            "film_id": self.film_id,
            "title": self.title,
            "description": self.description,
            "release_year": self.release_year,
            "language": self.language,
            "original_language": self.original_language,
            "length": self.length,
            "rating": self.rating,
            "special_features": self.special_features,
            "categories": self.categories,
            "actors": self.actors,
            "in_inventory": self.in_inventory
        }

    @staticmethod
    def get_available_films(start, end):
        films = []

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film INNER JOIN inventory ON film.film_id=inventory.film_id ORDER BY film.title ASC LIMIT %s, %s", (start, end))
        film_tuples = cur.fetchall()
        for film in film_tuples:
            cur.execute("SELECT name FROM category INNER JOIN film_category ON category.category_id=film_category.category_id WHERE film_category.film_id=%s", (film[0],))
            categories = cur.fetchall()
            cur.execute("SELECT first_name, last_name FROM actor INNER JOIN film_actor ON actor.actor_id=film_actor.actor_id WHERE film_actor.film_id=%s", (film[0],))
            actors = cur.fetchall()
            cur.execute("SELECT name FROM language WHERE language_id=%s", (film[4],))
            language = cur.fetchall()
            language = language[0] if language else None
            cur.execute("SELECT name FROM language WHERE language_id=%s", (film[5],))
            original_language = cur.fetchall()
            original_language = original_language[0] if original_language else None

            films.append(Film(film[0], film[1], film[2], film[3], language, original_language, film[6],
            film[7], film[8], categories, actors, True))
        
        cur.close()

        return films

    @staticmethod
    def get_all_films(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film ORDER BY title ASC LIMIT %s,%s", (start, end))
        res = cur.fetchall()

        films = []
        for film in res:
            cur.execute("SELECT name FROM category INNER JOIN film_category ON category.category_id=film_category.category_id WHERE film_category.film_id=%s", (film[0],))
            categories = cur.fetchall()
            cur.execute("SELECT first_name, last_name FROM actor INNER JOIN film_actor ON actor.actor_id=film_actor.actor_id WHERE film_actor.film_id=%s", (film[0],))
            actors = cur.fetchall()
            cur.execute("SELECT name FROM language WHERE language_id=%s", (film[4],))
            language = cur.fetchall()
            language = language[0] if language else None
            cur.execute("SELECT name FROM language WHERE language_id=%s", (film[5],))
            original_language = cur.fetchall()
            original_language = original_language[0] if original_language else None

            cur.execute("SELECT * FROM inventory WHERE film_id=%s LIMIT 1", (film[0],))
            in_inventory = bool(cur.fetchall())

            films.append(Film(film[0], film[1], film[2], film[3], language, original_language, film[6],
            film[7], film[8], categories, actors, in_inventory))

        cur.close()

        return films

    @staticmethod
    def add_film(title, description, release_year, language, original_language, length, rating, special_features):
        cur = dbconn.cursor()

        language_id = Language.add_language(language)
        original_language_id = Language.add_language(original_language)

        cur.execute("INSERT INTO film(title, description, release_year, language_id, original_language_id, length, rating, special_features) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", (title, description, release_year, language_id, original_language_id, length, rating, special_features))
        dbconn.commit()
        cur.close()

    @staticmethod
    def update_film(film_id, title, description, release_year, language, original_language, length, rating, special_features):
        cur = dbconn.cursor()

        language_id = Language.add_language(language)
        original_language_id = Language.add_language(original_language)

        cur.execute("UPDATE film SET title=%s,description=%s,release_year=%s,language_id=%s,original_language_id=%s,length=%s,rating=%s,special_features=%s WHERE film_id=%s", (title, description, release_year, language_id, original_language_id, length, rating, special_features, film_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def update_film_actors(film_id, actors):
        actor_query_vals = []
        for actor in actors:
            actor_query_vals.append((Actor.add_actor(actor[0], actor[1]), film_id))

        actor_query = pack_values_into_sql_insert("film_actor", len(actor_query_vals), 2)

        cur = dbconn.cursor()
        cur.execute("DELETE FROM film_actor WHERE film_id=%s", (film_id,))
        if actor_query:
            cur.execute(actor_query, get_value_tuple(actor_query_vals))
        dbconn.commit()
        cur.close()

    @staticmethod
    def add_film_actor(film_id, first_name, last_name):
        actor_id = Actor.add_actor(first_name, last_name)

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film_actor WHERE film_id=%s AND actor_id=%s", (film_id, actor_id))
        res = cur.fetchall()

        if not res:
            cur.execute("INSERT INTO film_actor VALUES (%s, %s)", (actor_id, film_id))
            dbconn.commit()

        cur.close()

    @staticmethod
    def delete_film_actor(film_id, actor_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM film_actor WHERE film_id=%s AND actor_id=%s", (film_id, actor_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def update_film_categories(film_id, categories):
        category_query_vals = []
        for category in categories:
            category_query_vals.append((film_id, Category.add_category(category)))
        
        category_query = pack_values_into_sql_insert("film_category", len(category_query_vals), 2)

        cur = dbconn.cursor()
        cur.execute("DELETE FROM film_category WHERE film_id=%s", (film_id,))
        if category_query:
            cur.execute(category_query, get_value_tuple(category_query_vals))
        dbconn.commit()
        cur.close()

    @staticmethod
    def add_film_category(film_id, name):
        category_id = Category.add_category(name)

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film_category WHERE film_id=%s AND category_id=%s", (film_id, category_id))
        res = cur.fetchall()

        if not res:
            cur.execute("INSERT INTO film_category VALUES (%s, %s)", (film_id, category_id))
            dbconn.commit()

        cur.close()

    @staticmethod
    def delete_film_category(film_id, category_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM film_category WHERE film_id=%s AND category_id=%s", (film_id, category_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def delete_film(film_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM film WHERE film_id=%s", (film_id,))
        dbconn.commit()
        cur.close()
