import prompts from 'prompts';
import { v4 as uuidv4 } from 'uuid';
import request from 'request';
import { kebabCase, writeFile, makeid, stringIsAValidUrlScheme, stringIsAValidUrl } from './utils'

const create = async () => {
    const author = 'Sylvester Duda'
    const questions = [
        {
            type: 'text',
            name: 'author',
            initial: author,
            message: 'Who is the author of this post?'
        },
        {
            type: 'select',
            name: 'type',
            message: 'What kind of content are you creating?',
            choices: [
                { title: 'Blog', value: 'blog', description: 'A long format post with full markdown support' },
                { title: 'Post', value: 'post', description: 'A small format post with little markdown suport' },
                { title: 'Reply', value: 'reply', description: 'A post with an archived reference to external content' },
                { title: 'Repost', value: 'repost', disabled: true, description: 'A reshare of external content' },
                { title: 'Bookmark', value: 'bookmark', disabled: true, description: 'A bookmark of external content' },
                { title: 'Like', value: 'like', disabled: true, description: 'A post indicating external content was enjoyable' },
            ],
        },
        {
            type: prev => prev == 'blog' ? 'text' : null,
            name: 'title',
            message: 'What is the title of this post?',
            validate: value => value.length <= 0 ? `Post must have a title!` : true
        },
        {
            type: prev => !['post', 'reply', 'repost', 'bookmark', 'like'].includes(prev)  ? 'text' : null,
            name: 'description',
            message: 'What is the description of this post?',
            hint: 'Can be changed later'
        },
        {
            type: prev => prev == 'reply' ? 'text' : null,
            name: 'reply_source',
            message: 'What is the URL that this post is a reply to?',
            validate: value => !stringIsAValidUrl(value) ? `Reply source must be a valid URL!` : !stringIsAValidUrlScheme(value, ['https', 'http']) ? 'Reply source must have a valid scheme!' : true
        },
        {
            type: 'multiselect',
            name: 'backfeed',
            message: 'What services would you like to backfeed this post to?',
            choices: [
                { title: 'Twitter', value: 'twitter' },
                { title: 'Mastodon', value: 'mastodon' },
                { title: 'Github', value: 'github' },
                { title: 'Flickr', value: 'flickr' },
            ],
            hint: '(requires Bridgy)',
            instructions: '\n\t- Space to select. Return to submit'
        },
        {
            type: 'toggle',
            name: 'confirm',
            message: 'Generate post?',
            initial: false,
            active: 'yes',
            inactive: 'no'
        }
    ]
    const response = await prompts(questions);
    
    console.log(response); 
    // let archive = 'false';
    const dir = './src/content/' + kebabCase(response.title ? response.title : uuidv4().toString()) + '.md'

    function generateTemplate() {
        let template = "---\n"
        template += `id: '${response.type === 'blog' ? makeid(4) : makeid(6)}'\n`;
        template += response.title ? `title: '${response.title}'\n` : '';
        template += response.description !== undefined ? `description: '${response.description}'\n` : ''; // Since description can be blank on blog posts on generate
        template += `created: '${new Date().toJSON()}'\n`;
        template += `author: '${author}'\n`;
        template += response.type === 'reply' ? `reply: ${response.reply_source}\n` : '';
        template += `backfeed:\n`;
        template += `\ttwitter: ${response.backfeed.includes("twitter") ? 'true' : 'false'}'\n`;
        template += `\tmastodon: ${response.backfeed.includes("mastodon") ? 'true' : 'false'}'\n`;
        template += `\tgithub: ${response.backfeed.includes("github") ? 'true' : 'false'}'\n`;
        template += `\tflickr: ${response.backfeed.includes("flickr") ? 'true' : 'false'}'\n`;
        template += `---\n\nHello World!`
        return template
    };

    
    if (response.type === 'reply') {
        request.post('https://dawn-rain-4cff.bkardell.workers.dev/', { json: { snapshotURL: response.reply_source } }, (error, result) => {
            // if (!error && result.statusCode == 200) archive = 'true'
            writeFile(dir, generateTemplate(), function (err) {
                if (err) throw err;
            })
        })
    } else {
        writeFile(dir, generateTemplate(), function (err) {
            if (err) throw err;
        })
    }    
    
};

export default create;