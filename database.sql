-- ============================================
--  Vigenère Cipher System - Database Setup
--  Run this in MySQL Workbench or CLI:
--  mysql -u root -p < database.sql
-- ============================================

CREATE DATABASE IF NOT EXISTS vigenere_db;
USE vigenere_db;

CREATE TABLE IF NOT EXISTS cipher_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  mode        ENUM('encrypt', 'decrypt') NOT NULL,
  input_text  TEXT NOT NULL,
  cipher_key  VARCHAR(255) NOT NULL,
  output_text TEXT NOT NULL,
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Optional: view all records
-- SELECT * FROM cipher_history ORDER BY created_at DESC;
