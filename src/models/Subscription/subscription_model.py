from storage import dbconn

class Subscription:
    def __init__(self, sub_type, film_cost, episode_cost):
        self.sub_type = sub_type
        self.film_cost = film_cost
        self.episode_cost = episode_cost


    @staticmethod
    def get_all():
        cursor = dbconn.cursor()
        cursor.execute("SELECT * FROM subscription")
        res = cursor.fetchall()
        cursor.close()

        return res
            