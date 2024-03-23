-- AlterTable
ALTER TABLE `dialog` ADD COLUMN `pinnedMessageId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `Dialog` ADD CONSTRAINT `Dialog_pinnedMessageId_fkey` FOREIGN KEY (`pinnedMessageId`) REFERENCES `Message`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
