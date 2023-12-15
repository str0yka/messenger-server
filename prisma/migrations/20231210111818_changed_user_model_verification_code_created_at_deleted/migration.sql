/*
  Warnings:

  - You are about to drop the column `verificationCodeCreatedAt` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `verificationCodeCreatedAt`;
