-- AlterTable
ALTER TABLE `message` ADD COLUMN `replyMessageId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_replyMessageId_fkey` FOREIGN KEY (`replyMessageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
