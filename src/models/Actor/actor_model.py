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
    def add_actor(first_name, last_name):
        cur = dbconn.cursor()
        cur.execute("INSERT INTO actor (first_name, last_name) VALUES (%s,%s)", (first_name, last_name))
        cur.commit()
        cur.close()

    @staticmethod
    def update_actor(actor_id, first_name, last_name):
        cur = dbconn.cursor()
        cur.execute("UPDATE actor SET first_name=%s,last_name=%s WHERE actor_id=%s", (first_name, last_name, actor_id))
        cur.commit()
        cur.close()

    @staticmethod
    def delete_actor(actor_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM actor WHERE actor_id=%s", (actor_id,))
        cur.commit()
        cur.close()
