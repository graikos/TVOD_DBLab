from storage import dbconn

class Log:
    def __init__(self, log_id, email, user_type, log_date, success, action_type, on_table):
        self.log_id = log_id
        self.email = email
        self.user_type = user_type
        self.log_date = log_date
        self.success = success
        self.action_type = action_type
        self.on_table = on_table

    def to_dict(self):
        return {
            "log_id": self.log_id,
            "email": self.email,
            "user_type": self.user_type,
            "log_date": self.log_date,
            "success": self.success,
            "action_type": self.action_type,
            "on_table": self.on_table
        }

    @staticmethod
    def get_logs(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM logger ORDER BY log_date DESC LIMIT %s, %s", (start, end))
        res = cur.fetchall()
        cur.close()

        log_items = []
        for item in res:
            log_items.append(Log(*item))

        return log_items
