-- CreateIndex: `/api/media` busca el tema de cada imagen por su clave (TKT-084) en una ruta pública.
CREATE INDEX "topics_image_url_idx" ON "topics"("image_url");
