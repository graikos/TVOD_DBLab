from storage import dbconn

class Country:
    def __init__(self, country_id, country):
        self.country_id = country_id
        self.country = country

    def to_dict(self):
        return {
            "country_id": self.country_id,
            "country": self.country
        }

    @staticmethod
    def get_countries(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM country LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        countries = []
        for country in res:
            countries.append(Country(*country))

        return countries

    @staticmethod
    def get_all_countries():
        cur = dbconn.cursor()
        cur.execute("SELECT * FROM country")
        res = cur.fetchall()
        cur.close()

        all_countries = []
        for country in res:
            all_countries.append(Country(*country))

        return all_countries

    @staticmethod
    def add_country(country):
        cur = dbconn.cursor()
        cur.execute("INSERT INTO country (country) VALUES (%s)", (country,))
        dbconn.commit()
        cur.close()

    @staticmethod
    def update_country(country_id, country):
        cur = dbconn.cursor()
        cur.execute("UPDATE country SET country.country=%s WHERE country_id=%s", (country, country_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def delete_country(country_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM country WHERE country_id=%s", (country_id,))
        dbconn.commit()
        cur.close()
