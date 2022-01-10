from storage import dbconn


class Address:
    @staticmethod
    def get_all():
        cursor = dbconn.cursor()
        cursor.execute("SELECT country.country, city.city, address.address, address.district " + \
            "FROM country INNER JOIN city ON country.country_id=city.country_id " + \
            "INNER JOIN address ON city.city_id=address.city_id")
        res = cursor.fetchall()
        cursor.close()

        country_dict = {}

        for t in res:
            if t[0] not in country_dict:
                country_dict[t[0]] = {}
            if t[1] not in country_dict[t[0]]:
                country_dict[t[0]][t[1]] = {}
            if t[2] not in country_dict[t[0]][t[1]]:
                country_dict[t[0]][t[1]][t[2]] = []
            if t[3] not in country_dict[t[0]][t[1]][t[2]]:
                country_dict[t[0]][t[1]][t[2]].append(t[3])

        return country_dict

    @staticmethod
    def get_address_by_id(address_id):
        cursor = dbconn.cursor()
        cursor.execute("SELECT country.country, city.city, address.address, address.district " + \
            "FROM country INNER JOIN city ON country.country_id=city.country_id " + \
            "INNER JOIN address ON city.city_id=address.city_id " + \
            "WHERE address.address_id=%s", (address_id,))
        res = cursor.fetchone()
        cursor.close()

        return res




