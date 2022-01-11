from storage import dbconn



class Film:
    def __init__(self, film_id, title, description, release_year, language, original_language, length, rating, special_features, categories, actors):
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
            "actors": self.actors
        }

    @staticmethod
    def get_available_films(start, end):
        films = []

        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film INNER JOIN inventory ON film.film_id=inventory.film_id ORDER BY film.film_id ASC LIMIT %s, %s", (start, end))
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
            film[7], film[8], categories, actors))
        
        cur.close()

        return films






