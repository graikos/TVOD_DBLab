from storage import dbconn


class Film:
    def __init__(self, film_id, title, description, release_year, language_id, original_language_id, length, rating, special_features, categories, actors):
        self.film_id = film_id
        self.title = title
        self.description = description
        self.release_year = release_year
        self.language_id = language_id
        self.original_language_id = original_language_id
        self.length = length
        self.rating = rating
        self.special_features = tuple(special_features) if special_features else None
        self.categories = categories
        self.actors = actors

    def to_dict(self):
        return {
            "film_id": self.film_id,
            "title": self.title,
            "description": self.description,
            "release_year": self.release_year,
            "language_id": self.language_id,
            "original_language_id": self.original_language_id,
            "length": self.length,
            "rating": self.rating,
            "special_features": self.special_features,
            "categories": self.categories,
            "actors": self.actors
        }

    @staticmethod
    def get_films(start, end):
        films = []

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film ORDER BY film_id ASC LIMIT %s, %s", (start, end))
        film_tuples = cur.fetchall()
        for film in film_tuples:
            cur.execute("SELECT name FROM category INNER JOIN film_category ON category.category_id=film_category.category_id WHERE film_category.film_id=%s", (film[0],))
            categories = cur.fetchall()
            cur.execute("SELECT first_name, last_name FROM actor INNER JOIN film_actor ON actor.actor_id=film_actor.actor_id WHERE film_actor.film_id=%s", (film[0],))
            actors = cur.fetchall()
            films.append(Film(*film, categories, actors))
        
        cur.close()

        return films






