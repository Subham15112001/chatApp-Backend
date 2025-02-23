/*
  Warnings:

  - You are about to drop the column `delivered` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `seen` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Message` table. All the data in the column will be lost.
  - You are about to drop the `_UserChats` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[initiatorId,participantId]` on the table `Chat` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `initiatorId` to the `Chat` table without a default value. This is not possible if the table is not empty.
  - Added the required column `participantId` to the `Chat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_A_fkey";

-- DropForeignKey
ALTER TABLE "_UserChats" DROP CONSTRAINT "_UserChats_B_fkey";

-- DropIndex
DROP INDEX "User_username_key";

-- AlterTable
ALTER TABLE "Chat" ADD COLUMN     "initiatorId" INTEGER NOT NULL,
ADD COLUMN     "participantId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "delivered",
DROP COLUMN "seen",
DROP COLUMN "updatedAt";

-- DropTable
DROP TABLE "_UserChats";

-- CreateIndex
CREATE INDEX "Chat_initiatorId_idx" ON "Chat"("initiatorId");

-- CreateIndex
CREATE INDEX "Chat_participantId_idx" ON "Chat"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Chat_initiatorId_participantId_key" ON "Chat"("initiatorId", "participantId");

-- CreateIndex
CREATE INDEX "Message_chatId_idx" ON "Message"("chatId");

-- CreateIndex
CREATE INDEX "Message_senderId_idx" ON "Message"("senderId");

-- CreateIndex
CREATE INDEX "Message_receiverId_idx" ON "Message"("receiverId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_initiatorId_fkey" FOREIGN KEY ("initiatorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
