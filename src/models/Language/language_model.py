from storage import dbconn

class Language:
    def __init__(self, language_id, name):
        self.language_id = language_id
        self.name = name

    def to_dict(self):
        return {
            "language_id": self.language_id,
            "name": self.name
        }

    @staticmethod
    def get_languages(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM language LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        languages = []
        for language in res:
            languages.append(Language(*language))

        return languages

    @staticmethod
    def add_language(name):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM language where name=%s", (name,))
        res = cur.fetchall()
        if res:
            cur.close()
            return res[0][0]

        cur.execute("INSERT INTO language (name) VALUES (%s)", (name,))
        cur.execute("SELECT LAST_INSERT_ID()")
        new_id = cur.fetchall()[0][0]
        dbconn.commit()
        cur.close()

        return new_id

    @staticmethod
    def delete_language(language_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM language WHERE language_id=%s", (language_id,))
        dbconn.commit()
        cur.close()
