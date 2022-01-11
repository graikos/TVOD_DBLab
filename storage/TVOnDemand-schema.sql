-- Database TVOnDemand 

-- based on

-- Sakila Sample Database Schema
-- Version 1.2

-- Copyright (c) 2006, 2019, Oracle and/or its affiliates.

-- Redistribution and use in source and binary forms, with or without
-- modification, are permitted provided that the following conditions are
-- met:

-- * Redistributions of source code must retain the above copyright notice,
--   this list of conditions and the following disclaimer.
-- * Redistributions in binary form must reproduce the above copyright
--   notice, this list of conditions and the following disclaimer in the
--   documentation and/or other materials provided with the distribution.
-- * Neither the name of Oracle nor the names of its contributors may be used
--   to endorse or promote products derived from this software without
--   specific prior written permission.

-- THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
-- IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
-- THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
-- PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR
-- CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
-- EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
-- PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
-- PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF
-- LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING
-- NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
-- SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



DROP SCHEMA IF EXISTS tvondemand;
CREATE SCHEMA tvondemand;
USE tvondemand;

--
-- Table structure for table `actor`
--

CREATE TABLE actor (
  actor_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  PRIMARY KEY  (actor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `country`
--

CREATE TABLE country (
  country_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  country VARCHAR(50) NOT NULL,
  PRIMARY KEY  (country_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



--
-- Table structure for table `city`
--

CREATE TABLE city (
  city_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  city VARCHAR(50) NOT NULL,
  country_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY  (city_id),
  CONSTRAINT `fk_city_country` FOREIGN KEY (country_id) REFERENCES country (country_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



--
-- Table structure for table `address`
--

CREATE TABLE address (
  address_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  address VARCHAR(50) NOT NULL,
  district VARCHAR(20) DEFAULT NULL,
  city_id SMALLINT UNSIGNED NOT NULL,
  postal_code VARCHAR(10) DEFAULT NULL,
  phone VARCHAR(20) NOT NULL,
  PRIMARY KEY  (address_id),
  CONSTRAINT `fk_address_city` FOREIGN KEY (city_id) REFERENCES city (city_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `category`
--

CREATE TABLE category (
  category_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(40) NOT NULL,
  PRIMARY KEY  (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- Table structure for table `language`
--

CREATE TABLE language (
  language_id TINYINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name CHAR(20) NOT NULL,
  PRIMARY KEY (language_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `customer`
--

CREATE TABLE subscription (
  subscription_type ENUM('FILMS', 'SHOWS', 'BOTH') NOT NULL,
  movie_cost FLOAT,
  episode_cost FLOAT,
  PRIMARY KEY (subscription_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE customer (
  customer_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  email VARCHAR(50) DEFAULT NULL UNIQUE,
  address_id SMALLINT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  create_date DATETIME NOT NULL,
  subscription_type ENUM('FILMS', 'SHOWS', 'BOTH'),
  pass_hash CHAR(64) NOT NULL,
  pass_salt CHAR(8) NOT NULL,
  PRIMARY KEY  (customer_id),
  CONSTRAINT fk_customer_address FOREIGN KEY (address_id) REFERENCES address (address_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_subscription_type FOREIGN KEY (subscription_type) REFERENCES subscription(subscription_type) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- Table structure for table `employee`
--
CREATE TABLE employee (
  employee_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  email VARCHAR(50) DEFAULT NULL UNIQUE,
  address_id SMALLINT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  create_date DATETIME NOT NULL,
  pass_hash CHAR(64) NOT NULL,
  pass_salt CHAR(8) NOT NULL,
  PRIMARY KEY  (employee_id),
  CONSTRAINT fk_employee_address FOREIGN KEY (address_id) REFERENCES address (address_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `administrator`
--
CREATE TABLE administrator (
  administrator_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(45) NOT NULL,
  last_name VARCHAR(45) NOT NULL,
  email VARCHAR(50) DEFAULT NULL UNIQUE,
  address_id SMALLINT UNSIGNED NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  create_date DATETIME NOT NULL,
  pass_hash CHAR(64) NOT NULL,
  pass_salt CHAR(8) NOT NULL,
  PRIMARY KEY  (administrator_id),
  CONSTRAINT fk_administrator_address FOREIGN KEY (address_id) REFERENCES address (address_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `film`
--
CREATE TABLE film (
  film_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  release_year YEAR DEFAULT NULL,
  language_id TINYINT UNSIGNED NOT NULL,
  original_language_id TINYINT UNSIGNED DEFAULT NULL,
  length SMALLINT UNSIGNED DEFAULT NULL,
  rating ENUM('G','PG','PG-13','R','NC-17') DEFAULT 'G',
  special_features SET('Trailers','Commentaries','Deleted Scenes','Behind the Scenes') DEFAULT NULL,
  PRIMARY KEY  (film_id),
  CONSTRAINT fk_film_language FOREIGN KEY (language_id) REFERENCES language (language_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_film_language_original FOREIGN KEY (original_language_id) REFERENCES language (language_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `film_actor`
--

CREATE TABLE film_actor (
  actor_id SMALLINT UNSIGNED NOT NULL,
  film_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY  (actor_id,film_id),
  CONSTRAINT fk_film_actor_actor FOREIGN KEY (actor_id) REFERENCES actor (actor_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_film_actor_film FOREIGN KEY (film_id) REFERENCES film (film_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `film_category`
--

CREATE TABLE film_category (
  film_id SMALLINT UNSIGNED NOT NULL,
  category_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (film_id, category_id),
  CONSTRAINT fk_film_category_film FOREIGN KEY (film_id) REFERENCES film (film_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_film_category_category FOREIGN KEY (category_id) REFERENCES category (category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


CREATE TABLE tv_show (
  show_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(128) NOT NULL,
  description TEXT DEFAULT NULL,
  release_year YEAR DEFAULT NULL,
  language_id TINYINT UNSIGNED NOT NULL,
  original_language_id TINYINT UNSIGNED DEFAULT NULL,
  rating ENUM('G','PG','PG-13','R','NC-17') DEFAULT 'G',
  special_features SET('Trailers','Commentaries','Deleted Scenes','Behind the Scenes') DEFAULT NULL,
  PRIMARY KEY  (show_id),
  CONSTRAINT fk_show_language FOREIGN KEY (language_id) REFERENCES language (language_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_show_language_original FOREIGN KEY (original_language_id) REFERENCES language (language_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE season (
  season_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  show_id INT UNSIGNED NOT NULL,
  release_year YEAR DEFAULT NULL,
  season_number INT UNSIGNED NOT NULL,
  episodes INT UNSIGNED NOT NULL,
  PRIMARY KEY (season_id),
  CONSTRAINT fk_show_id FOREIGN KEY (show_id) REFERENCES tv_show (show_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tv_show_actor (
  actor_id SMALLINT UNSIGNED NOT NULL,
  show_id INT UNSIGNED NOT NULL,
  PRIMARY KEY  (actor_id, show_id),
  CONSTRAINT fk_show_actor_actor FOREIGN KEY (actor_id) REFERENCES actor (actor_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_show_actor_show FOREIGN KEY (show_id) REFERENCES tv_show (show_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE tv_show_category (
  show_id INT UNSIGNED NOT NULL,
  category_id TINYINT UNSIGNED NOT NULL,
  PRIMARY KEY (show_id, category_id),
  CONSTRAINT fk_show_category_show FOREIGN KEY (show_id) REFERENCES tv_show (show_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_show_category_category FOREIGN KEY (category_id) REFERENCES category (category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- Table structure for table `inventory`
--

CREATE TABLE inventory (
  inventory_id MEDIUMINT UNSIGNED NOT NULL AUTO_INCREMENT,
  film_id SMALLINT UNSIGNED DEFAULT NULL,
  show_id INT UNSIGNED DEFAULT NULL,
  item_type ENUM('FILM', 'SHOW') NOT NULL,
  PRIMARY KEY  (inventory_id),
  CONSTRAINT fk_inventory_film FOREIGN KEY (film_id) REFERENCES film (film_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_inventory_show FOREIGN KEY (show_id) REFERENCES tv_show(show_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


--
-- Table structure for table `rental`
--

CREATE TABLE rental (
  rental_id INT NOT NULL AUTO_INCREMENT,
  rental_date DATETIME NOT NULL,
  inventory_id MEDIUMINT UNSIGNED NOT NULL,
  season_id INT UNSIGNED DEFAULT NULL,
  episode_number INT UNSIGNED DEFAULT NULL,
  customer_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (rental_id),
  CONSTRAINT fk_rental_inventory FOREIGN KEY (inventory_id) REFERENCES inventory (inventory_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_rental_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_rental_season_id FOREIGN KEY (season_id) REFERENCES season(season_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `payment`
--

CREATE TABLE payment (
  payment_id SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
  customer_id SMALLINT UNSIGNED NOT NULL,
  rental_id INT DEFAULT NULL,
  amount DECIMAL(5,2) NOT NULL,
  payment_date DATETIME NOT NULL,
  PRIMARY KEY  (payment_id),
  CONSTRAINT fk_payment_rental FOREIGN KEY (rental_id) REFERENCES rental (rental_id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_payment_customer FOREIGN KEY (customer_id) REFERENCES customer (customer_id) ON DELETE RESTRICT ON UPDATE CASCADE
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


 CREATE TABLE logger (
   log_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
   email VARCHAR(50) NOT NULL,
   user_type ENUM('CUSTOMER', 'EMPLOYEE', 'ADMINISTRATOR'),
   log_date DATETIME NOT NULL,
   success BOOLEAN NOT NULL DEFAULT FALSE,
   action_type ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
   on_table VARCHAR(50) NOT NULL,
   PRIMARY KEY  (log_id)
 );

 CREATE TABLE temp_log_ids (
   tmp_id INT UNSIGNED AUTO_INCREMENT,
   log_id INT UNSIGNED NOT NULL,
   PRIMARY KEY (tmp_id)
 );


 -- INDEXES


CREATE FULLTEXT INDEX actor_index
ON actor (last_name);

