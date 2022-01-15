from storage import dbconn

class City:
    def __init__(self, city_id, city, country_id):
        self.city_id = city_id
        self.city = city
        self.country_id = country_id

    def to_dict(self):
        return {
            "city_id": self.city_id,
            "city": self.city,
            "country_id": self.country_id
        }

    @staticmethod
    def get_cities(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM city LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        cities = []
        for city in res:
            cities.append(City(*city))

        return cities

    @staticmethod
    def add_city(to_country, city):
        cur = dbconn.cursor()
        cur.execute("SELECT country_id FROM country WHERE country.country=%s", (to_country,))
        res = cur.fetchall()
        if not res:
            cur.close()
            raise ValueError
        
        country_id = res[0][0]
        cur.execute("INSERT INTO city(city, country_id) VALUES (%s, %s)", (city, country_id))
        cur.commit()
        cur.close()

    @staticmethod
    def update_city(city_id, city):
        cur = dbconn.cursor()
        cur.execute("UPDATE city SET city=%s WHERE city_id=%s", (city, city_id))
        cur.commit()
        cur.close()

    @staticmethod
    def delete_city(city_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM city WHERE city_id=%s", (city_id,))
        cur.commit()
        cur.close()
