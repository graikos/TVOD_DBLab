from storage import dbconn

class Subscription:
    @staticmethod
    def get_all():
        cursor = dbconn.cursor()
        cursor.execute("SELECT * FROM subscription")
        res = cursor.fetchall()
        cursor.close()

        return res

    @staticmethod
    def update(sub_type, film_cost, episode_cost):
        if film_cost is None and episode_cost is None:
            raise ValueError

        args = []
        
        cursor = dbconn.cursor()
        query = "UPDATE subscription SET "
        if film_cost is not None:
            query += "movie_cost=%s,"
            args.append(film_cost)

        if episode_cost is None:
            query = query[:-1]
        else:
            query += "episode_cost=%s "
            args.append(episode_cost)

        query += "WHERE subscription_type=%s"
        args.append(sub_type)

        cur = dbconn.cursor()
        cur.execute(query, tuple(args))
        cur.commit()
        cur.close()

            