const fs = require('fs');
import { writeFile, getAllContentFiles, getContentMetaData, getLinksFromMarkdown } from './utils'
const cheerio = require('cheerio');
// import fetch from 'node-fetch';

const mention = async () => {
    // Create a temporary object that gets replaced if content is found in the webmention.json
    const WEBMENTION_DATA = {}

    const dir = "./.webmention/webmention.json"
    if (!fs.existsSync(dir)){
        writeFile(dir, JSON.stringify(WEBMENTION_DATA), function (err) {
            if (err) throw err;
        });
    } else {
        fs.readFile('./.webmention/webmention.json', 'utf-8', function(err, data) {
            if (err) throw err;
            const fileData = JSON.parse(data)
            for (const [key, value] of  Object.entries(fileData)) {
                WEBMENTION_DATA[key] = value
            }
        })
    }

    // Get all existing files in the content folder
    const contentFiles = await getAllContentFiles();

    // Collects all metadata contained in all content files
    const files = []
    for (let i = 0; i < contentFiles.length; i++) {
        const data = await getContentMetaData(contentFiles[i]); 
        files.push(data)
    }

    // Get all keys in the webmention.json file
    const processedIds = Object.keys(WEBMENTION_DATA)
    // Filter all files that are already in the processedIds list
    const newFiles = files.filter(data => !processedIds.includes(data.id))

    // Loop through all new files
    for (let i = 0; i < newFiles.length; i++) {
        const newFile = newFiles[i]

        // Create our individual post data
        WEBMENTION_DATA[newFile.id] = { bf: {}, og: {}, re: {} }
        
        // if there is a reply in the metadata
        if (newFile.reply) {
            const link = newFile.reply
            console.log('Working on the reply')
            
            const response = await fetch(link)
            if (response.status === 200) {
                
                WEBMENTION_DATA[newFile.id].re[link] = { wm: null, ar: null }

                const doc = cheerio.load(response.body)
                const webmentionLink = doc('link[rel="webmention"]').attr('href')
                const pingbackLink = doc('link[rel="pingback"]').attr('href')
                if (webmentionLink) {
                    const res = await fetch(webmentionLink + `?target=${link}&source=https://slyduda.com${newFile._path}`, { method: 'POST' })
                    const data = res.json()

                    const payload = {
                        response: data,
                        status: res.status,
                        receiver: webmentionLink,
                        source: `https://slyduda.com${newFile._path}`,
                        target: link,
                        date: new Date().toJSON(), 
                    }

                    WEBMENTION_DATA[newFile.id].re[link].wm = payload 
                } else {
                    console.log(`No WebMention link included in ${link} headers`)
                    console.log(`Could not fallback on pingback`)
                }

                const res = await fetch('https://dawn-rain-4cff.bkardell.workers.dev/', { method: 'POST', body: JSON.stringify({ snapshotURL: link }) })

                if (res.status === 200) {
                    const data = res.json()
                    
                    const payload = {
                        response: data,
                        status: res.status,
                        target: link,
                        date: new Date().toJSON()
                    }

                    WEBMENTION_DATA[newFile.id].re[link].ar = payload
                } else {
                    console.log(`Could not archive the link`)
                }
            }
        }
        
        // If there is a backfeed in the metadata
        if (newFile.backfeed) {
            console.log('Working on the backfeed')

            // Bridgy types
            const types = ['twitter', 'mastodon', 'github', 'flickr']
            const keys = Object.keys(newFile.backfeed)

            // Loop through all backfeed keys
            for (let j = 0; j < keys.length; j++) {
                // If backfeed key is valid
                if (types.includes(keys[j])) {
                    const response = await fetch(`https://brid.gy/publish/webmention?target=https://brid.gy/publish/${keys[j]}&source=https://slyduda.com${newFile._path}&bridgy_omit_link=true`, {method: 'POST'})   
                    const data = response.json()
                    
                    const payload = {
                        response: data,
                        status: response.status,
                        receiver: 'https://brid.gy/publish/webmention',
                        source: `https://slyduda.com${newFile._path}`,
                        target: `https://brid.gy/publish/${keys[j]}`,
                        date: new Date().toJSON()
                    }

                    WEBMENTION_DATA[newFile.id].bf[keys[j]] = payload 
                }
            } 
        }

        // Get all of the links and loop through them
        const { links } = getLinksFromMarkdown(newFiles._path)
        for (let j = 0; j < links.length; i++) {
            const link = links[j]
            console.log(`Working on link #${j}`)

            WEBMENTION_DATA[newFile.id].og[link] = { wm: null, ar: null }
            
            const response = await fetch(link)
            if (response.status === 200) {
                const doc = cheerio.load(response.body)
                // TODO: MIGHT GET AN ERROR HERE DEPENDING ON HOW CHEERIO HANDLES ERRORS
                const webmentionLink = doc('link[rel="webmention"]').attr('href') 
                if (webmentionLink) {
                    const res = await fetch(webmentionLink + `?target=${link}&source=https://slyduda.com${newFile._path}`, { method: 'POST' })
                    const data = res.json()

                    const payload = {
                        response: data,
                        status: res.status,
                        receiver: webmentionLink,
                        source: `https://slyduda.com${newFile._path}`,
                        target: link,
                        date: new Date().toJSON()
                    }

                    WEBMENTION_DATA[newFile.id].og[link].wm = payload 
                } else {
                    console.log(`No WebMention link included in ${link} headers`)
                    console.log(`Could not fallback on pingback`)
                }

                const res = await fetch('https://dawn-rain-4cff.bkardell.workers.dev/', { method: 'POST', body: JSON.stringify({ snapshotURL: link }) })

                if (res.status === 200) {
                    const data = res.json()
                    
                    const payload = {
                        response: data,
                        status: res.status,
                        target: link,
                        date: new Date().toJSON()
                    }

                    WEBMENTION_DATA[newFile.id].og[link].ar = payload
                } else {
                    console.log(`Could not archive the link`)
                }
            }
        }

        writeFile(dir, JSON.stringify(WEBMENTION_DATA), function (err) {
            if (err) {
                console.log(JSON.stringify(WEBMENTION_DATA))
                throw err
            };
        })
    }
    
}

export default mention;