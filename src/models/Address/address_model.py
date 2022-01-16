from storage import dbconn


class Address:
    def __init__(self, address_id, address, district, city_id, postal_code, phone, city):
        self.address_id = address_id
        self.address = address
        self.district = district
        self.city_id = city_id
        self.postal_code = postal_code
        self.phone = phone
        self.city = city

    def to_dict(self):
        return {
            "address_id": self.address_id,
            "address": self.address,
            "district": self.district,
            "city_id": self.city_id,
            "postal_code": self.postal_code,
            "phone": self.phone,
            "city": self.city
        }

    @staticmethod
    def get_addresses(start, end):
        cur = dbconn.cursor()
        cur.execute("SELECT address_id,address,district,address.city_id,postal_code,phone,city FROM address INNER JOIN city ON address.city_id=city.city_id LIMIT %s,%s", (start, end))
        res = cur.fetchall()
        cur.close()

        addresses = []
        for address in res:
            addresses.append(Address(*address))

        return addresses

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
    def add_address(city_id, new_address, new_district, new_postal_code, new_phone):
        cursor = dbconn.cursor()
        # check if address exists
        cursor.execute("SELECT address_id FROM address INNER JOIN city ON address.city_id=city.city_id WHERE city.city_id=%s AND address.address=%s AND district=%s AND postal_code=%s AND phone=%s", (city_id, new_address, new_district, new_postal_code, new_phone))
        res = cursor.fetchall()

        # if it exists, return its id
        if res:
            cursor.close()
            return res[0][0]

        # insert new address and return its id
        cursor.execute("INSERT INTO address (address, district, city_id, postal_code, phone) VALUES (%s, %s, %s, %s, %s)", (new_address, new_district, city_id, new_postal_code, new_phone))
        cursor.execute("SELECT LAST_INSERT_ID()")
        address_id = cursor.fetchall()[0][0]
        cursor.close()

        return address_id

    @staticmethod
    def update_address(address_id, address, district, city_id, postal_code, phone):
        cur = dbconn.cursor()
        cur.execute("UPDATE address SET address=%s,district=%s,city_id=%s,postal_code=%s,phone=%s WHERE address_id=%s", (address, district, city_id, postal_code, phone, address_id))
        dbconn.commit()
        cur.close()

    @staticmethod
    def delete_address(address_id):
        cur = dbconn.cursor()
        cur.execute("DELETE FROM address WHERE address_id=%s", (address_id,))
        dbconn.commit()
        cur.close()




