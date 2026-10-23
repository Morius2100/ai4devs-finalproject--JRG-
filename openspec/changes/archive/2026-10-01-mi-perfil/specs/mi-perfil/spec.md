## ADDED Requirements

### Requirement: Pantalla Mi perfil

El sistema SHALL ofrecer en `/perfil` la pantalla del perfil del propio usuario. Tendrá una cabecera con el fondo amarillo de marca que contenga:

- la foto de perfil grande o, si no tiene, un círculo con su inicial;
- el nombre de usuario;
- la descripción, si existe, omitida sin dejar hueco si no la tiene;
- los contadores «N temas» (todos sus temas, incluidos los privados) y «N amigos»;
- un botón «Editar perfil» que lleva a `/perfil/editar`.

El contador de amigos SHALL ser un enlace a `/perfil/amigos`. Los contadores SHALL usar el singular con 1 («1 tema», «1 amigo»). Origen: HU-21 (CA-21.1).

#### Scenario: Perfil propio completo
- **WHEN** "ana", con foto, la descripción "Opino de cine", 12 temas (uno privado) y 2 amigos, abre `/perfil`
- **THEN** la cabecera muestra su foto, "ana", "Opino de cine", «12 temas», «2 amigos» y el botón «Editar perfil»

#### Scenario: Perfil propio sin foto ni descripción
- **WHEN** un usuario recién registrado "eva", sin temas ni amigos, abre `/perfil`
- **THEN** la cabecera muestra un círculo con la letra "E", el nombre, «0 temas» y «0 amigos», sin texto de descripción

#### Scenario: Ir a la lista de amigos
- **WHEN** "ana" pulsa «2 amigos» en su perfil
- **THEN** el sistema abre `/perfil/amigos`

### Requirement: Mis temas en el perfil

El sistema SHALL mostrar en `/perfil`, debajo de la cabecera, la sección «Mis temas» con todos los temas creados por el usuario, públicos y privados. Los privados SHALL llevar la etiqueta «Privado». Los temas SHALL usar la misma tarjeta y el mismo selector de orden («Más recientes» por defecto, «Más puntuados») que los temas del perfil de una persona, con carga en páginas de 20. Si no tiene temas, SHALL mostrar «Todavía no has creado temas» y un enlace a `/temas/nuevo`. Origen: HU-21 (CA-21.3).

#### Scenario: Temas propios con un privado
- **WHEN** "ana", con 11 temas públicos y 1 privado, abre `/perfil`
- **THEN** «Mis temas» muestra los 12 temas en orden «Más recientes» y el privado lleva la etiqueta «Privado»

#### Scenario: Más puntuados
- **WHEN** "ana" elige «Más puntuados» en «Mis temas»
- **THEN** la lista se recarga ordenada por votos totales de mayor a menor

#### Scenario: Sin temas propios
- **WHEN** "eva", sin temas, abre `/perfil`
- **THEN** la sección muestra «Todavía no has creado temas» y un enlace para crear uno

### Requirement: Lista de amigos

El sistema SHALL mostrar en `/perfil/amigos` la lista de amigos del usuario con el título «Amigos». Como la amistad es simétrica, esta única lista equivale a seguidos y seguidores. La lista SHALL:

- ordenarse alfabéticamente por nombre de usuario, sin distinguir mayúsculas y minúsculas;
- usar la misma tarjeta que la pantalla Personas (foto o inicial, nombre e indicador «Amigo»);
- abrir el perfil de la persona (`/persona?id=<id>`) al pulsar una tarjeta;
- cargarse en páginas de 20 con scroll infinito.

Sin amigos, SHALL mostrar «Todavía no tienes amigos» y un enlace a `/personas`. Si el usuario quita a alguien de amigos desde su perfil, al volver a la lista esa persona SHALL NOT aparecer. Origen: HU-21 (CA-21.2).

#### Scenario: Lista de amigos
- **WHEN** "ana", amiga de "carla" y "bruno", abre `/perfil/amigos`
- **THEN** la lista muestra "bruno" y "carla", en ese orden, con el indicador «Amigo», y pulsar "bruno" abre su perfil

#### Scenario: Sin amigos
- **WHEN** "eva", sin amigos, abre `/perfil/amigos`
- **THEN** el sistema muestra «Todavía no tienes amigos» y un enlace a Personas

#### Scenario: Quitar un amigo y volver
- **WHEN** "ana" abre el perfil de "bruno" desde su lista de amigos, lo quita de amigos y vuelve atrás
- **THEN** la lista de amigos ya no muestra a "bruno" y el contador de su perfil baja a «1 amigo»

