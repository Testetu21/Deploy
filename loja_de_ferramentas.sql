-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: loja_de_ferramentas
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `caixa`
--

DROP TABLE IF EXISTS `caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caixa` (
  `id_caixa` int(11) NOT NULL AUTO_INCREMENT,
  `data` datetime NOT NULL,
  `valor_abertura` int(11) NOT NULL,
  `valor_fechamento` decimal(10,2) DEFAULT NULL,
  `id_funcionario` int(11) NOT NULL,
  `observacoes` text DEFAULT NULL,
  `status` tinyint(4) DEFAULT 1 COMMENT '1=Aberto 0=Fechado',
  PRIMARY KEY (`id_caixa`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `caixa_ibfk_1` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caixa`
--

LOCK TABLES `caixa` WRITE;
/*!40000 ALTER TABLE `caixa` DISABLE KEYS */;
INSERT INTO `caixa` VALUES (12,'2026-04-13 20:48:18',1,NULL,3,NULL,1);
/*!40000 ALTER TABLE `caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id_cliente` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) DEFAULT NULL,
  `cpf_cnpj` varchar(20) DEFAULT NULL,
  `telefone` char(15) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `endereço` varchar(255) DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `senha` varchar(255) DEFAULT NULL,
  `usuario` varchar(150) DEFAULT NULL,
  `nivel_acesso` int(11) NOT NULL,
  PRIMARY KEY (`id_cliente`),
  UNIQUE KEY `cpf_cnpj` (`cpf_cnpj`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `nivel_acesso` (`nivel_acesso`),
  CONSTRAINT `cliente_ibfk_1` FOREIGN KEY (`nivel_acesso`) REFERENCES `nivel_acesso` (`id_nivel_acesso`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (1,'Carlos Eduardo','529.982.247-25','11999998888','carlos@email.com','Rua A, 123',1,'$2b$10$BXSaZnnt9fnr5RI9GdODcOY7W1umLuEfEiHlttq.YEbhOTT8WTd9i','carlos',6),(2,'Fernanda Lima','987.654.321-00','11988887777','fernanda@email.com','Rua B, 456',1,'$2b$10$WSCB4.lDhcvGL7QVJ8LjUOihguGgYHMYrozQCMMgm5K1A58DZ1AxC','fernanda',6),(8,'eu','105.233.183-16','(85) 9909-7435','vcbdfgfdgfvfdsvfdsg@gmail.com','Yamdjfggdg ',1,'$2b$10$F5jZQqY5pucamnfxNKWwu.RfiKXDnlBwAmMt0xnXQ8njhLykwpdVC','bgfenfdnfd',6);
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `despesa`
--

DROP TABLE IF EXISTS `despesa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `despesa` (
  `id_despesa` int(11) NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `valor` decimal(10,2) DEFAULT NULL,
  `status` enum('pendente','pago') DEFAULT 'pendente',
  `data` datetime DEFAULT current_timestamp(),
  `categoria` varchar(100) DEFAULT NULL,
  `id_funcionario` int(11) DEFAULT NULL,
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `despesa_ibfk_1` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `despesa`
--

LOCK TABLES `despesa` WRITE;
/*!40000 ALTER TABLE `despesa` DISABLE KEYS */;
INSERT INTO `despesa` VALUES (0,'Motoboy',20.00,'pendente','2026-04-13 00:00:00',NULL,NULL);
/*!40000 ALTER TABLE `despesa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `fornecedor`
--

DROP TABLE IF EXISTS `fornecedor`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `fornecedor` (
  `id_fornecedor` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `telefone` char(11) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `endereco` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id_fornecedor`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `fornecedor`
--

LOCK TABLES `fornecedor` WRITE;
/*!40000 ALTER TABLE `fornecedor` DISABLE KEYS */;
INSERT INTO `fornecedor` VALUES (1,'Ferramentas LTDA','1133334444','contato@ferramentas.com','Av Industrial, 1000'),(2,'Máquinas Brasil','1144445555','vendas@maquinasbr.com','Rua das Oficinas, 500');
/*!40000 ALTER TABLE `fornecedor` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `funcionario`
--

DROP TABLE IF EXISTS `funcionario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `funcionario` (
  `id_funcionario` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(150) NOT NULL,
  `cargo` int(11) DEFAULT NULL,
  `salario` decimal(10,2) NOT NULL,
  `percentual_comissao` decimal(5,2) DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL,
  PRIMARY KEY (`id_funcionario`),
  KEY `cargo` (`cargo`),
  CONSTRAINT `funcionario_ibfk_1` FOREIGN KEY (`cargo`) REFERENCES `nivel_acesso` (`id_nivel_acesso`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `funcionario`
--

LOCK TABLES `funcionario` WRITE;
/*!40000 ALTER TABLE `funcionario` DISABLE KEYS */;
INSERT INTO `funcionario` VALUES (1,'João Silva',2,3500.00,2.00,1),(2,'Maria Santos',3,2500.00,3.00,1),(3,'Pedro Costa',4,3200.00,0.00,1),(4,'Ana Lima',5,2200.00,0.00,1),(5,'Ricardo Holanda de Abreu',1,8000.00,2.00,1),(7,'Yago',4,2.00,0.00,1);
/*!40000 ALTER TABLE `funcionario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item_venda`
--

DROP TABLE IF EXISTS `item_venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item_venda` (
  `id_item_venda` int(11) NOT NULL AUTO_INCREMENT,
  `id_venda` int(11) NOT NULL,
  `id_produto` int(11) NOT NULL,
  `quantidade` int(11) NOT NULL,
  `valor_unitario` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_item_venda`),
  KEY `id_venda` (`id_venda`),
  KEY `id_produto` (`id_produto`),
  CONSTRAINT `item_venda_ibfk_1` FOREIGN KEY (`id_venda`) REFERENCES `venda` (`id_venda`),
  CONSTRAINT `item_venda_ibfk_2` FOREIGN KEY (`id_produto`) REFERENCES `produto` (`id_produto`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item_venda`
--

LOCK TABLES `item_venda` WRITE;
/*!40000 ALTER TABLE `item_venda` DISABLE KEYS */;
INSERT INTO `item_venda` VALUES (14,11,4,1,189.00),(15,12,2,1,249.00),(16,12,1,1,299.00),(17,13,1,1,299.00);
/*!40000 ALTER TABLE `item_venda` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentacao_caixa`
--

DROP TABLE IF EXISTS `movimentacao_caixa`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentacao_caixa` (
  `id_movimentacao` int(11) NOT NULL AUTO_INCREMENT,
  `id_caixa` int(11) NOT NULL,
  `tipo` enum('entrada','saida') NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `id_referencia` int(11) DEFAULT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `data` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_movimentacao`),
  KEY `id_caixa` (`id_caixa`),
  CONSTRAINT `movimentacao_caixa_ibfk_1` FOREIGN KEY (`id_caixa`) REFERENCES `caixa` (`id_caixa`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacao_caixa`
--

LOCK TABLES `movimentacao_caixa` WRITE;
/*!40000 ALTER TABLE `movimentacao_caixa` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimentacao_caixa` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimentacao_estoque`
--

DROP TABLE IF EXISTS `movimentacao_estoque`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimentacao_estoque` (
  `id_movimentacao` int(11) NOT NULL AUTO_INCREMENT,
  `id_produto` int(11) NOT NULL,
  `tipo` enum('entrada','saida','ajuste') NOT NULL,
  `quantidade` int(11) NOT NULL,
  `motivo` varchar(255) DEFAULT NULL,
  `id_funcionario` int(11) DEFAULT NULL,
  `data_movimentacao` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_movimentacao`),
  KEY `id_produto` (`id_produto`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `movimentacao_estoque_ibfk_1` FOREIGN KEY (`id_produto`) REFERENCES `produto` (`id_produto`),
  CONSTRAINT `movimentacao_estoque_ibfk_2` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimentacao_estoque`
--

LOCK TABLES `movimentacao_estoque` WRITE;
/*!40000 ALTER TABLE `movimentacao_estoque` DISABLE KEYS */;
/*!40000 ALTER TABLE `movimentacao_estoque` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nivel_acesso`
--

DROP TABLE IF EXISTS `nivel_acesso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nivel_acesso` (
  `id_nivel_acesso` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) NOT NULL,
  PRIMARY KEY (`id_nivel_acesso`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nivel_acesso`
--

LOCK TABLES `nivel_acesso` WRITE;
/*!40000 ALTER TABLE `nivel_acesso` DISABLE KEYS */;
INSERT INTO `nivel_acesso` VALUES (1,'ADMIN'),(2,'GERENTE'),(3,'VENDEDOR'),(4,'TECNICO'),(5,'CAIXA'),(6,'CLIENTE');
/*!40000 ALTER TABLE `nivel_acesso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacao`
--

DROP TABLE IF EXISTS `notificacao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacao` (
  `id_notificacao` int(11) NOT NULL AUTO_INCREMENT,
  `id_funcionario` int(11) NOT NULL,
  `titulo` varchar(255) NOT NULL,
  `mensagem` text NOT NULL,
  `lida` tinyint(4) DEFAULT 0,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_notificacao`),
  KEY `id_funcionario` (`id_funcionario`),
  CONSTRAINT `notificacao_ibfk_1` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacao`
--

LOCK TABLES `notificacao` WRITE;
/*!40000 ALTER TABLE `notificacao` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orcamento`
--

DROP TABLE IF EXISTS `orcamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orcamento` (
  `id_orcamento` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `valor_total` int(11) NOT NULL,
  `validade` date NOT NULL,
  `descricao` text DEFAULT NULL,
  `tipo` enum('normal','os') DEFAULT 'normal',
  `status` enum('pendente','aceito','cancelado') DEFAULT 'pendente',
  PRIMARY KEY (`id_orcamento`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `orcamento_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orcamento`
--

LOCK TABLES `orcamento` WRITE;
/*!40000 ALTER TABLE `orcamento` DISABLE KEYS */;
INSERT INTO `orcamento` VALUES (6,1,150,'2000-07-08','Furadeira nao liga ','os','pendente'),(8,8,1200,'2026-04-28','Tutu quebrou','normal','pendente');
/*!40000 ALTER TABLE `orcamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordem_servico`
--

DROP TABLE IF EXISTS `ordem_servico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordem_servico` (
  `id_ordem_servico` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_tecnico` int(11) DEFAULT NULL,
  `descricao_problema` varchar(150) NOT NULL,
  `data_abertura` datetime NOT NULL,
  `id_orcamento` int(11) DEFAULT NULL,
  `valor_total` int(11) NOT NULL,
  `status` int(11) DEFAULT 0,
  `status_execucao` tinyint(4) DEFAULT 0 COMMENT '0=Aguardando 1=Em diagnóstico 2=Em reparo 3=Concluído 4=Cancelado',
  `data_recebimento` datetime DEFAULT NULL,
  `data_conclusao` datetime DEFAULT NULL,
  `equipamento` varchar(255) DEFAULT NULL,
  `numero_serie` varchar(100) DEFAULT NULL,
  `condicao_entrada` text DEFAULT NULL,
  PRIMARY KEY (`id_ordem_servico`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_tecnico` (`id_tecnico`),
  KEY `id_orcamento` (`id_orcamento`),
  CONSTRAINT `ordem_servico_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `ordem_servico_ibfk_2` FOREIGN KEY (`id_tecnico`) REFERENCES `funcionario` (`id_funcionario`),
  CONSTRAINT `ordem_servico_ibfk_3` FOREIGN KEY (`id_orcamento`) REFERENCES `orcamento` (`id_orcamento`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordem_servico`
--

LOCK TABLES `ordem_servico` WRITE;
/*!40000 ALTER TABLE `ordem_servico` DISABLE KEYS */;
INSERT INTO `ordem_servico` VALUES (1,1,3,'Furadeira não liga','2026-04-05 09:06:27',6,0,1,2,NULL,'2026-04-25 11:19:50',NULL,NULL,NULL),(6,8,3,'Tutu quebrou','2026-04-28 19:17:51',8,0,0,3,NULL,'2026-04-28 19:49:07',NULL,NULL,NULL);
/*!40000 ALTER TABLE `ordem_servico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_diagnostico`
--

DROP TABLE IF EXISTS `os_diagnostico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_diagnostico` (
  `id_diagnostico` int(11) NOT NULL AUTO_INCREMENT,
  `id_ordem_servico` int(11) NOT NULL,
  `id_tecnico` int(11) NOT NULL,
  `descricao` text NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_diagnostico`),
  KEY `id_ordem_servico` (`id_ordem_servico`),
  KEY `id_tecnico` (`id_tecnico`),
  CONSTRAINT `os_diagnostico_ibfk_1` FOREIGN KEY (`id_ordem_servico`) REFERENCES `ordem_servico` (`id_ordem_servico`) ON DELETE CASCADE,
  CONSTRAINT `os_diagnostico_ibfk_2` FOREIGN KEY (`id_tecnico`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_diagnostico`
--

LOCK TABLES `os_diagnostico` WRITE;
/*!40000 ALTER TABLE `os_diagnostico` DISABLE KEYS */;
INSERT INTO `os_diagnostico` VALUES (1,1,3,'Perda total ☠️','2026-04-25 11:18:32');
/*!40000 ALTER TABLE `os_diagnostico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_garantia`
--

DROP TABLE IF EXISTS `os_garantia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_garantia` (
  `id_garantia` int(11) NOT NULL AUTO_INCREMENT,
  `id_ordem_servico` int(11) NOT NULL,
  `dias_garantia` int(11) NOT NULL DEFAULT 90,
  `data_inicio` date NOT NULL,
  `data_fim` date NOT NULL,
  `observacoes` text DEFAULT NULL,
  PRIMARY KEY (`id_garantia`),
  KEY `id_ordem_servico` (`id_ordem_servico`),
  CONSTRAINT `os_garantia_ibfk_1` FOREIGN KEY (`id_ordem_servico`) REFERENCES `ordem_servico` (`id_ordem_servico`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_garantia`
--

LOCK TABLES `os_garantia` WRITE;
/*!40000 ALTER TABLE `os_garantia` DISABLE KEYS */;
/*!40000 ALTER TABLE `os_garantia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `os_reparo`
--

DROP TABLE IF EXISTS `os_reparo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `os_reparo` (
  `id_reparo` int(11) NOT NULL AUTO_INCREMENT,
  `id_ordem_servico` int(11) NOT NULL,
  `id_tecnico` int(11) NOT NULL,
  `descricao` text NOT NULL,
  `pecas_utilizadas` text DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id_reparo`),
  KEY `id_ordem_servico` (`id_ordem_servico`),
  KEY `id_tecnico` (`id_tecnico`),
  CONSTRAINT `os_reparo_ibfk_1` FOREIGN KEY (`id_ordem_servico`) REFERENCES `ordem_servico` (`id_ordem_servico`) ON DELETE CASCADE,
  CONSTRAINT `os_reparo_ibfk_2` FOREIGN KEY (`id_tecnico`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `os_reparo`
--

LOCK TABLES `os_reparo` WRITE;
/*!40000 ALTER TABLE `os_reparo` DISABLE KEYS */;
INSERT INTO `os_reparo` VALUES (1,1,3,'Impossivel dar algum reparo ☠️','Foi o tutu que disse','2026-04-25 11:19:00');
/*!40000 ALTER TABLE `os_reparo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagamento`
--

DROP TABLE IF EXISTS `pagamento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagamento` (
  `id_pagamento` int(11) NOT NULL AUTO_INCREMENT,
  `id_venda` int(11) DEFAULT NULL,
  `id_ordem_servico` int(11) DEFAULT NULL,
  `id_cliente` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `forma_pagamento` enum('dinheiro','cartao_credito','cartao_debito','pix','boleto','transferencia') NOT NULL,
  `parcelas` int(11) DEFAULT 1,
  `status` enum('pendente','pago','cancelado') DEFAULT 'pendente',
  `data_pagamento` datetime DEFAULT NULL,
  `data_vencimento` date NOT NULL,
  `descricao` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT NULL ON UPDATE current_timestamp(),
  `id_despesa` int(11) DEFAULT NULL,
  `numero_recibo` varchar(20) DEFAULT NULL,
  `observacoes` text DEFAULT NULL,
  PRIMARY KEY (`id_pagamento`),
  KEY `id_venda` (`id_venda`),
  KEY `id_ordem_servico` (`id_ordem_servico`),
  KEY `id_cliente` (`id_cliente`),
  CONSTRAINT `pagamento_ibfk_1` FOREIGN KEY (`id_venda`) REFERENCES `venda` (`id_venda`) ON DELETE SET NULL,
  CONSTRAINT `pagamento_ibfk_2` FOREIGN KEY (`id_ordem_servico`) REFERENCES `ordem_servico` (`id_ordem_servico`) ON DELETE SET NULL,
  CONSTRAINT `pagamento_ibfk_3` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamento`
--

LOCK TABLES `pagamento` WRITE;
/*!40000 ALTER TABLE `pagamento` DISABLE KEYS */;
INSERT INTO `pagamento` VALUES (3,13,NULL,1,299.00,'cartao_debito',1,'pendente','1222-02-09 00:00:00','2026-04-13','Venda #13','2026-04-13 14:22:52','2026-04-13 14:24:43',NULL,NULL,NULL),(4,NULL,NULL,1,200.00,'dinheiro',1,'pendente',NULL,'2026-04-13','Despesa #5 - Motoboy','2026-04-13 14:52:27',NULL,5,NULL,NULL);
/*!40000 ALTER TABLE `pagamento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagamento_parcela`
--

DROP TABLE IF EXISTS `pagamento_parcela`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagamento_parcela` (
  `id_parcela` int(11) NOT NULL AUTO_INCREMENT,
  `id_pagamento` int(11) NOT NULL,
  `numero_parcela` int(11) NOT NULL,
  `valor` decimal(10,2) NOT NULL,
  `data_vencimento` date NOT NULL,
  `data_pagamento` datetime DEFAULT NULL,
  `status` enum('pendente','pago','atrasado') DEFAULT 'pendente',
  PRIMARY KEY (`id_parcela`),
  KEY `id_pagamento` (`id_pagamento`),
  CONSTRAINT `pagamento_parcela_ibfk_1` FOREIGN KEY (`id_pagamento`) REFERENCES `pagamento` (`id_pagamento`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagamento_parcela`
--

LOCK TABLES `pagamento_parcela` WRITE;
/*!40000 ALTER TABLE `pagamento_parcela` DISABLE KEYS */;
/*!40000 ALTER TABLE `pagamento_parcela` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produto`
--

DROP TABLE IF EXISTS `produto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produto` (
  `id_produto` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(155) NOT NULL,
  `preco_custo` int(11) NOT NULL,
  `preco_venda` int(11) NOT NULL,
  `quantidade_estoque` int(11) NOT NULL,
  `estoque_minimo` int(11) NOT NULL,
  `garantia` int(11) NOT NULL,
  `id_fornecedor` int(11) NOT NULL,
  `tipo` int(11) NOT NULL,
  `possui_garantia` tinyint(1) NOT NULL DEFAULT 1,
  `dias_garantia` int(11) NOT NULL DEFAULT 90,
  PRIMARY KEY (`id_produto`),
  KEY `fornecedor` (`id_fornecedor`),
  CONSTRAINT `fornecedor` FOREIGN KEY (`id_fornecedor`) REFERENCES `fornecedor` (`id_fornecedor`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produto`
--

LOCK TABLES `produto` WRITE;
/*!40000 ALTER TABLE `produto` DISABLE KEYS */;
INSERT INTO `produto` VALUES (1,'Furadeira Elétrica',150,299,47,10,12,1,1,1,90),(2,'Parafusadeira',120,249,38,8,12,1,1,1,90),(3,'Serra Circular',280,549,19,5,24,2,1,1,90),(4,'Lixadeira',90,189,31,7,12,1,1,1,90);
/*!40000 ALTER TABLE `produto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reparo`
--

DROP TABLE IF EXISTS `reparo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reparo` (
  `id_reparo` int(11) NOT NULL AUTO_INCREMENT,
  `id_ordem_servico` int(11) NOT NULL,
  `descricao_servico` varchar(150) NOT NULL,
  `custo` int(11) NOT NULL,
  `data` date NOT NULL,
  PRIMARY KEY (`id_reparo`),
  KEY `id_ordem_servico` (`id_ordem_servico`),
  CONSTRAINT `reparo_ibfk_1` FOREIGN KEY (`id_ordem_servico`) REFERENCES `ordem_servico` (`id_ordem_servico`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reparo`
--

LOCK TABLES `reparo` WRITE;
/*!40000 ALTER TABLE `reparo` DISABLE KEYS */;
INSERT INTO `reparo` VALUES (1,1,'Troca do motor',150,'2026-04-05');
/*!40000 ALTER TABLE `reparo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int(11) NOT NULL AUTO_INCREMENT,
  `usuario` varchar(150) NOT NULL,
  `senha` varchar(255) DEFAULT NULL,
  `nivel_acesso` int(11) NOT NULL,
  `ativo` tinyint(1) NOT NULL,
  `data_criacao` datetime DEFAULT current_timestamp(),
  `id_funcionario` int(11) DEFAULT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `nivel_acesso` (`nivel_acesso`),
  KEY `funcionario` (`id_funcionario`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`nivel_acesso`) REFERENCES `nivel_acesso` (`id_nivel_acesso`),
  CONSTRAINT `usuario_ibfk_2` FOREIGN KEY (`id_funcionario`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'gerente','$2b$10$YotLFaecegAHeWE2HhiZsO9GjmxcMfixxNAuP/amoRhd5AhHVuObG',2,1,'2026-04-05 09:06:27',1),(2,'vendedor','$2b$10$u2cdTHt8d8gGjzfaiUGBEOJa1E7xKKuLPaGiTQ26ZDCQIi9JkfLQS',3,1,'2026-04-05 09:06:27',2),(3,'tecnico','$2b$10$GtcZ7oSiVco1FOgn2hGwmey6bmkd1klZnUbzyl2n576WR13MRv2pC',4,1,'2026-04-05 09:06:27',3),(4,'caixa','$2b$10$SOb839MEvrW2k3yk6Dsl2.aiZub3V3WcNYoK8JfwQC4O5tzjpNghi',5,1,'2026-04-05 09:06:27',4),(5,'admin','$2b$10$uG66YLsxf.rT/npUZFgYsuPV2BRphepeSlM1GB370l8kKD4GGDc3G',1,1,'2026-04-05 11:42:26',5),(7,'Yago','$2b$10$jZ4fxuoqSyrnkDKVn.9eCuPTE2zLTmmxyx/4gkML9d4/osF0lPH.q',4,1,'2026-04-12 16:17:48',7);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `venda`
--

DROP TABLE IF EXISTS `venda`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `venda` (
  `id_venda` int(11) NOT NULL AUTO_INCREMENT,
  `id_cliente` int(11) NOT NULL,
  `id_vendedor` int(11) NOT NULL,
  `valor_total` int(11) NOT NULL,
  `data_venda` datetime DEFAULT NULL,
  `status` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id_venda`),
  KEY `id_cliente` (`id_cliente`),
  KEY `id_vendedor` (`id_vendedor`),
  CONSTRAINT `venda_ibfk_1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`) ON DELETE CASCADE,
  CONSTRAINT `venda_ibfk_2` FOREIGN KEY (`id_vendedor`) REFERENCES `funcionario` (`id_funcionario`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `venda`
--

LOCK TABLES `venda` WRITE;
/*!40000 ALTER TABLE `venda` DISABLE KEYS */;
INSERT INTO `venda` VALUES (11,2,2,189,'2026-04-06 21:58:05',1),(12,1,2,548,'2026-04-13 13:37:29',1),(13,1,2,299,'2026-04-13 14:22:51',0);
/*!40000 ALTER TABLE `venda` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-04 21:35:53
