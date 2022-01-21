import { Prisma, PrismaClient } from "@prisma/client";
import fastify from "fastify";
import { z } from "zod";

const prisma = new PrismaClient();
const app = fastify({
  logger: true,
});

interface IPostByIdParam {
  id: number;
}

const IPostByIdParam: z.ZodSchema<IPostByIdParam> = z.lazy(() =>
  z.object({
    id: z.preprocess((a) => parseInt(a as string, 10), z.number().positive()),
  })
);

interface ICreatePostBody {
  title: string;
  content: string | null;
  authorEmail: string;
}

const ICreatePostBody: z.ZodSchema<ICreatePostBody> = z.lazy(() =>
  z.object({
    title: z.string(),
    content: z.union([z.string(), z.null()]),
    authorEmail: z.string(),
  })
);

interface ISignupBody {
  name: string | null;
  email: string;
  posts: Prisma.PostCreateInput[];
}

const ISignupBody: z.ZodSchema<ISignupBody> = z.lazy(() =>
  z.object({
    name: z.union([z.string(), z.null()]),
    email: z.string(),
    posts: z.array(z.any()),
  })
);

// Hello World
app.get("/", async (req, res) => {
  res.send({ Hello: "World" });
});

app.post<{
  Body: ISignupBody;
}>(`/signup`, async (req, res) => {
  ISignupBody.parse(req.body);
  const { name, email, posts } = req.body;

  const postData = posts?.map((post: Prisma.PostCreateInput) => {
    return { title: post?.title, content: post?.content };
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

app.post<{
  Body: ICreatePostBody;
}>(`/post`, async (req, res) => {
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

app.put<{
  Params: IPostByIdParam;
}>("/post/:id/views", async (req, res) => {
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
  } catch (error) {
    res.send({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.put<{
  Params: IPostByIdParam;
}>("/publish/:id", async (req, res) => {
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
      data: { published: !postData?.published },
    });
    res.send(updatedPost);
  } catch (error) {
    res.send({ error: `Post with ID ${id} does not exist in the database` });
  }
});

app.delete<{
  Params: IPostByIdParam;
}>(`/post/:id`, async (req, res) => {
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

app.get<{
  Params: IPostByIdParam;
}>("/user/:id/drafts", async (req, res) => {
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

app.get<{
  Params: IPostByIdParam;
}>(`/post/:id`, async (req, res) => {
  IPostByIdParam.parse(req.params);

  const { id } = req.params;

  const post = await prisma.post.findUnique({
    where: { id: Number(id) },
  });
  res.send(post);
});

app.get<{
  Querystring: IFeedQueryString;
}>("/feed", async (req, res) => {
  const { searchString, skip, take, orderBy } = req?.query;

  const or: Prisma.PostWhereInput = searchString
    ? {
        OR: [
          { title: { contains: searchString as string } },
          { content: { contains: searchString as string } },
        ],
      }
    : {};

  const posts = await prisma.post.findMany({
    where: {
      published: true,
      ...or,
    },
    include: { author: true },
    take: Number(take) || undefined,
    skip: Number(skip) || undefined,
    orderBy: {
      updatedAt: orderBy as Prisma.SortOrder,
    },
  });

  res.send(posts);
});
interface IFeedQueryString {
  searchString: string | null;
  skip: number | null;
  take: number | null;
  orderBy: Prisma.SortOrder | null;
}

app.listen(3000, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server ready at: http://localhost:3000`);
});
