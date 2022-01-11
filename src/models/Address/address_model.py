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
        cursor.execute("SELECT country.country, city.city, address.address, address.district, address.postal_code, address.phone " + \
            "FROM country INNER JOIN city ON country.country_id=city.country_id " + \
            "INNER JOIN address ON city.city_id=address.city_id " + \
            "WHERE address.address_id=%s", (address_id,))
        res = cursor.fetchone()
        cursor.close()

        return res

    @staticmethod
    def get_id_by_address(country, city, address, district):
        cursor = dbconn.cursor()
        cursor.execute("SELECT address.address_id " + \
            "FROM country INNER JOIN city ON country.country_id=city.country_id " + \
            "INNER JOIN address ON city.city_id=address.city_id " + \
            "WHERE country.country=%s AND city.city=%s AND address.address=%s AND address.district=%s", (country, city, address, district))
        res = cursor.fetchall()
        cursor.close()

        return res

    # adds address and returns address ID
    @staticmethod
    def add_address(to_country, to_city, new_address, new_district, new_postal_code, new_phone):
        cursor = dbconn.cursor()
        # check if address exists
        cursor.execute("SELECT address_id FROM address INNER JOIN city ON address.city_id=city.city_id INNER JOIN country ON city.country_id=country.country_id WHERE country.country=%s AND city.city=%s AND address.address=%s AND district=%s AND postal_code=%s AND phone=%s", (to_country, to_city, new_address, new_district, new_postal_code, new_phone))
        res = cursor.fetchall()

        # if it exists, return its id
        if res:
            return res[0][0]

        # find city id
        cursor.execute("SELECT city_id FROM city INNER JOIN country ON city.country_id=country.country_id WHERE city.city=%s AND country.country=%s", (to_city, to_country))
        res = cursor.fetchall()
        if not res:
            raise ValueError
        city_id = res[0][0]

        # insert new address and return its id
        cursor.execute("INSERT INTO address (address, district, city_id, postal_code, phone) VALUES (%s, %s, %s, %s, %s)", (new_address, new_district, city_id, new_postal_code, new_phone))
        cursor.execute("SELECT LAST_INSERT_ID()")
        address_id = cursor.fetchall()[0][0]
        cursor.close()

        return address_id




