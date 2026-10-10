-- ============================================================
-- Gulmohar City Real Estate - MySQL Database Schema
-- Compatible with MySQL 5.7+, MySQL 8.0+, MariaDB & phpMyAdmin (Hostinger)
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table 1: users
-- Represents SuperAdmins, Managers, and Sales Agents
-- ------------------------------------------------------------
DROP TABLE IF EXISTS `user_column_preferences`;
DROP TABLE IF EXISTS `lead_history`;
DROP TABLE IF EXISTS `leads`;
DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL DEFAULT '',
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `phone` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('SuperAdmin', 'Manager', 'Agent', 'Admin') NOT NULL DEFAULT 'Agent',
  `column_preferences` JSON DEFAULT NULL COMMENT 'Stores JSON array of custom column preferences',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`),
  INDEX `idx_phone` (`phone`),
  INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 2: leads
-- Stores client leads and property enquiries
-- ------------------------------------------------------------
CREATE TABLE `leads` (
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
  `priority` VARCHAR(20) NOT NULL DEFAULT '' COMMENT 'High | Medium | Low',
  `notes` TEXT DEFAULT NULL,
  `assigned_agent_name` VARCHAR(255) NOT NULL DEFAULT '',
  `assigned_to` INT DEFAULT NULL COMMENT 'Foreign key to users.id',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_phone` (`phone`),
  INDEX `idx_status` (`status`),
  INDEX `idx_assigned_to` (`assigned_to`),
  CONSTRAINT `fk_enquiries_assigned_to` 
    FOREIGN KEY (`assigned_to`) 
    REFERENCES `users` (`id`) 
    ON DELETE SET NULL 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 3: lead_history
-- Audit log tracking every modification to enquiry fields
-- ------------------------------------------------------------
CREATE TABLE `lead_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lead_id` INT NOT NULL,
  `field_name` VARCHAR(100) NOT NULL,
  `old_value` TEXT DEFAULT NULL,
  `new_value` TEXT DEFAULT NULL,
  `modified_by` VARCHAR(255) NOT NULL DEFAULT 'Admin',
  `modified_date` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_enquiry_id` (`lead_id`),
  CONSTRAINT `fk_history_enquiry_id` 
    FOREIGN KEY (`lead_id`) 
    REFERENCES `leads` (`id`) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ------------------------------------------------------------
-- Table 4 (Optional Normalized): user_column_preferences
-- Alternative table if JSON data type is not preferred
-- ------------------------------------------------------------
CREATE TABLE `user_column_preferences` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `admin_id` INT NOT NULL,
  `col_id` VARCHAR(100) NOT NULL,
  `label` VARCHAR(255) NOT NULL,
  `visible` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_admin_col` (`admin_id`, `col_id`),
  CONSTRAINT `fk_col_pref_admin_id` 
    FOREIGN KEY (`admin_id`) 
    REFERENCES `users` (`id`) 
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

INSERT INTO `users` (`name`, `username`, `email`, `phone`, `password`, `role`)
VALUES 
('Super Admin', 'admin', 'admin@gulmoharcity.com', '9876543210', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'SuperAdmin')
ON DUPLICATE KEY UPDATE `username`=`username`;

-- Optional: Add your Sales Agents directly via SQL (or use the Admin Panel UI under 'Sales Agents')
-- INSERT INTO `users` (`name`, `username`, `email`, `phone`, `password`, `role`) VALUES
-- ('Sales Agent 1', 'agent1', 'agent1@gulmoharcity.com', '9876543211', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'Agent'),
-- ('Sales Agent 2', 'agent2', 'agent2@gulmoharcity.com', '9876543212', '$2a$10$4EO8IIMqBorf0nWZqpSszeCJVoWRCvlErOX89xthD3wIt36U4y2aG', 'Agent');

