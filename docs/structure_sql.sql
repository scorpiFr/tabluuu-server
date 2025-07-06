DROP TABLE etablissement;
CREATE TABLE etablissement (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_facturation VARCHAR(255) NOT NULL UNIQUE,
	email_commandes VARCHAR(255) DEFAULT '',
	nom_etablissement VARCHAR(255)  DEFAULT '',
	type VARCHAR(255) DEFAULT 'bar',
	nom VARCHAR(255) DEFAULT '',
	prenom VARCHAR(255) DEFAULT '',
	adresse VARCHAR(255) DEFAULT '',
	tel VARCHAR(255) DEFAULT '',
	password VARCHAR(255) NOT NULL,
	secret_key VARCHAR(255) NOT NULL,
	type_contrat VARCHAR(255) NOT NULL DEFAULT 'commande',
	prix DECIMAL(5, 2) NOT NULL DEFAULT 0,
	is_allocated CHAR(1) DEFAULT '0',
	is_available CHAR(1) DEFAULT '1',
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

DROP TABLE session;
CREATE TABLE session (
	id INT AUTO_INCREMENT PRIMARY KEY,
	token VARCHAR(255) NOT NULL UNIQUE,
	etablissement_id INT DEFAULT 0,
	user_id INT DEFAULT 0,
	nom_etablissement VARCHAR(255) DEFAULT '',
	nom VARCHAR(255) DEFAULT '',
	prenom VARCHAR(255) DEFAULT '',
	role VARCHAR(255) DEFAULT 'etablissement',
	max_timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

/*
INSERT INTO etablissement set 
id=1, 
email_facturation='contact.tabluuu@gmail.com',
email_commandes='contact.tabluuu@gmail.com',
nom_etablissement='HOUSEGANG BAR',
type='bar',
password='123',
secret_key='123'
;

INSERT INTO etablissement set
id=7,
email_facturation='a7@tabluuu.com',
email_commandes='contact.tabluuu@gmail.com',
nom_etablissement='La mer égée',
type='bar',
password= "44875f87cbe3866408e22d06f8e2477ffcbc4ee3",
secret_key="456",
type_contrat="commande";

*/

DROP TABLE dynamic_menu;
DROP INDEX idx_etablissementid ON dynamic_menu;
CREATE TABLE dynamic_menu (
	id INT AUTO_INCREMENT PRIMARY KEY,
	etablissement_id INT DEFAULT 0,
	nom VARCHAR(255) DEFAULT '',
	is_active CHAR(1) DEFAULT '0',
	position INT DEFAULT 0,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_etablissementid ON dynamic_menu (etablissement_id);

DROP TABLE section;
DROP INDEX idx_etablissementid ON section;
DROP INDEX idx_dynmenuid ON section;
CREATE TABLE section (
	id INT AUTO_INCREMENT PRIMARY KEY,
	etablissement_id INT DEFAULT 0,
	dynamic_menu_id INT DEFAULT 0,
	nom VARCHAR(255) DEFAULT '',
	position INT DEFAULT 0,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_etablissementid ON section (etablissement_id);
CREATE INDEX idx_dynmenuid ON section (dynamic_menu_id);

DROP TABLE item;
DROP INDEX idx_etablissementid ON item;
DROP INDEX idx_dynmenuid ON item;
DROP INDEX idx_sectionid ON item;
CREATE TABLE item (
	id INT AUTO_INCREMENT PRIMARY KEY,
	etablissement_id INT DEFAULT 0,
	dynamic_menu_id INT DEFAULT 0,
	section_id INT DEFAULT 0,
	nom VARCHAR(255) DEFAULT '',
	description VARCHAR(255) DEFAULT '',
	prix DECIMAL(10, 2) DEFAULT 0,
	position INT DEFAULT 0,
	image VARCHAR(255) DEFAULT '',
	thumbnail VARCHAR(255) DEFAULT '',
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_etablissementid ON item (etablissement_id);
CREATE INDEX idx_dynmenuid ON item (dynamic_menu_id);
CREATE INDEX idx_sectionid ON item (section_id);


DROP TABLE static_menu;
DROP INDEX idx_etablissementid ON static_menu;
CREATE TABLE static_menu (
	id INT AUTO_INCREMENT PRIMARY KEY,
	etablissement_id INT DEFAULT 0,
	nom VARCHAR(255) DEFAULT '',
	is_active CHAR(1) DEFAULT '0',
	position INT DEFAULT 0,
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_etablissementid ON static_menu (etablissement_id);

DROP TABLE static_item;
DROP INDEX idx_etablissementid ON static_item;
DROP INDEX idx_staticmenuid ON static_item;
CREATE TABLE static_item (
	id INT AUTO_INCREMENT PRIMARY KEY,
	etablissement_id INT DEFAULT 0,
	static_menu_id INT DEFAULT 0,
	position INT DEFAULT 0,
	image VARCHAR(255) DEFAULT '',
	thumbnail VARCHAR(255) DEFAULT '',
	createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
CREATE INDEX idx_staticmenuid ON static_item (static_menu_id);
CREATE INDEX idx_etablissementid ON static_item (etablissement_id);
