"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// A `main` function so that you can use async/await
async function main() {
    // ... you will write your Prisma Client queries here
}
main()
    .catch(e => {
    throw e;
})
    .finally(async () => {
    await prisma.$disconnect();
});
