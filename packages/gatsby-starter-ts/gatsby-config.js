module.exports = {
  siteMetadata: {
    title: `Gatsby TypeScript Starter`,
    description: `Kick off your next, great Gatsby project with this default starter. This barebones starter ships with the main Gatsby configuration files you might need.`,
    author: `@gatsbyjs`,
  },
  plugins: [
    `gatsby-plugin-react-helmet`,
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `images`,
        path: `${__dirname}/src/images`,
      },
    },
    `gatsby-transformer-sharp`,
    `gatsby-plugin-sharp`,
    {
      resolve: `gatsby-plugin-manifest`,
      options: {
        name: `gatsby-starter-ts`,
        short_name: `starter`,
        start_url: `/`,
        background_color: `#294E80`,
        theme_color: `#294E80`,
        display: `minimal-ui`,
        icon: `src/images/gatsby-icon.png`, // This path is relative to the root of the site.
      },
    },
    {
      resolve: `gatsby-plugin-ts`,
      options: {
        additionalSchemas: [
          {
            // demo api https://github.com/lucasbento/graphql-pokemon
            key: 'pokemon',
            schema: 'https://graphql-pokemon2.vercel.app',
            pluckConfig: {
              globalGqlIdentifierName: 'gql',
              modules: [
                {
                  name: 'graphql-tag',
                  identifier: 'gql',
                },
              ],
            },
          },
        ],
      },
    },
    // this (optional) plugin enables Progressive Web App + Offline functionality
    // To learn more, visit: https://gatsby.dev/offline
    // `gatsby-plugin-offline`,
  ],
}
