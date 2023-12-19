/*
  Warnings:

  - You are about to drop the column `firstUserDialogId` on the `chat` table. All the data in the column will be lost.
  - You are about to drop the column `secondUserDialogId` on the `chat` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `Chat_firstUserDialogId_key` ON `chat`;

-- DropIndex
DROP INDEX `Chat_secondUserDialogId_key` ON `chat`;

-- AlterTable
ALTER TABLE `chat` DROP COLUMN `firstUserDialogId`,
    DROP COLUMN `secondUserDialogId`;