### Requirement: Editar foto y descripción

El sistema SHALL ofrecer en `/perfil/editar` un formulario para cambiar la foto de perfil y la descripción:

- la foto actual (o la inicial) con la vista previa de la nueva foto elegida;
- «Cambiar foto», que admite JPEG, PNG o WebP de hasta 5 MB, validados por su contenido real;
- «Quitar foto», solo si tiene foto;
- la descripción, de hasta 160 caracteres, con un contador de caracteres restantes; guardada vacía, se elimina;
- los botones «Guardar» y «Cancelar».

Al guardar con éxito, el sistema SHALL volver a `/perfil` con los datos nuevos. La foto y la descripción nuevas SHALL verse también en Personas, en el perfil que ven los demás y en las historias. Si la foto no es válida o supera el tamaño, SHALL mostrar el error junto al campo y SHALL NOT cambiar ningún dato. Cancelar SHALL volver a `/perfil` sin cambios. Origen: HU-20 (CA-20.1–CA-20.4).

#### Scenario: Cambiar la foto
- **WHEN** "ana" elige una imagen PNG de 1 MB en «Cambiar foto» y pulsa «Guardar»
- **THEN** vuelve a `/perfil`, la cabecera muestra la nueva foto y "bruno" la ve en el perfil de "ana"

#### Scenario: Quitar la foto
- **WHEN** "ana" pulsa «Quitar foto» y «Guardar»
- **THEN** su perfil muestra el círculo con la inicial "A"

#### Scenario: Editar la descripción
- **WHEN** "ana" escribe "Cinéfila y debatidora" y pulsa «Guardar»
- **THEN** su perfil muestra esa descripción

#### Scenario: Vaciar la descripción
- **WHEN** "ana" borra toda la descripción y pulsa «Guardar»
- **THEN** su perfil ya no muestra descripción ni deja hueco

#### Scenario: Descripción demasiado larga
- **WHEN** "ana" intenta escribir más de 160 caracteres
- **THEN** el campo no admite más de 160 y el contador indica «0 caracteres restantes»

#### Scenario: Foto no válida
- **WHEN** "ana" elige un archivo PDF, o una imagen de 6 MB, y pulsa «Guardar»
- **THEN** el formulario muestra «Solo se permiten imágenes JPEG, PNG o WebP» o «La imagen supera el tamaño máximo de 5 MB», y ni la foto ni la descripción cambian

### Requirement: API de mi perfil

El sistema SHALL exponer para el usuario de la sesión:

- `GET /api/me` → `200 { id, username, avatarUrl, bio, topicsCount, friendsCount }`;
- `GET /api/me/friends?cursor=` → `200 { items, nextCursor }` con la misma forma que `GET /api/users`, páginas de 20;
- `PATCH /api/me` con `multipart/form-data`, todos los campos opcionales:
  - `bio`: texto de hasta 160 caracteres, recortado; vacío → sin descripción;
  - `avatar`: imagen;
  - `removeAvatar`: `"true"`.

`PATCH /api/me` SHALL devolver `200` con el perfil actualizado. SHALL responder `400` si la descripción supera 160 caracteres o si se envían a la vez `avatar` y `removeAvatar`, `413` si la imagen supera 5 MB y `415` si no es JPEG, PNG o WebP; en esos casos SHALL NOT modificar ningún dato. Ninguna respuesta SHALL incluir el email ni la contraseña. Sin sesión, todos SHALL responder `401`. Origen: HU-20 (CA-20.1–CA-20.4), HU-21 (CA-21.1, CA-21.2).

#### Scenario: Leer el perfil propio
- **WHEN** "ana" envía `GET /api/me`
- **THEN** recibe su id, nombre, foto, descripción y los contadores de temas y amigos, sin email

#### Scenario: Actualizar solo la descripción
- **WHEN** "ana" envía `PATCH /api/me` con `bio=Hola`
- **THEN** la respuesta es `200` con `bio: "Hola"` y la foto no cambia

#### Scenario: Imagen no admitida
- **WHEN** "ana" envía `PATCH /api/me` con un `avatar` en formato GIF y `bio=Nueva`
- **THEN** la respuesta es `415` y ni la foto ni la descripción cambian

#### Scenario: Petición sin sesión
- **WHEN** se envía `GET /api/me/friends` sin sesión
- **THEN** el sistema responde `401`
