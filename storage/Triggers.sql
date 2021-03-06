DELIMITER $

-- Triggers for preventing INSERT on Customer/Employee/Administrator with email that exists in either other table
DROP TRIGGER IF EXISTS customer_email$
CREATE TRIGGER customer_email
BEFORE INSERT ON customer
FOR EACH ROW
BEGIN
    IF (NEW.email in (SELECT email FROM employee) OR NEW.email in (SELECT email FROM administrator)) THEN
        SET NEW.email = NULL;
    END IF;
END$

DROP TRIGGER IF EXISTS employee_email$
CREATE TRIGGER employee_email
BEFORE INSERT ON employee
FOR EACH ROW
BEGIN
    IF (NEW.email in (SELECT email FROM customer) OR NEW.email in (SELECT email FROM administrator)) THEN
        SET NEW.email = NULL;
    END IF;
END$

DROP TRIGGER IF EXISTS administrator_email$
CREATE TRIGGER administrator_email
BEFORE INSERT ON administrator
FOR EACH ROW
BEGIN
    IF (NEW.email in (SELECT email FROM customer) OR NEW.email in (SELECT email FROM employee)) THEN
        SET NEW.email = NULL;
    END IF;
END$

-- Trigger for preventing renting the same film/episode on the same day
DROP TRIGGER IF EXISTS prevent_rental$
CREATE TRIGGER prevent_rental
BEFORE INSERT ON rental
FOR EACH ROW
BEGIN
    IF (NEW.season_id IS NULL) THEN
        IF (EXISTS(SELECT rental_id FROM rental WHERE DATE(rental_date)=DATE(NEW.rental_date) AND inventory_id=NEW.inventory_id AND customer_id=NEW.customer_id)) THEN
            SET NEW.rental_date = NULL;
        END IF;
    ELSE
        IF (EXISTS(SELECT rental_id FROM rental WHERE DATE(rental_date)=DATE(NEW.rental_date) AND inventory_id=NEW.inventory_id AND customer_id=NEW.customer_id AND season_id=NEW.season_id AND episode_number=NEW.episode_number)) THEN
            SET NEW.rental_date = NULL;
        END IF;
    END IF;

END$

-- Trigger for 50% sale on each third daily order
DROP TRIGGER IF EXISTS sale$
CREATE TRIGGER sale
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    DECLARE user_email VARCHAR(50);
    DECLARE total_rentals INT;
    SELECT email INTO user_email FROM customer WHERE customer_id=NEW.customer_id;
    CALL rentals_on_date(user_email, NOW(), total_rentals);
    IF MOD(total_rentals, 3) = 0 AND total_rentals > 0 THEN
        SET NEW.amount = 0.5*NEW.amount;
    END IF;
END$


-- Trigger for preventing customers from changing their email
DROP TRIGGER IF EXISTS customer_email_change_prevention$
CREATE TRIGGER customer_email_change_prevention
BEFORE UPDATE ON customer
FOR EACH ROW
BEGIN
    IF (NEW.email IS NULL) THEN
        SET NEW.email = OLD.email;
    ELSEIF (NEW.email <> OLD.email) THEN
        SET NEW.customer_id = NULL;
    END IF;
END$

-- Trigger for checking whether a season and episode exist for a show
DROP TRIGGER IF EXISTS show_rental_validation$
CREATE TRIGGER show_rental_validation
BEFORE INSERT ON rental
FOR EACH ROW
BEGIN
    IF NOT (NEW.season_id IS NULL AND NEW.episode_number IS NULL) THEN
        IF NEW.season_id is NULL OR NEW.episode_number is NULL OR
            (SELECT episodes FROM season WHERE season_id=NEW.season_id) < NEW.episode_number OR NEW.episode_number = 0 OR
            (SELECT inventory.show_id
            FROM inventory INNER JOIN season ON season.show_id=inventory.show_id
            WHERE season.season_id = NEW.season_id AND inventory.inventory_id = NEW.inventory_id) IS NULL
        THEN
            SET NEW.rental_date = NULL;
        END IF;
    ELSEIF (SELECT item_type FROM inventory WHERE inventory.inventory_id=NEW.inventory_id) = "SHOW" THEN
        SET NEW.rental_date = NULL;
    ELSEIF NOT ((SELECT inventory_id FROM rental WHERE inventory_id=NEW.inventory_id AND rental_date=NEW.rental_date AND customer_id=NEW.customer_id) IS NULL) THEN
        SET NEW.rental_date = NULL;
    END IF;

END$

-- Logging INSERT into rental
DROP TRIGGER IF EXISTS rental_log_insert_before$
CREATE TRIGGER rental_log_insert_before
BEFORE INSERT ON rental
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=NEW.customer_id), "CUSTOMER", NOW(), "INSERT", "rental");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS rental_log_insert_after$
CREATE TRIGGER rental_log_insert_after
AFTER INSERT ON rental
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$

-- Logging UPDATE rental
DROP TRIGGER IF EXISTS rental_log_update_before$
CREATE TRIGGER rental_log_update_before
BEFORE UPDATE ON rental
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=NEW.customer_id), "CUSTOMER", NOW(), "UPDATE", "rental");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS rental_log_update_after$
CREATE TRIGGER rental_log_update_after
AFTER UPDATE ON rental
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$


-- Logging DELETE from rental
DROP TRIGGER IF EXISTS rental_log_delete_before$
CREATE TRIGGER rental_log_delete_before
BEFORE DELETE ON rental
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=OLD.customer_id), "CUSTOMER", NOW(), "DELETE", "rental");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS rental_log_delete_after$
CREATE TRIGGER rental_log_delete_after
AFTER DELETE ON rental
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$


-- Logging INSERT into payment
DROP TRIGGER IF EXISTS payment_log_insert_before$
CREATE TRIGGER payment_log_insert_before
BEFORE INSERT ON payment
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=NEW.customer_id), "CUSTOMER", NOW(), "INSERT", "payment");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS payment_log_insert_after$
CREATE TRIGGER payment_log_insert_after
AFTER INSERT ON payment
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$


-- Logging UPDATE payment
DROP TRIGGER IF EXISTS payment_log_update_before$
CREATE TRIGGER payment_log_update_before
BEFORE UPDATE ON payment
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=NEW.customer_id), "CUSTOMER", NOW(), "UPDATE", "payment");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS payment_log_update_after$
CREATE TRIGGER payment_log_update_after
AFTER UPDATE ON payment
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$


-- Logging DELETE from rental
DROP TRIGGER IF EXISTS payment_log_delete_before$
CREATE TRIGGER payment_log_delete_before
BEFORE DELETE ON payment
FOR EACH ROW
BEGIN
    INSERT INTO logger (email, user_type, log_date, action_type, on_table) VALUES 
    ((SELECT email FROM customer WHERE customer_id=OLD.customer_id), "CUSTOMER", NOW(), "DELETE", "payment");
    INSERT INTO temp_log_ids (log_id) VALUES (LAST_INSERT_ID()); 
END$

DROP TRIGGER IF EXISTS payment_log_delete_after$
CREATE TRIGGER payment_log_delete_after
AFTER DELETE ON payment
FOR EACH ROW
BEGIN
    CALL mark_log_successful();
END$

DELIMITER ;