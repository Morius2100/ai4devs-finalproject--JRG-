-- CreateTable: temas ajenos que un usuario ha abierto; alimenta las historias de amigos (F-08).
CREATE TABLE "topic_views" (
    "user_id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "viewed_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "topic_views_pkey" PRIMARY KEY ("user_id","topic_id")
);

-- AddForeignKey
ALTER TABLE "topic_views" ADD CONSTRAINT "topic_views_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "topic_views" ADD CONSTRAINT "topic_views_topic_id_fkey" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;
