from storage import dbconn
import datetime
from calendar import monthrange

class Rental:

    @staticmethod
    def get_rentals_for_customer(email):
        cur = dbconn.cursor()
        cur.execute("SELECT rental.rental_id,rental_date,payment.amount,inventory.item_type,film.title,tv_show.title,season.season_number,rental.episode_number " + \
            "FROM rental INNER JOIN customer ON rental.customer_id=customer.customer_id " + \
            "INNER JOIN payment ON payment.rental_id=rental.rental_id " + \
            "INNER JOIN inventory ON inventory.inventory_id=rental.inventory_id " + \
            "LEFT JOIN film ON film.film_id=inventory.film_id " + \
            "LEFT JOIN tv_show ON tv_show.show_id=inventory.show_id " + \
            "LEFT JOIN season ON season.season_id=rental.season_id " + \
            "WHERE customer.email=%s " + \
            "ORDER BY rental_date DESC", (email,))

        res = cur.fetchall()
        cur.close()

        return res

    @staticmethod
    def get_most_rented(most_rented_type):
        prev_date = datetime.date.today()
        prev_date.replace(day=1)
        if prev_date.month == 1:
            prev_date.replace(month=12)
            prev_date.replace(year=prev_date.year-1)
        else:
            prev_date.replace(month=prev_date.month-1)

        first = prev_date.strftime("%Y-%m-%d")
        prev_date.replace(day=monthrange(prev_date.year, prev_date.month)[1])
        last = prev_date.strftime("%Y-%m-%d")
        args = (most_rented_type, 5, first, last)

        cur = dbconn.cursor()
        cur.callproc("most_rented", args)
        res = cur.fetchall()
        cur.close()

        return res

    @staticmethod
    def get_income():
        cur = dbconn.cursor()
        cur.callproc("profits_by_month", tuple())
        res = cur.fetchall()
        cur.close()

        return res

    @staticmethod
    def rent_film(for_user, film_id):
        cur = dbconn.cursor()
        # get inventory id
        cur.execute("SELECT inventory_id FROM inventory WHERE film_id=%s", (film_id,))
        res = cur.fetchall()
        if not res:
            raise ValueError
        inventory_id = res[0][0]
        cur.execute("SELECT movie_cost, customer_id FROM subscription INNER JOIN customer ON subscription.subscription_type=customer.subscription_type WHERE email=%s", (for_user,))
        res = cur.fetchall()
        if not res:
            raise ValueError

        film_cost = res[0][0]
        customer_id = res[0][1]
        print(film_cost, customer_id)

        cur.execute("INSERT INTO rental(rental_date, inventory_id, customer_id) VALUES (NOW(), %s, %s)", (inventory_id, customer_id))
        cur.execute("INSERT INTO payment(customer_id, rental_id, amount, payment_date) VALUES (%s, LAST_INSERT_ID(), %s, NOW())", (customer_id, film_cost))

        dbconn.commit()

        cur.close()

    @staticmethod
    def rent_show(for_user, show_id, season_number, episode_number):
        cur = dbconn.cursor()
        cur.execute("SELECT inventory_id FROM inventory WHERE show_id=%s", (show_id,))
        res = cur.fetchall()
        if not res:
            raise ValueError
        inventory_id = res[0][0]
        cur.execute("SELECT episode_cost, customer_id FROM subscription INNER JOIN customer ON subscription.subscription_type=customer.subscription_type WHERE email=%s", (for_user,))
        res = cur.fetchall()
        if not res:
            raise ValueError

        episode_cost = res[0][0]
        customer_id = res[0][1]

        cur.execute("SELECT season_id, episodes FROM season WHERE show_id=%s AND season_number=%s", (show_id, season_number))
        res = cur.fetchall()
        if not res:
            raise ValueError
        
        season_id = res[0][0]
        total_episodes = res[0][1]

        if episode_number > total_episodes:
            raise ValueError

        cur.execute("INSERT INTO rental(rental_date, inventory_id, season_id, episode_number, customer_id) VALUES (NOW(), %s, %s, %s, %s)", (inventory_id, season_id, episode_number, customer_id))
        cur.execute("INSERT INTO payment(customer_id, rental_id, amount, payment_date) VALUES (%s, LAST_INSERT_ID(), %s, NOW())", (customer_id, episode_cost))

        dbconn.commit()

        cur.close()



        

        