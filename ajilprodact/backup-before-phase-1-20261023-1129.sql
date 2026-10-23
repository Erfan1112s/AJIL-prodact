/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.20-13.0.2-MariaDB, for Linux (x86_64)
--
-- Host: localhost    Database: ajil_catalog
-- ------------------------------------------------------
-- Server version	13.0.2-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*M!100616 SET @OLD_NOTE_VERBOSITY=@@NOTE_VERBOSITY, NOTE_VERBOSITY=0 */;

--
-- Table structure for table `admin_users`
--

DROP TABLE IF EXISTS `admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_users` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `role` enum('SUPER_ADMIN','ADMIN','EDITOR') NOT NULL DEFAULT 'ADMIN',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `last_login_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_admin_username` (`username`),
  KEY `idx_admin_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `admin_users` WRITE;
/*!40000 ALTER TABLE `admin_users` DISABLE KEYS */;
INSERT INTO `admin_users` VALUES
(1,'admin','ab7b41b119b2e0b55902222d3eedf82c:57cb23289295fdc7f0b5765295009bbbcd9460e0c7eb4d806363a5fe1d8be44a998509e2ac53f27230fe850200fdf6ffcd6a573a24a23407d08f8dc38c7423f6','مدیر سیستم','SUPER_ADMIN',1,NULL,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `admin_users` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `batches`
--

DROP TABLE IF EXISTS `batches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `batches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `batch_code` varchar(30) NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `supplier_name` varchar(150) DEFAULT NULL,
  `harvest_date` date DEFAULT NULL,
  `roast_date` date DEFAULT NULL,
  `pack_date` date DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `freshness_mode` enum('MANUAL','AUTO') NOT NULL DEFAULT 'MANUAL',
  `freshness_score` tinyint(3) unsigned NOT NULL DEFAULT 100,
  `freshness_base_score` tinyint(3) unsigned NOT NULL DEFAULT 100,
  `freshness_base_date` date DEFAULT NULL,
  `freshness_annual_decay` tinyint(3) unsigned NOT NULL DEFAULT 50,
  `qc_note` text DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_batches_code` (`batch_code`),
  KEY `idx_batches_product` (`product_id`),
  KEY `idx_batches_freshness` (`freshness_score`),
  CONSTRAINT `fk_batches_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `batches`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `batches` WRITE;
/*!40000 ALTER TABLE `batches` DISABLE KEYS */;
INSERT INTO `batches` VALUES
(1,'P-250901',1,'باغات رفسنجان','2025-08-20','2025-09-01','2025-09-05','2026-03-05','MANUAL',95,95,'2025-09-05',50,'کیفیت مطلوب، اندازه یکنواخت',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(2,'P-250910',2,'باغات سامان','2025-08-25',NULL,'2025-09-10','2026-03-10','MANUAL',92,92,'2025-09-10',50,'بادام سالم بدون آفت',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(3,'P-250915',3,'باغات اشکورات','2025-09-01',NULL,'2025-09-15','2026-03-15','MANUAL',90,90,'2025-09-15',50,'فندق با مغز پر و تازه',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(4,'P-250918',4,'واردات هند',NULL,'2025-09-18','2025-09-18','2026-03-18','MANUAL',88,88,'2025-09-18',50,'بادام هندی درجه A',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(5,'P-250920',5,'کشت داخلی','2025-09-10','2025-09-20','2025-09-20','2026-03-20','MANUAL',93,93,'2025-09-20',50,'تخمه درشت و یکنواخت',1,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `batches` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `branches` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `address` text DEFAULT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `lat` decimal(10,7) DEFAULT NULL,
  `lng` decimal(10,7) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_branches_slug` (`slug`),
  KEY `idx_branches_active` (`is_active`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES
(1,'شعبه مرکزی','markazi','اصفهان، خیابان چهارباغ بالا، پلاک ۱۲۰','03188776655',32.6546000,51.6680000,1,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `slug` varchar(120) NOT NULL,
  `description` text DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `parent_id` int(10) unsigned DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_categories_slug` (`slug`),
  KEY `idx_categories_parent` (`parent_id`),
  KEY `idx_categories_active_sort` (`is_active`,`sort_order`),
  CONSTRAINT `fk_categories_parent` FOREIGN KEY (`parent_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES
(1,'آجیل','ajil','انواع آجیل شور و خام',NULL,NULL,1,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(2,'خشکبار','khoshkbar','انواع خشکبار و میوه خشک',NULL,NULL,2,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(3,'پک هدیه','pack-hediye','پک‌های هدیه و مناسبت‌ها',NULL,NULL,3,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(4,'پسته','peste','انواع پسته',NULL,1,1,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(5,'بادام','badam','انواع بادام',NULL,1,2,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(6,'فندق','fandogh','انواع فندق',NULL,1,3,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(7,'بادام هندی','badam-hendi','انواع بادام هندی',NULL,1,4,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(8,'تخمه','tokhme','انواع تخمه',NULL,1,5,1,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `phone` varchar(15) NOT NULL,
  `national_code` varchar(10) DEFAULT NULL,
  `full_name` varchar(100) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `password_hash` varchar(255) DEFAULT NULL,
  `otp_code` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `otp_attempts` tinyint(3) unsigned NOT NULL DEFAULT 0,
  `otp_last_sent_at` timestamp NULL DEFAULT NULL,
  `otp_verified_at` timestamp NULL DEFAULT NULL,
  `default_address` text DEFAULT NULL,
  `admin_note` text DEFAULT NULL,
  `order_count` int(10) unsigned NOT NULL DEFAULT 0,
  `last_order_at` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_customers_phone` (`phone`),
  KEY `idx_customers_national` (`national_code`),
  KEY `idx_customers_name` (`full_name`),
  KEY `idx_customers_last_order` (`last_order_at`),
  KEY `idx_customers_active` (`is_active`),
  KEY `idx_customers_otp_expires` (`otp_expires_at`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES
(1,'09121234567',NULL,'علی رضایی','ali@example.com','b9bfbe11d359c51d05ca67a625627c4d:895895940be2fdf464a9e2abddde0ceb027d4428e179e5f52904e1d849591d3435ad76ca02d69cb3d0d42c945bcad3a2162e16f598e104449f8fe9144ca0ea06',NULL,NULL,0,NULL,NULL,'اصفهان، سعادت‌آباد، کوچه 5',NULL,3,'2025-09-20 07:00:00',1,'2026-10-21 14:26:17','2026-10-21 16:22:01'),
(2,'09351112233',NULL,'مریم احمدی','maryam@example.com',NULL,NULL,NULL,0,NULL,NULL,'اصفهان، ونک، خیابان گاندی',NULL,1,'2025-09-18 12:15:00',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(3,'09197778899',NULL,'حسن کریمی',NULL,NULL,NULL,NULL,0,NULL,NULL,'کرج، عظیمیه، بلوار اصلی',NULL,5,'2025-09-22 05:30:00',1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(4,'09361234567',NULL,'زهرا موسوی',NULL,NULL,NULL,NULL,0,NULL,NULL,NULL,NULL,0,NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `variant_id` int(10) unsigned NOT NULL,
  `product_name` varchar(200) NOT NULL,
  `weight_gram` int(10) unsigned NOT NULL,
  `packaging_type` varchar(50) NOT NULL DEFAULT 'standard',
  `packaging_label` varchar(100) DEFAULT NULL,
  `price` decimal(12,0) NOT NULL,
  `quantity` int(10) unsigned NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order` (`order_id`),
  KEY `idx_order_items_product` (`product_id`),
  KEY `fk_order_items_variant` (`variant_id`),
  CONSTRAINT `fk_order_items_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_order_items_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES
(1,1,1,2,'پسته اکبری ممتاز',500,'standard',NULL,880000,1,'2026-10-21 14:26:17'),
(2,2,1,1,'پسته اکبری ممتاز',250,'standard',NULL,450000,1,'2026-10-21 14:26:17'),
(3,3,1,3,'پسته اکبری ممتاز',1000,'standard',NULL,1720000,1,'2026-10-21 14:26:17');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `customer_id` int(10) unsigned DEFAULT NULL,
  `customer_name` varchar(100) NOT NULL,
  `customer_phone` varchar(15) NOT NULL,
  `customer_email` varchar(100) DEFAULT NULL,
  `province` varchar(100) DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `postal_code` varchar(10) DEFAULT NULL,
  `subtotal` decimal(12,0) NOT NULL DEFAULT 0,
  `shipping_cost` decimal(12,0) NOT NULL DEFAULT 0,
  `total_amount` decimal(12,0) NOT NULL,
  `status` enum('PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `delivery_method` enum('SHIPPING','PICKUP') NOT NULL DEFAULT 'SHIPPING',
  `shipping_provider` enum('SNAPP','POST','NONE') NOT NULL DEFAULT 'NONE',
  `payment_method` varchar(20) DEFAULT NULL,
  `payment_ref` varchar(100) DEFAULT NULL,
  `payment_authority` varchar(100) DEFAULT NULL,
  `payment_verified_at` timestamp NULL DEFAULT NULL,
  `branch_id` int(10) unsigned DEFAULT NULL,
  `tracking_code` varchar(50) DEFAULT NULL,
  `note` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_orders_number` (`order_number`),
  KEY `idx_orders_status` (`status`),
  KEY `idx_orders_customer` (`customer_id`),
  KEY `idx_orders_phone` (`customer_phone`),
  KEY `idx_orders_created` (`created_at`),
  KEY `idx_orders_branch` (`branch_id`),
  CONSTRAINT `fk_orders_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_orders_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES
(1,'ORD-1404001',1,'علی رضایی','09121234567',NULL,'اصفهان','اصفهان','خیابان چهارباغ بالا، پلاک 45، واحد 3','8173954876',880000,0,880000,'DELIVERED','SHIPPING','POST','zarinpal','123456789',NULL,NULL,NULL,NULL,NULL,'2025-09-20 07:00:00','2026-10-21 14:26:17'),
(2,'ORD-1404002',2,'مریم احمدی','09351112233',NULL,'اصفهان','اصفهان','خیابان توحید، پلاک 12','8173964877',450000,45000,495000,'PAID','SHIPPING','SNAPP','zarinpal','987654321',NULL,NULL,NULL,NULL,NULL,'2025-09-18 12:15:00','2026-10-21 14:26:17'),
(3,'ORD-1404003',3,'حسن کریمی','09197778899',NULL,NULL,NULL,NULL,NULL,1720000,0,1720000,'SHIPPED','PICKUP','NONE',NULL,NULL,NULL,NULL,1,NULL,NULL,'2025-09-22 05:30:00','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `product_branch_stock`
--

DROP TABLE IF EXISTS `product_branch_stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_branch_stock` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `branch_id` int(10) unsigned NOT NULL,
  `product_id` int(10) unsigned NOT NULL,
  `total_weight_grams` int(11) NOT NULL DEFAULT 0,
  `reserved_weight_grams` int(11) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_product_branch_stock` (`branch_id`,`product_id`),
  KEY `idx_product_branch_stock_product` (`product_id`),
  CONSTRAINT `fk_product_branch_stock_branch` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_product_branch_stock_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_branch_stock`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `product_branch_stock` WRITE;
/*!40000 ALTER TABLE `product_branch_stock` DISABLE KEYS */;
INSERT INTO `product_branch_stock` VALUES
(1,1,1,75000,0,'2026-10-21 14:26:17'),
(2,1,2,55000,0,'2026-10-21 14:26:17'),
(3,1,3,25000,0,'2026-10-21 14:26:17'),
(4,1,4,45000,0,'2026-10-21 14:26:17'),
(5,1,5,50000,0,'2026-10-21 14:26:17');
/*!40000 ALTER TABLE `product_branch_stock` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `url` varchar(500) NOT NULL,
  `alt` varchar(200) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_images_product_primary` (`product_id`,`is_primary`),
  KEY `idx_images_product_sort` (`product_id`,`sort_order`),
  CONSTRAINT `fk_images_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES
(1,1,'/images/products/پسته اکبری.jpg','پسته اکبری ممتاز',1,1,'2026-10-21 14:26:17'),
(2,2,'/images/products/بادام درختی خام.jpg','بادام درختی خام',1,1,'2026-10-21 14:26:17'),
(3,3,'/images/products/فندق.jpg','فندق با پوست',1,1,'2026-10-21 14:26:17'),
(4,4,'/images/products/بادام هندی.jpg','بادام هندی شور',1,1,'2026-10-21 14:26:17'),
(5,5,'/images/products/تخمه افتاب گردون.jpg','تخمه آفتابگردان',1,1,'2026-10-21 14:26:17');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `product_reviews`
--

DROP TABLE IF EXISTS `product_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_reviews` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `rating` tinyint(3) unsigned NOT NULL,
  `title` varchar(100) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `is_verified_purchase` tinyint(1) NOT NULL DEFAULT 0,
  `is_approved` tinyint(1) NOT NULL DEFAULT 0,
  `approved_at` timestamp NULL DEFAULT NULL,
  `admin_reply` text DEFAULT NULL,
  `admin_reply_at` timestamp NULL DEFAULT NULL,
  `helpful_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_customer_product` (`customer_id`,`product_id`),
  KEY `idx_reviews_product_approved` (`product_id`,`is_approved`),
  KEY `idx_reviews_approved_created` (`is_approved`,`created_at`),
  KEY `idx_reviews_customer` (`customer_id`),
  KEY `idx_reviews_rating` (`rating`),
  CONSTRAINT `fk_reviews_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_reviews_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_reviews`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `product_reviews` WRITE;
/*!40000 ALTER TABLE `product_reviews` DISABLE KEYS */;
INSERT INTO `product_reviews` VALUES
(1,1,1,5,NULL,'کیفیت پسته اکبری فوق‌العاده بود. تازه و خوش‌طعم. حتماً دوباره سفارش می‌دم.',1,1,'2026-10-21 17:27:50','خیلی ممنون','2026-10-21 17:27:46',0,'2025-09-22 11:00:00','2026-10-21 17:27:50');
/*!40000 ALTER TABLE `product_reviews` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_variants` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `product_id` int(10) unsigned NOT NULL,
  `weight_gram` int(10) unsigned NOT NULL,
  `packaging_type` varchar(50) NOT NULL DEFAULT 'standard',
  `packaging_label` varchar(100) DEFAULT NULL,
  `price` decimal(12,0) NOT NULL,
  `compare_price` decimal(12,0) DEFAULT NULL,
  `sku` varchar(50) DEFAULT NULL,
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_variants_product_weight_packaging` (`product_id`,`weight_gram`,`packaging_type`),
  UNIQUE KEY `uk_variants_sku` (`sku`),
  KEY `idx_variants_product_active` (`product_id`,`is_active`),
  KEY `idx_variants_weight` (`weight_gram`),
  CONSTRAINT `fk_variants_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES
(1,1,250,'standard',NULL,450000,NULL,'PST-AKB-250',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(2,1,500,'standard',NULL,880000,950000,'PST-AKB-500',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(3,1,1000,'standard',NULL,1720000,NULL,'PST-AKB-1000',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(4,1,500,'gift_box','جعبه هدیه چوبی',980000,NULL,'PST-AKB-500-GIFT',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(5,2,250,'standard',NULL,280000,NULL,'BDM-DRK-250',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(6,2,500,'standard',NULL,550000,NULL,'BDM-DRK-500',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(7,2,1000,'standard',NULL,1080000,NULL,'BDM-DRK-1000',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(8,3,250,'standard',NULL,320000,NULL,'FND-PST-250',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(9,3,500,'standard',NULL,630000,NULL,'FND-PST-500',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(10,4,250,'standard',NULL,520000,NULL,'BDH-SHR-250',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(11,4,500,'standard',NULL,1020000,NULL,'BDH-SHR-500',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(12,5,250,'standard',NULL,120000,NULL,'TKH-AFT-250',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(13,5,500,'standard',NULL,230000,NULL,'TKH-AFT-500',NULL,1,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `slug` varchar(220) NOT NULL,
  `description` text DEFAULT NULL,
  `short_desc` varchar(500) DEFAULT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `meta_title` varchar(70) DEFAULT NULL,
  `meta_desc` varchar(160) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `view_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_products_slug` (`slug`),
  KEY `idx_products_category` (`category_id`),
  KEY `idx_products_active_featured` (`is_active`,`is_featured`),
  CONSTRAINT `fk_products_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES
(1,'پسته اکبری ممتاز','peste-akbari-momtaz','پسته اکبری یکی از مرغوب‌ترین انواع پسته ایرانی است. این محصول از باغات رفسنجان تأمین می‌شود و با نمک دریایی برشته می‌شود.','پسته اکبری درشت و خندان، برشته با نمک دریایی',4,'خرید پسته اکبری ممتاز','پسته اکبری درشت و خندان با کیفیت صادراتی، ارسال سریع',1,1,0,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(2,'بادام درختی خام','badam-darakhti-kham','بادام درختی خام بدون هیچ افزودنی، مناسب برای مصرف روزانه و رژیم‌های غذایی سالم.','بادام درختی خام و طبیعی، مناسب رژیم غذایی',5,'خرید بادام درختی خام','بادام درختی خام و طبیعی با کیفیت عالی',1,1,0,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(3,'فندق با پوست','fandogh-ba-pust','فندق با پوست از باغات اشکورات تأمین می‌شود. طعم تازه و مغز پر.','فندق تازه با پوست، مناسب پذیرایی',6,'خرید فندق با پوست','فندق تازه با پوست از باغات اشکورات',1,0,0,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(4,'بادام هندی شور','badam-hendi-shor','بادام هندی درجه یک، برشته شده با روغن گیاهی و نمک.','بادام هندی برشته و شور، مناسب پذیرایی',7,'خرید بادام هندی شور','بادام هندی درجه یک برشته و شور',1,1,0,'2026-10-21 14:26:17','2026-10-21 14:26:17'),
(5,'تخمه آفتابگردان شور','tokhme-aftabgardan-shor','تخمه آفتابگردان با نمک متوسط، برشته شده در کارگاه.','تخمه آفتابگردان شور و تازه',8,'خرید تخمه آفتابگردان','تخمه آفتابگردان تازه و شور',1,0,0,'2026-10-21 14:26:17','2026-10-21 14:26:17');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `review_media`
--

DROP TABLE IF EXISTS `review_media`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_media` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `review_id` int(10) unsigned NOT NULL,
  `media_type` enum('IMAGE','VIDEO') NOT NULL DEFAULT 'IMAGE',
  `url` varchar(500) NOT NULL,
  `thumbnail_url` varchar(500) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_review_media_review` (`review_id`,`sort_order`),
  CONSTRAINT `fk_review_media_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_media`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `review_media` WRITE;
/*!40000 ALTER TABLE `review_media` DISABLE KEYS */;
INSERT INTO `review_media` VALUES
(3,1,'IMAGE','/uploads/reviews/r-202610-5ae7278f8b89f6da.webp',NULL,1,'2026-10-21 16:52:06'),
(4,1,'IMAGE','/uploads/reviews/r-202610-7d80bf2805856725.webp',NULL,2,'2026-10-21 16:52:06');
/*!40000 ALTER TABLE `review_media` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;

--
-- Table structure for table `review_votes`
--

DROP TABLE IF EXISTS `review_votes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `review_votes` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `review_id` int(10) unsigned NOT NULL,
  `customer_id` int(10) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_review_vote` (`review_id`,`customer_id`),
  KEY `idx_review_votes_review` (`review_id`),
  KEY `idx_review_votes_customer` (`customer_id`),
  CONSTRAINT `fk_review_votes_customer` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_review_votes_review` FOREIGN KEY (`review_id`) REFERENCES `product_reviews` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `review_votes`
--

SET @OLD_AUTOCOMMIT=@@AUTOCOMMIT, @@AUTOCOMMIT=0;
LOCK TABLES `review_votes` WRITE;
/*!40000 ALTER TABLE `review_votes` DISABLE KEYS */;
/*!40000 ALTER TABLE `review_votes` ENABLE KEYS */;
UNLOCK TABLES;
COMMIT;
SET AUTOCOMMIT=@OLD_AUTOCOMMIT;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*M!100616 SET NOTE_VERBOSITY=@OLD_NOTE_VERBOSITY */;

-- Dump completed on 2026-10-23 11:29:40
