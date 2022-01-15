from storage import dbconn

class Actor:
    def __init__(self, actor_id, first_name, last_name):
        self.actor_id = actor_id
        self.first_name = first_name
        self.last_name = last_name

    def to_dict(self):
        return {
            "actor_id": self.actor_id,
            "first_name": self.first_name,
            "last_name": self.last_name
        }

    @staticmethod
    def get_actors(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM actor LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        actors = []
        for actor in res:
            actors.append(Actor(*actor))

        return actors

    @staticmethod
    def get_actor_by_film_id(film_id):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film_actor WHERE film_id=%s", (film_id,))
        res = cur.fetchall()

        actors = []
        for actor in res:
            cur.execute("SELECT * FROM actor WHERE actor_id=%s", (actor[0],))
            actor = cur.fetchall()[0]
            actors.append(Actor(*actor))

        cur.close()

        return actors

    @staticmethod
    def get_actor_by_show_id(show_id):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM tv_show_actor WHERE show_id=%s", (show_id,))
        res = cur.fetchall()

        actors = []
        for actor in res:
            cur.execute("SELECT * FROM actor WHERE actor_id=%s", (actor[0],))
            actor = cur.fetchall()[0]
            actors.append(Actor(*actor))

        cur.close()

        return actors

    @staticmethod
    def add_actor(first_name, last_name):
        cur = dbconn.cursor()

        cur.execute("SELECT * FROM actor WHERE first_name=%s AND last_name=%s", (first_name, last_name))
        res = cur.fetchall()

        if res:
            cur.close()
            return res[0][0]

        cur.execute("INSERT INTO actor (first_name, last_name) VALUES (%s,%s)", (first_name, last_name))
        cur.execute("SELECT LAST_INSERT_ID()")
        new_id = cur.fetchall()[0][0]
        dbconn.commit()
        cur.close()

        return new_id



    @staticmethod
    def update_actor(actor_id, first_name, last_name):
        cur = dbconn.cursor()
        cur.execute("UPDATE actor SET first_name=%s,last_name=%s WHERE actor_id=%s", (first_name, last_name, actor_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def delete_actor(actor_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM actor WHERE actor_id=%s", (actor_id,))
        dbconn.commit()
        cur.close()
