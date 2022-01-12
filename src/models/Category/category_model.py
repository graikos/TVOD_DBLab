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
    def add_category(name):
        cur = dbconn.cursor()
        cur.execute("INSERT INTO category (name) VALUES (%s)", (name,))
        cur.commit()
        cur.close()

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

    
