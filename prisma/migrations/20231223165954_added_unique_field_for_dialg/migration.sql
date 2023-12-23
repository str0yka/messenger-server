/*
  Warnings:

  - A unique constraint covering the columns `[userId,partnerId]` on the table `Dialog` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `Dialog_userId_partnerId_key` ON `Dialog`(`userId`, `partnerId`);
