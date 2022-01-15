from storage import dbconn
from src.models.lib import pack_values_into_sql_insert, get_value_tuple
from src.models.Language.language_model import Language
from src.models.Actor.actor_model import Actor
from src.models.Category.category_model import Category

class Show:
    def __init__(self, show_id, title, description, release_year, language, original_language, seasons, rating, special_features, categories, actors):
        self.show_id = show_id
        self.title = title
        self.description = description
        self.release_year = release_year
        self.language = language
        self.original_language = original_language
        self.seasons = seasons
        self.rating = rating
        self.special_features = tuple(special_features) if special_features else None
        self.categories = categories
        self.actors = actors

    def to_dict(self):
        return {
            "show_id": self.show_id,
            "title": self.title,
            "description": self.description,
            "release_year": self.release_year,
            "language": self.language,
            "original_language": self.original_language,
            "seasons": self.seasons,
            "rating": self.rating,
            "special_features": self.special_features,
            "categories": self.categories,
            "actors": self.actors
        }

    @staticmethod
    def get_available_shows(start, end):
        shows = []

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM tv_show INNER JOIN inventory ON tv_show.show_id=inventory.show_id ORDER BY tv_show.show_id ASC LIMIT %s, %s", (start, end))
        show_tuples = cur.fetchall()
        for show in show_tuples:
            cur.execute("SELECT name FROM category INNER JOIN tv_show_category ON category.category_id=tv_show_category.category_id WHERE tv_show_category.show_id=%s", (show[0],))
            categories = cur.fetchall()
            cur.execute("SELECT first_name, last_name FROM actor INNER JOIN tv_show_actor ON actor.actor_id=tv_show_actor.actor_id WHERE tv_show_actor.show_id=%s", (show[0],))
            actors = cur.fetchall()
            cur.execute("SELECT season_id,show_id,season_number,episodes FROM season WHERE show_id=%s ORDER BY release_year, season_id ASC", (show[0],))
            seasons = cur.fetchall()
            season_list = []
            for season in seasons:
                season_list.append({
                    "season_id": season[0],
                    "show_id": season[1],
                    "season_number": season[2],
                    "episodes": season[3]
                })
            season_list.sort(key = lambda season_dict: season_dict["season_number"])
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[4],))
            language = cur.fetchall()
            language = language[0] if language else None
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[5],))
            original_language = cur.fetchall()
            original_language = original_language[0] if original_language else None

            shows.append(Show(show[0], show[1], show[2], show[3], language, original_language, season_list, show[6], show[7], categories, actors))


        cur.close()

        return shows

    @staticmethod
    def get_all_shows(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM tv_show LIMIT %s,%s", (start, end))
        res = cur.fetchall()

        shows = []

        for show in res:
            cur.execute("SELECT name FROM category INNER JOIN tv_show_category ON category.category_id=tv_show_category.category_id WHERE tv_show_category.show_id=%s", (show[0],))
            categories = cur.fetchall()
            cur.execute("SELECT first_name, last_name FROM actor INNER JOIN tv_show_actor ON actor.actor_id=tv_show_actor.actor_id WHERE tv_show_actor.show_id=%s", (show[0],))
            actors = cur.fetchall()
            cur.execute("SELECT season_id,show_id,season_number,episodes FROM season WHERE show_id=%s ORDER BY release_year, season_id ASC", (show[0],))
            seasons = cur.fetchall()
            season_list = []
            for season in seasons:
                season_list.append({
                    "season_id": season[0],
                    "show_id": season[1],
                    "season_number": season[2],
                    "episodes": season[3]
                })
            season_list.sort(key = lambda season_dict: season_dict["season_number"])
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[4],))
            language = cur.fetchall()
            language = language[0] if language else None
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[5],))
            original_language = cur.fetchall()
            original_language = original_language[0] if original_language else None

            shows.append(Show(show[0], show[1], show[2], show[3], language, original_language, season_list, show[6], show[7], categories, actors))

        cur.close()

        return shows

    @staticmethod
    def add_show(title, description, release_year, language, original_language, length, rating, special_features):
        cur = dbconn.cursor()

        language_id = Language.add_language(language)
        original_language_id = Language.add_language(original_language)

        cur.execute("INSERT INTO tv_show(title, description, release_year, language_id, original_language_id, length, rating, special_features) VALUES (%s, %s, %s, %s, %s, %s, %s, %s)", (title, description, release_year, language_id, original_language_id, length, rating, special_features))
        cur.execute("SELECT LAST_INSERT_ID()")

        cur.commit()
        cur.close()

    @staticmethod
    def update_show(show_id, title, description, release_year, language, original_language, length, rating, special_features):
        cur = dbconn.cursor()

        language_id = Language.add_language(language)
        original_language_id = Language.add_language(original_language)

        cur.execute("UPDATE tv_show SET title=%s,description=%s,release_year=%s,language_id=%s,original_language_id=%s,length=%s,rating=%s,special_features=%s WHERE show_id=%s", (title, description, release_year, language_id, original_language_id, length, rating, special_features, show_id))
        cur.commit()
        cur.close()

    @staticmethod
    def update_show_actors(show_id, actors):
        actor_query_vals = []
        for actor in actors:
            actor_query_vals.append((Actor.add_actor(actor[0], actor[1]), show_id))

        actor_query = pack_values_into_sql_insert("tv_show_actor", len(actor_query_vals), 2)

        cur = dbconn.cursor()
        cur.execute("DELETE FROM tv_show_actor WHERE show_id=%s", (show_id,))
        cur.execute(actor_query, get_value_tuple(actor_query_vals))
        cur.commit()
        cur.close()

    @staticmethod
    def update_show_categories(show_id, categories):
        category_query_vals = []
        for category in categories:
            category_query_vals.append((show_id, Category.add_category(category)))

        category_query = pack_values_into_sql_insert("tv_show_category", len(category_query_vals), 2)

        cur = dbconn.cursor()
        cur.execute("DELETE FROM tv_show_category WHERE show_id=%s", (show_id,))
        cur.execute(category_query, get_value_tuple(category_query_vals))
        cur.commit()
        cur.close()

    @staticmethod
    def update_show_seasons(show_id, seasons):
        # seasons: dict of form {season_number: episodes}
        season_query_vals = []
        for season in seasons:
            season_query_vals.append((show_id, season, seasons[season]))

        season_query = pack_values_into_sql_insert("season", len(season_query_vals), 3, table_cols=("show_id", "season_number", "episodes"))

        cur = dbconn.cursor()
        cur.execute("DELETE FROM season WHERE show_id=%s", (show_id,))
        cur.execute(season_query, get_value_tuple(season_query_vals))
        cur.commit()
        cur.close()

    @staticmethod
    def delete_show(show_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM tv_show WHERE show_id=%s", (show_id,))
        cur.commit()
        cur.close()
