import Listr from 'listr';
import prompts from 'prompts';
const execa = require('execa');
import fs from 'fs'
import { getAllContentFiles, getContentMetaData } from './utils';



const gitAdd = async () => {
  const result = await execa('git', ['add', '.'], {
    cwd: process.cwd()
  });
  if (result.failed) {
    return Promise.reject(new Error('Failed to add files to project'));
  }
  return Promise.resolve('Foo');
}

const gitCommit = async (message="default") => {
  const result = await execa('git', ['commit', '-m', `"${message}"`]);
  if (result.failed) {
    return Promise.reject(new Error('Failed to commit files'));
  }
  return;
}

const gitPush = async () => {
  const result = await execa('git', ['push', 'origin', 'main']);
  if (result.failed) {
    return Promise.reject(new Error('Failed to commit files'));
  }
  return;
}

const changeDraftStatus = async (contentFiles=[]) => {
  for (let i = 0; i < contentFiles.length; i++) {
    const file = contentFiles[i]
    const fileContents = fs.readFileSync( 'src/content' + file + '.md', 'utf-8')
    const newFileContents = fileContents.replace(/(.*?)draft:.*\n/i, "draft: false\n")
    fs.writeFileSync('src/content' + file + '.md', newFileContents)
  }
}

const publish = async () => {
  // Gets a list of all files in the content folder
  const contentFiles = await getAllContentFiles();
  
  // Collects all metadata contained in all md files
  const files = []
  for (let i = 0; i < contentFiles.length; i++) {
    const data = await getContentMetaData(contentFiles[i]); 
    files.push(data)
  }
  console.log(files)

  const drafts = files.filter(val => val.draft)
  
  let questions = []
  if (drafts.length > 0) {
    questions = [
      {
          type: 'multiselect',
          name: 'files',
          choices: drafts.map(val => ({ title: `${val.id} - ${val._path}`, value: val })),
          message: "Select files that you'd like to publish",
          instructions: false
      },
      {
        type: 'toggle',
        name: 'confirm',
        message: prev => `${prev.length} files will be published`,
        initial: false,
        active: 'yes',
        inactive: 'no'
      }
    ]
  } else {
    questions = [
      {
        type: 'toggle',
        name: 'confirm',
        message: `0 files will be published`,
        initial: false,
        active: 'yes',
        inactive: 'no'
      }
    ]
  }

  const response = await prompts(questions);
  console.log(response.files)

  // If there are drafts and we selected some of them
  if (drafts.length === 0) return true
  if (response.files.length === 0) return true
  
  await changeDraftStatus(response.files.map(v => v._path))

  const tasks = new Listr(
    [
      {
        title: 'Adding all files to Git',
        task: () => gitAdd(),
      },
      {
        title: 'Committing all changes to Git',
        task: () => gitCommit(),
      },
      {
        title: 'Pushing all changes to Main',
        task: () => gitPush(),
      },
    ]
  )

  await tasks.run();
  return true;
}

export default publish;