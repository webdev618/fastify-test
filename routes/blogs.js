const blogController = require("../controller/blogs");

const routes = [
  {
    method: "GET",
    url: "/api/blogs",
    handler: blogController.getAllBlogs,
  },
  {
    method: "GET",
    url: "/api/blogs/:id",
    handler: blogController.getBlog,
  },
  {
    method: "POST",
    url: "/api/blogs",
    handler: blogController.addBlog,
  },
  {
    method: "PUT",
    url: "/api/blogs/:id",
    handler: blogController.updateBlog,
  },
  {
    method: "DELETE",
    url: "/api/blogs/:id",
    handler: blogController.deleteBlog,
  },
];
module.exports = routes;
