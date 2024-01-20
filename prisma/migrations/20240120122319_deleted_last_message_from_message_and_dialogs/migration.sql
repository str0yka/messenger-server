/*
  Warnings:

  - You are about to drop the column `lastMessageId` on the `dialog` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `dialog` DROP FOREIGN KEY `Dialog_lastMessageId_fkey`;

-- AlterTable
ALTER TABLE `dialog` DROP COLUMN `lastMessageId`;
