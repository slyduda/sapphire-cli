# Sapphire CLI

Sapphire CLI is a Command Line Interface used to make creating, publishing, and mentioning content easy.

## Create

Sapphire CLI can be used to create markdown files that can be consumed by `@nuxt/content` and untlimately the Sapphire website builder when it is ready. Create prepares the application to generate files with the necessary information to support your static website and to support WebMention integration.

Create does the following:
- Creates a markdown template dependent on the kind of content that you are creating (blog posts, general posts or reply posts)
- Adds an id, slug, dewscription, author, creation date, backfeed links, and archives any links that are being replied to

## Publish

Publish does the following:
- Asks if you would like to publish any drafted content files
- Converts non-drafts from drafts to falsey
- Does a git add, commit, and push
- On the server-side it will run `npx nuxi generate` and `sapphire-cli --mention`

## Mention

Mention does the following:
- Pulls the changes on the server
- Crawls through new content for reply urls, backfeed urls, and linked urls in posts
- Sends WebMentions and archives all urls above storing data in a json file

## To-do

- Test coverage
- CLI Installation steps