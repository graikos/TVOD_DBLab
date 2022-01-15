from storage import dbconn

class Category:
    def __init__(self, category_id, name):
        self.category_id = category_id
        self.name = name

    def to_dict(self):
        return {
            "category_id": self.category_id,
            "name": self.name
        }

    @staticmethod
    def get_categories(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM category LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        categories = []
        for category in res:
            categories.append(Category(*category))

        return categories

    @staticmethod
    def get_category_by_film_id(film_id):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM film_category WHERE film_id=%s", (film_id,))
        res = cur.fetchall()

        categories = []
        for category in res:
            cur.execute("SELECT * FROM category WHERE category_id=%s", (category[1],))
            category = cur.fetchall()[0]
            categories.append(Category(*category))

        cur.close()

        return categories

    @staticmethod
    def get_category_by_show_id(show_id):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM tv_show_category WHERE show_id=%s", (show_id,))
        res = cur.fetchall()

        categories = []
        for category in res:
            cur.execute("SELECT * FROM category WHERE category_id=%s", (category[1],))
            category = cur.fetchall()[0]
            categories.append(Category(*category))

        cur.close()
        return categories

    @staticmethod
    def add_category(name):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM category WHERE name=%s", (name,))
        res = cur.fetchall()
        if res:
            cur.close()
            return res[0][0]

        cur.execute("INSERT INTO category (name) VALUES (%s)", (name,))
        cur.execute("SELECT LAST_INSERT_ID()")
        new_id = cur.fetchall()[0][0]
        cur.commit()
        cur.close()

        return new_id

    @staticmethod
    def update_category(category_id, name):
        cur = dbconn.cursor()
        cur.execute("UPDATE category SET name=%s WHERE category_id=%s", (name, category_id))
        cur.commit()
        cur.close()

    @staticmethod
    def delete_category(category_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM category WHERE category_id=%s", (category_id,))
        cur.commit()
        cur.close()

    
