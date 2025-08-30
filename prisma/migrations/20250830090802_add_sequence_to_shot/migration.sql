/*
  Warnings:

  - Added the required column `team` to the `Shot` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Shot" ADD COLUMN     "sequence" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "team" TEXT NOT NULL;
