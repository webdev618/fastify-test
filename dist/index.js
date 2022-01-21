"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fastify_1 = __importDefault(require("fastify"));
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const app = (0, fastify_1.default)();
const IPostByIdParam = zod_1.z.lazy(() => zod_1.z.object({
    id: zod_1.z.number(),
}));
const ICreatePostBody = zod_1.z.lazy(() => zod_1.z.object({
    title: zod_1.z.string(),
    content: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]),
    authorEmail: zod_1.z.string(),
}));
const ISignupBody = zod_1.z.lazy(() => zod_1.z.object({
    name: zod_1.z.union([zod_1.z.string(), zod_1.z.null()]),
    email: zod_1.z.string(),
    posts: zod_1.z.array(zod_1.z.any()),
}));
app.get("/", async (req, res) => {
    res.send({ Hello: "World" });
});
app.post(`/signup`, async (req, res) => {
    ISignupBody.parse(req.body);
    const { name, email, posts } = req.body;
    const postData = posts === null || posts === void 0 ? void 0 : posts.map((post) => {
        return { title: post === null || post === void 0 ? void 0 : post.title, content: post === null || post === void 0 ? void 0 : post.content };
    });
    const result = await prisma.user.create({
        data: {
            name,
            email,
            posts: {
                create: postData,
            },
        },
    });
    res.send(result);
});
app.post(`/post`, async (req, res) => {
    ICreatePostBody.parse(req.body);
    const { title, content, authorEmail } = req.body;
    const result = await prisma.post.create({
        data: {
            title,
            content,
            author: { connect: { email: authorEmail } },
        },
    });
    res.send(result);
});
app.put("/post/:id/views", async (req, res) => {
    IPostByIdParam.parse(req.params);
    const { id } = req.params;
    try {
        const post = await prisma.post.update({
            where: { id: Number(id) },
            data: {
                viewCount: {
                    increment: 1,
                },
            },
        });
        res.send(post);
    }
    catch (error) {
        res.send({ error: `Post with ID ${id} does not exist in the database` });
    }
});
app.put("/publish/:id", async (req, res) => {
    IPostByIdParam.parse(req.params);
    const { id } = req.params;
    try {
        const postData = await prisma.post.findUnique({
            where: { id: Number(id) },
            select: {
                published: true,
            },
        });
        const updatedPost = await prisma.post.update({
            where: { id: Number(id) || undefined },
            data: { published: !(postData === null || postData === void 0 ? void 0 : postData.published) },
        });
        res.send(updatedPost);
    }
    catch (error) {
        res.send({ error: `Post with ID ${id} does not exist in the database` });
    }
});
app.delete(`/post/:id`, async (req, res) => {
    IPostByIdParam.parse(req.params);
    const { id } = req.params;
    const post = await prisma.post.delete({
        where: {
            id: Number(id),
        },
    });
    res.send(post);
});
app.get("/users", async (req, res) => {
    const users = await prisma.user.findMany();
    res.send(users);
});
app.get("/user/:id/drafts", async (req, res) => {
    IPostByIdParam.parse(req.params);
    const { id } = req.params;
    const drafts = await prisma.user
        .findUnique({
        where: { id: Number(id) },
    })
        .posts({
        where: { published: false },
    });
    res.send(drafts);
});
app.get(`/post/:id`, async (req, res) => {
    IPostByIdParam.parse(req.params);
    const { id } = req.params;
    const post = await prisma.post.findUnique({
        where: { id: Number(id) },
    });
    res.send(post);
});
app.get("/feed", async (req, res) => {
    const { searchString, skip, take, orderBy } = req === null || req === void 0 ? void 0 : req.query;
    const or = searchString
        ? {
            OR: [
                { title: { contains: searchString } },
                { content: { contains: searchString } },
            ],
        }
        : {};
    const posts = await prisma.post.findMany({
        where: Object.assign({ published: true }, or),
        include: { author: true },
        take: Number(take) || undefined,
        skip: Number(skip) || undefined,
        orderBy: {
            updatedAt: orderBy,
        },
    });
    res.send(posts);
});
app.listen(3000, (err) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server ready at: http://localhost:3000`);
});
