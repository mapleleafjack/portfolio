/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.com/docs/reference/config-files/gatsby-config/
 */

/**
 * @type {import('gatsby').GatsbyConfig}
 */
module.exports = {
  siteMetadata: {
    siteUrl: "https://www.jackmusajo.it", // Your site URL
  },
  plugins: [{
    resolve: `gatsby-plugin-s3`,
    options: {
      bucketName: "www.jackmusajo.it", // Your S3 bucket name
    },
  }],
}
