from storage import dbconn


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
            cur.execute("SELECT * FROM season WHERE show_id=%s ORDER BY release_year, season_id ASC", (show[0],))
            seasons = cur.fetchall()
            season_list = []
            for season in seasons:
                season_list.append({
                    "season_id": season[0],
                    "show_id": season[1],
                    "release_year": season[2],
                    "season_number": season[3],
                    "episodes": season[4]
                })
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[4],))
            language = cur.fetchall()
            language = language[0] if language else None
            cur.execute("SELECT name FROM language WHERE language_id=%s", (show[5],))
            original_language = cur.fetchall()
            original_language = original_language[0] if original_language else None

            shows.append(Show(show[0], show[1], show[2], show[3], language, original_language, season_list, show[6], show[7], categories, actors))


        cur.close()

        return shows






