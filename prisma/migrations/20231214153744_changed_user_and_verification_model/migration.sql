/*
  Warnings:

  - You are about to drop the column `isVerified` on the `verification` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` ADD COLUMN `isVerified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `verification` DROP COLUMN `isVerified`;
