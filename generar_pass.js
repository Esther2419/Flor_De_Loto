const bcrypt = require('bcrypt');

async function generar() {
    const passMiguel = await bcrypt.hash('miguelmg365', 10);
    const passEsther = await bcrypt.hash('dametuga1', 10);

    console.log('--- COPIA ESTO EN TU BASE DE DATOS ---');
    console.log(`UPDATE "public"."usuarios" SET "password" = '${passMiguel}' WHERE "email" = 'miguelangelmassigeronimo@gmail.com';`);
    console.log(`UPDATE "public"."usuarios" SET "password" = '${passEsther}' WHERE "email" = '6264654t@gmail.com';`);
}

generar();