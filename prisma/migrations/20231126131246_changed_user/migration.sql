/*
  Warnings:

  - You are about to drop the column `verifyLink` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `verifyLink`,
    ADD COLUMN `verificationCode` INTEGER NULL;
