const { URL, parse } = require('url');
const fs = require('fs');
const path = require('path');
const markdownLinkExtractor = require('markdown-link-extractor');
import glob from 'glob';
const parseMD = require('parse-md').default;

const getLinksFromMarkdown = async (path) => {
    const markdown = fs.readFileSync('src/content' + path + '.md', {encoding: 'utf8'});

    const { links } = markdownLinkExtractor(markdown);
    return links
}

const getAllContentFiles = async () => {
    const formats = ['.md'] // ['.md', '.json', '.csv', 'yml'] Since we only support md right now
    let res = glob.sync('src/content' + '/**/*')
    return res
        .map(dir => dir.replace('src/content', ''))
        .filter(dir => formats.some(ft => dir.endsWith(ft)))
        .map(dir => dir.replace(/\.[^/.]+$/, ""));
}

const getContentMetaData = async (file) => {
    const fileContents = fs.readFileSync( 'src/content' + file + '.md', 'utf-8')
    const { metadata } = parseMD(fileContents)
    return { _path: file, ...metadata }
}

const stringIsAValidUrl = (s) => {
    try {
        new URL(s);
        return true;
    } catch (err) {
        return false;
    }
};

const stringIsAValidUrlScheme = (s, protocols) => {
    try {
        new URL(s);
        const parsed = parse(s);
        return protocols
            ? parsed.protocol
                ? protocols.map(x => `${x.toLowerCase()}:`).includes(parsed.protocol)
                : false
            : true;
    } catch (err) {
        return false;
    }
};

const makeid = (length) => {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const writeFile = (pathname, contents, cb) => {
    const __dirname = path.resolve();
    const folderName = pathname.replace(/^\.*\/|\/?[^\/]+\.[a-z]+|\/$/g, ''); // Remove leading directory markers, and remove ending /file-name.extension
    fs.mkdir(path.resolve(__dirname, folderName), { recursive: true }, err => {
        if (err) return cb(err);
        console.log(pathname, folderName)
        fs.writeFileSync(pathname, contents, cb);
    });
}

const kebabCase = (string) => string
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, '-')
    .toLowerCase();

export { kebabCase, writeFile, makeid, stringIsAValidUrlScheme, stringIsAValidUrl, getAllContentFiles, getContentMetaData, getLinksFromMarkdown }