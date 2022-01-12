from storage import dbconn

class Inventory:
    def __init__(self, inventory_id, film_id, show_id, item_type):
        self.inventory_id = inventory_id
        self.film_id = film_id
        self.show_id = show_id
        self.item_type = item_type

    def to_dict(self):
        return {
            "inventory_id": self.inventory_id,
            "film_id": self.film_id,
            "show_id": self.show_id,
            "item_type": self.item_type
        }

    @staticmethod
    def get_inventory(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM inventory LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        inventory_items = []
        for inventory_item in res:
            inventory_items.append(Inventory(*inventory_item))

        return inventory_items

    @staticmethod
    def add_film(film_id):
        cur = dbconn.cursor()
        cur.execute("INSERT INTO inventory (film_id, item_type) VALUES (%s,'FILM')", (film_id,))
        cur.commit()
        cur.close()

    @staticmethod
    def add_show(show_id):
        cur = dbconn.cursor()
        cur.execute("INSERT INTO inventory (show_id, item_type) VALUES (%s,'SHOW')", (show_id,))
        cur.commit()
        cur.close()

    @staticmethod
    def remove_film(film_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM inventory WHERE film_id=%s", (film_id,))
        cur.commit()
        cur.close()

    @staticmethod
    def remove_show(show_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM inventory WHERE show_id=%s", (show_id,))
        cur.commit()
        cur.close()
        
