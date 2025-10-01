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
    title: `Jack Musajo - portfolio`,
  },
  plugins: [
    {
      resolve: `gatsby-plugin-google-fonts`,
      options: {
        fonts: [
          `oxanium`,
          `source sans pro\:300,400,400i,700` // you can also specify font weights and styles
        ],
        display: 'swap'
      }
    },
    `gatsby-plugin-client-side-redirect`
  ]
}