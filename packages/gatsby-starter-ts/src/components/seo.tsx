/**
 * SEO component that queries for data with
 *  Gatsby's useStaticQuery React hook
 *
 * See: https://www.gatsbyjs.org/docs/use-static-query/
 */

import * as React from 'react'
import { Helmet } from 'react-helmet'
import { useStaticQuery, graphql } from 'gatsby'
import ensureKeys from '../helpers/ensure-keys'
import { SeoQuery } from '../../graphql-types'
import gql from 'graphql-tag'

type MetaProps = JSX.IntrinsicElements['meta']

interface Props {
  title: string
  description?: string
  lang?: string
  meta?: MetaProps[]
}

const SEO: React.FC<Props> = ({
  title,
  description = ``,
  lang = `en`,
  meta = [],
}) => {
  const { site } = useStaticQuery<SeoQuery>(
    graphql`
      query Seo {
        site {
          siteMetadata {
            title
            description
            author
          }
        }
      }
    `
  )

  const {
    author,
    description: siteDescription,
  } = ensureKeys(site?.siteMetadata, [`author`, `description`])

  const metaDescription = description ?? siteDescription

  return (
    <Helmet
      htmlAttributes={{
        lang,
      }}
      title={title}
      titleTemplate={`%s | ${site?.siteMetadata?.title}`}
      meta={[
        {
          name: `description`,
          content: metaDescription,
        },
        {
          property: `og:title`,
          content: title,
        },
        {
          property: `og:description`,
          content: metaDescription,
        },
        {
          property: `og:type`,
          content: `website`,
        },
        {
          name: `twitter:card`,
          content: `summary`,
        },
        {
          name: `twitter:creator`,
          content: author,
        },
        {
          name: `twitter:title`,
          content: title,
        },
        {
          name: `twitter:description`,
          content: metaDescription,
        },
        ...meta,
      ]}
    />
  )
}

/**
 * `gatsby-plugin-ts`/`gatsby-plugin-graphql-codegen` supports codegen for
 * non-gatsby schemas. This is useful if you're using a client-side GraphQL client.
 *
 * Read more at: https://github.com/d4rekanguok/gatsby-typescript/blob/master/packages/gatsby-plugin-graphql-codegen/readme.md#additional-schema-options-for-optionsadditionalschemas
 */
export const someTestQuery = gql`
  query Pikachu {
    pokemon(name: "Pikachu") {
      id
      number
      name
      attacks {
        special {
          name
          type
          damage
        }
      }
      evolutions {
        id
        number
        name
        weight {
          minimum
          maximum
        }
        attacks {
          fast {
            name
            type
            damage
          }
        }
      }
    }
  }
`

export default SEO
