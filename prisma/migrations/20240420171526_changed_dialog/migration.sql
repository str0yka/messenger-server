/*
  Warnings:

  - You are about to drop the column `blocked` on the `dialog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `dialog` DROP COLUMN `blocked`;

-- CreateTable
CREATE TABLE `_blockedDialogs` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_blockedDialogs_AB_unique`(`A`, `B`),
    INDEX `_blockedDialogs_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `_blockedDialogs` ADD CONSTRAINT `_blockedDialogs_A_fkey` FOREIGN KEY (`A`) REFERENCES `Dialog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_blockedDialogs` ADD CONSTRAINT `_blockedDialogs_B_fkey` FOREIGN KEY (`B`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
