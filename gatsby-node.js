const defined_pages = ['/egcdemo'];

exports.onCreatePage = async ({ page, actions }) => {
  const { createPage, deletePage } = actions;

  // Skip catch-all for standalone pages
  if (defined_pages.includes(page.path.replace(/\/$/, '') || '/')) {
    return;
  }

  // Handle client-side routes
  if (page.path === `/`) {
    page.matchPath = `/*`;
    createPage(page);
  }
};