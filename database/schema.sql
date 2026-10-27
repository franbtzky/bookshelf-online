
CREATE DATABASE IF NOT EXISTS bookshelf_online
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE bookshelf_online;

-- Catálogo de livros
CREATE TABLE IF NOT EXISTS books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  open_library_key VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(500) NOT NULL,
  author TEXT,
  cover_id INT NULL,
  publish_year INT NULL,
  edition_count INT NULL,
  status ENUM('Quero ler', 'Lendo', 'Lido')
    NOT NULL DEFAULT 'Quero ler',
  rating TINYINT NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP
);

-- Contas dos usuários
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Estante individual de cada usuário
CREATE TABLE IF NOT EXISTS user_books (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  status ENUM('Quero ler', 'Lendo', 'Lido')
    NOT NULL DEFAULT 'Quero ler',
  rating TINYINT NOT NULL DEFAULT 0,
  notes TEXT,
  current_page INT UNSIGNED DEFAULT 0,
  total_pages INT UNSIGNED DEFAULT NULL,
  started_at DATE DEFAULT NULL,
  finished_at DATE DEFAULT NULL,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_book (user_id, book_id),

  CONSTRAINT fk_user_books_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_user_books_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE CASCADE
);


-- Comentários públicos dos leitores
CREATE TABLE IF NOT EXISTS book_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  book_id INT NOT NULL,
  rating TINYINT NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY unique_user_review (user_id, book_id),

  CONSTRAINT fk_reviews_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT fk_reviews_book
    FOREIGN KEY (book_id) REFERENCES books(id)
    ON DELETE CASCADE,

  CONSTRAINT chk_review_rating
    CHECK (rating BETWEEN 1 AND 5)
);


CREATE TABLE IF NOT EXISTS friendships (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    receiver_id INT NOT NULL,
    status ENUM('pending', 'accepted') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (requester_id) REFERENCES users(id)
        ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_friendship UNIQUE (requester_id, receiver_id),
    CONSTRAINT different_users CHECK (requester_id <> receiver_id)
);
