ALTER TABLE "trainers" ADD COLUMN "approved" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "_TrainerClientAssignments" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

CREATE UNIQUE INDEX "_TrainerClientAssignments_AB_unique" ON "_TrainerClientAssignments"("A", "B");
CREATE INDEX "_TrainerClientAssignments_B_index" ON "_TrainerClientAssignments"("B");
ALTER TABLE "_TrainerClientAssignments" ADD CONSTRAINT "_TrainerClientAssignments_A_fkey" FOREIGN KEY ("A") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_TrainerClientAssignments" ADD CONSTRAINT "_TrainerClientAssignments_B_fkey" FOREIGN KEY ("B") REFERENCES "trainers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
