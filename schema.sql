-- Create the database if it doesn't exist
CREATE DATABASE IF NOT EXISTS `saksham_pravesh` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE `saksham_pravesh`;

-- Create Users table
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `full_name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone_number` VARCHAR(20) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `mht_cet_percentile` DECIMAL(5,2) NOT NULL,
  `category` VARCHAR(50) NOT NULL,
  `preferred_branch` VARCHAR(100) NOT NULL,
  `selected_package` VARCHAR(20) NOT NULL DEFAULT 'basic',
  `role` VARCHAR(20) NOT NULL DEFAULT 'student',
  `payment_status` VARCHAR(20) NOT NULL DEFAULT 'pending',
  `receipt_path` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create Notices table
CREATE TABLE IF NOT EXISTS `notices` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `meeting_link` VARCHAR(255) DEFAULT NULL,
  `scheduled_time` DATETIME DEFAULT NULL,
  `attachment_path` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Create Meetings table (1-on-1 sessions for premium students)
CREATE TABLE IF NOT EXISTS `meetings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `student_id` INT NOT NULL,
  `meeting_link` VARCHAR(255) NOT NULL,
  `scheduled_time` DATETIME NOT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Insert a default admin user (email: admin@sakshampravesh.com, password: adminPassword123)
-- Password stored as plain text (no hashing)
INSERT INTO `users` (full_name, email, phone_number, password_hash, mht_cet_percentile, category, preferred_branch, selected_package, role, payment_status)
VALUES (
  'System Administrator',
  'admin@sakshampravesh.com',
  '9011388302',
  'adminPassword123',
  99.99,
  'General',
  'Computer Science',
  'premium',
  'admin',
  'approved'
), (
  'Aditya Gawai',
  'adityagawai@gmail.com',
  '9011388302',
  'adminPassword123',
  0,
  'OPEN',
  'N/A',
  'premium',
  'admin',
  'approved'
) ON DUPLICATE KEY UPDATE id=id;
