/*
  Warnings:

  - The `verificationCodeCreatedAt` column on the `user` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `verificationCodeCreatedAt`,
    ADD COLUMN `verificationCodeCreatedAt` DATETIME(3) NULL;
