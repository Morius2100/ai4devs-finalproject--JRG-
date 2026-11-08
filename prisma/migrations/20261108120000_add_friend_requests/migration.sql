-- CreateTable: solicitudes de amistad pendientes (Q-04, cambio amistades-y-confidencialidad).
-- `friendships` no cambia: sigue conteniendo solo amistades aceptadas.
CREATE TABLE "friend_requests" (
    "requester_id" UUID NOT NULL,
    "addressee_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("requester_id","addressee_id"),
    CONSTRAINT "friend_requests_no_self" CHECK ("requester_id" <> "addressee_id")
);

-- CreateIndex
CREATE INDEX "friend_requests_addressee_id_idx" ON "friend_requests"("addressee_id");

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
