/*
  Warnings:

  - You are about to drop the column `activationLink` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `activationLink`,
    ADD COLUMN `verifyLink` VARCHAR(191) NULL;
