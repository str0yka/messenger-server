/*
  Warnings:

  - You are about to drop the `_blockeddialogs` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `_blockeddialogs` DROP FOREIGN KEY `_blockedDialogs_A_fkey`;

-- DropForeignKey
ALTER TABLE `_blockeddialogs` DROP FOREIGN KEY `_blockedDialogs_B_fkey`;

-- DropTable
DROP TABLE `_blockeddialogs`;
