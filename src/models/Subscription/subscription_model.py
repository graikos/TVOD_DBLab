from storage import dbconn

class Subscription:
    @staticmethod
    def get_all():
        cursor = dbconn.cursor()
        cursor.execute("SELECT * FROM subscription")
        res = cursor.fetchall()
        cursor.close()

        return res
            