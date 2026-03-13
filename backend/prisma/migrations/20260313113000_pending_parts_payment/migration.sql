CREATE TABLE `PendingPartPayment` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `pidx` VARCHAR(191) NOT NULL,
  `userId` INTEGER NOT NULL,
  `expectedAmount` INTEGER NOT NULL,
  `items` JSON NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `PendingPartPayment_pidx_key`(`pidx`),
  INDEX `PendingPartPayment_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
