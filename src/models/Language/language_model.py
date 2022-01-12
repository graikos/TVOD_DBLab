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
        cur.execute("INSERT INTO language (name) VALUES (%s)", (name,))
        cur.commit()
        cur.close()

    @staticmethod
    def delete_language(language_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM language WHERE language_id=%s", (language_id,))
        cur.commit()
        cur.close()
