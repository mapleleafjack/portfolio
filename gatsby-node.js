exports.onCreatePage = async ({ page, actions }) => {
  const { createPage } = actions;

  // Handle client-side routes
  if (page.path === `/`) {
    page.matchPath = `/*`;
    createPage(page);
  }
};