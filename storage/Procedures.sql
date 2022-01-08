DELIMITER $
DROP PROCEDURE IF EXISTS most_rented$
CREATE PROCEDURE most_rented(IN item_type CHAR, IN amount INT, IN date1 DATE, IN date2 DATE)
BEGIN
    IF (item_type = 'm') THEN
        SELECT film.film_id, title 
        FROM film INNER JOIN inventory ON film.film_id = inventory.film_id
        INNER JOIN rental ON inventory.inventory_id = rental.inventory_id
        WHERE rental.rental_date >= date1 AND rental.rental_date <= date2
        GROUP BY inventory.inventory_id
        ORDER BY COUNT(*) DESC LIMIT amount;
    ELSEIF (item_type = 's') THEN
        SELECT tv_show.show_id, title
        FROM tv_show INNER JOIN inventory ON tv_show.show_id = inventory.film_id
        INNER JOIN rental ON inventory.inventory_id = rental.inventory_id
        WHERE rental.rental_date >= date1 AND rental.rental_date <= date2
        GROUP BY inventory.inventory_id
        ORDER BY COUNT(*) DESC LIMIT amount;
    END IF;
END$


DROP PROCEDURE IF EXISTS rentals_on_date$
CREATE PROCEDURE rentals_on_date(IN email VARCHAR(50), IN date1 DATE, OUT result INT)
BEGIN
    SELECT COUNT(*) INTO result
    FROM customer INNER JOIN rental ON customer.customer_id = rental.customer_id 
    WHERE customer.email = email AND CAST(rental.rental_date AS DATE) = date1;
END$

DROP PROCEDURE IF EXISTS profits_by_month$
CREATE PROCEDURE profits_by_month()
BEGIN
    SELECT YEAR(payment_date) AS p_y, MONTH(payment_date) AS p_m, SUM(amount) FROM payment GROUP BY p_y, p_m;
END$

DROP PROCEDURE IF EXISTS actor_name_range$
CREATE PROCEDURE actor_name_range(IN s1 VARCHAR(45), IN s2 VARCHAR(45))
BEGIN
    SELECT first_name, last_name FROM actor WHERE last_name > s1 AND last_name < s2;
    SELECT COUNT(*) FROM actor WHERE last_name >= s1 AND last_name <= s2;
END$

DROP PROCEDURE IF EXISTS actors_by_last_name$
CREATE PROCEDURE actors_by_last_name(IN last_name VARCHAR(45))
BEGIN
    DECLARE actor_count INT;

    SELECT first_name, last_name FROM actor WHERE actor.last_name = last_name;
    SELECT COUNT(*) INTO actor_count FROM actor WHERE actor.last_name = last_name;

    IF (actor_count > 1) THEN
        SELECT actor_count;
    END IF;
END$

/*

DROP PROCEDURE IF EXISTS mark_log_successful$
CREATE PROCEDURE mark_log_successful(IN size INT)
BEGIN
    DECLARE iter INT;
    DECLARE done BOOLEAN;
    DECLARE lid INT UNSIGNED;
    DECLARE logid_cursor CURSOR FOR SELECT log_id FROM temp_log_ids ORDER BY tmp_id DESC;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done=TRUE;
    SET iter = 0;
    SET done = FALSE;

    OPEN logid_cursor;
    REPEAT
        FETCH logid_cursor INTO lid;
        IF (done = FALSE) THEN
            UPDATE logger SET success = TRUE WHERE log_id=lid;
        END IF;
        SET iter = iter + 1;
    UNTIL (done=TRUE OR iter=size)
    END REPEAT;

    CLOSE logid_cursor;
    DELETE FROM temp_log_ids;
END$
*/

DROP PROCEDURE IF EXISTS mark_log_successful$
CREATE PROCEDURE mark_log_successful()
BEGIN
    DECLARE tid INT UNSIGNED;
    DECLARE lid INT UNSIGNED;
    SELECT tmp_id, log_id INTO tid, lid FROM temp_log_ids ORDER BY tmp_id DESC LIMIT 1;
    UPDATE logger SET success=TRUE WHERE log_id=lid;
    DELETE FROM temp_log_ids WHERE tmp_id=tid;
END$

DELIMITER ;