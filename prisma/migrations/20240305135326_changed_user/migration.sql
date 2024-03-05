/*
  Warnings:

  - A unique constraint covering the columns `[username]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `name` VARCHAR(191) NOT NULL DEFAULT 'name';

-- CreateIndex
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);