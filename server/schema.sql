-- ============================================================
-- Gulmohar City Real Estate - MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB & phpMyAdmin (Hostinger)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table 1: admins
-- Represents SuperAdmins, Managers, and Sales Agents
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `admin_column_preferences`;
DROP TABLE IF EXISTS `enquiry_history`;
DROP TABLE IF EXISTS `enquiries`;
DROP TABLE IF EXISTS `admins`;

CREATE TABLE `admins` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(50) NOT NULL DEFAULT '',
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('SuperAdmin', 'Manager', 'Agent', 'Admin') NOT NULL DEFAULT 'Agent',
  `column_preferences` JSON DEFAULT NULL COMMENT 'Stores JSON array of custom column preferences',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 2: enquiries
-- Stores client leads and property enquiries
-- ------------------------------------------------------------
CREATE TABLE `enquiries` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `first_name` VARCHAR(255) NOT NULL,
  `last_name` VARCHAR(255) NOT NULL DEFAULT '',
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(255) NOT NULL DEFAULT '',
  `plot_info` TEXT DEFAULT NULL,
  `plots_count` VARCHAR(100) NOT NULL DEFAULT '1 Plot',
  `visit_date` VARCHAR(100) NOT NULL DEFAULT '',
  `followup_date` VARCHAR(100) NOT NULL DEFAULT '',
  `status` VARCHAR(50) NOT NULL DEFAULT 'New',
  `notes` TEXT DEFAULT NULL,
  `assigned_agent_name` VARCHAR(255) NOT NULL DEFAULT '',
  `assigned_to` INT DEFAULT NULL COMMENT 'Foreign key to admins.id',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_assigned_to` (`assigned_to`),
  CONSTRAINT `fk_enquiries_assigned_to` 
    FOREIGN KEY (`assigned_to`) 
    REFERENCES `admins` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 3: enquiry_history
-- Audit log tracking every modification to enquiry fields
-- ------------------------------------------------------------
CREATE TABLE `enquiry_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `enquiry_id` INT NOT NULL,
  `field_name` VARCHAR(100) NOT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `modified_by` VARCHAR(255) NOT NULL DEFAULT 'Admin',
  `modified_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_enquiry_id` (`enquiry_id`),
  CONSTRAINT `fk_history_enquiry_id` 
    FOREIGN KEY (`enquiry_id`) 
    REFERENCES `enquiries` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 4 (Optional Normalized): admin_column_preferences
-- Alternative table if JSON data type is not preferred
-- ------------------------------------------------------------
CREATE TABLE `admin_column_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `col_id` VARCHAR(100) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `visible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_col` (`admin_id`, `col_id`),
  CONSTRAINT `fk_col_pref_admin_id` 
    FOREIGN KEY (`admin_id`) 
    REFERENCES `admins` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Seed Default Credentials
-- SuperAdmin: admin / admin123
-- Sales Agents: (Created via Admin Panel or SQL below)
-- Password bcrypt hash for 'admin123': $2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG
-- ============================================================

INSERT INTO `admins` (`name`, `username`, `email`, `phone`, `password`, `role`)
VALUES 
('Super Admin', 'admin', 'admin@gulmoharcity.com', '9876543210', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'SuperAdmin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Optional: Add your Sales Agents directly via SQL (or use the Admin Panel UI under 'Sales Agents')
-- INSERT INTO `admins` (`name`, `username`, `email`, `phone`, `password`, `role`) VALUES
-- ('Sales Agent 1', 'agent1', 'agent1@gulmoharcity.com', '9876543211', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'Agent'),
-- ('Sales Agent 2', 'agent2', 'agent2@gulmoharcity.com', '9876543212', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'Agent');

