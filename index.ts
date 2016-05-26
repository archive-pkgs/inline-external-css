#!/usr/bin/env node
'use strict';
const log = require('./logger');
const fs = require('fs');
const path = require('path');
const meow = require('meow');
const HTMLparser = require('posthtml-parser');
const TreeRender = require('posthtml-render');
const mkdirp = require('mkdirp');

// @todo optimize tree shaking

const cli = meow({
  help: `
    Usage
      $ inline-css <input>

    Options
      -i --input <required>
      -o? --output?

    Examples
      $ inline-css -i ./test.html
      🌈 unicorns 🌈
`,
  alias: {
    i: 'input',
    o: 'output'
  }
});

interface TreeNode {
  tag: string,
  attrs: any,
  content: Array<string | TreeNode>
}

let entry = cli.flags.i;
let output = cli.flags.o || './bundle.html';

if (!entry) log('error', 'Entry file should be added');

function _walk(tree, cb) {
 if (Array.isArray(tree)) {
   tree.forEach((node, id, arr) => {
     tree[id] = _walk(cb(node), cb);
   });
  }
  if (tree && ({}).toString.call(tree) === '[object Object]'
   && tree.hasOwnProperty('content')) {
     if (!Array.isArray(tree.content)) return;
     _walk(tree.content, cb);
  }
  return tree;
}

function writeFile(src: string, data: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(src, data, (error, data) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

function readFileSync(src: string) {
  try { let _content = fs.readFileSync(src, { encoding: 'utf8' }); return _content; }
  catch(error) {
     log('error', `Could not read file ${error}`);
  }
}

function readFile(src: string) {
  return new Promise((resolve, reject) => {
    fs.readFile(src, 'utf8', (error: Error, data: string) => {
      if (error) return reject(error);
      resolve(data);
    });
  });
}

function traverser(treeNode: TreeNode) {
  if (treeNode.tag === 'link' && treeNode.attrs) {
    if (treeNode.attrs.rel === 'stylesheet' && treeNode.attrs.href) {
      let path: string = treeNode.attrs.href;
      let content: string  = readFileSync(path);
      if (!content.length) return treeNode;
      let node = { tag: 'style', content: [] };
      node.content.push('\n');
      content.split('\n').forEach((line) => {
        node.content.push(line + '\n');
      });
      return node;
    }
  }
  return treeNode;
}

function createRecursiveDir(path) {
  return new Promise((resolve, reject) => {
    fs.stat(path, (error, stat) => {
       if (stat.isDirectory()) return;
        mkdirp(path, (error) => {
        if (error) return reject(error);
        resolve();
      });
    });
  });
}

async function parseHTMLfile(entry) {
  try {
    const html = await readFile(entry);
    let HTMLTree = HTMLparser(html);
    if (!Object.keys(HTMLTree).length) return;
    return HTMLTree;
  } catch (error) {
    log('error', `Error while parsing html file: ${error}`);
  }
}

async function transformHTMLTree(tree) {
  try {
    const newTree = _walk(tree, traverser);
    let transformedHTML = TreeRender(newTree);
    return transformedHTML;
  } catch (error) {
    log('error', `Error while transforming tree ${tree}`);
  }
}

async function processHTMLTree(entry) {
  try {
    const parsedTree = await parseHTMLfile(entry);
    const transfomedHTML = await transformHTMLTree(await parsedTree);
    return { file: entry, ctx: transfomedHTML };
  } catch (error) {
    log.error('error', `Error while processing tree ${error}`);
  }
}



  // let xpath = path.parse(output);

  //   await createRecursiveDir(xpath.dir);
  //   await writeFile(output, transformedHTML);

  //   const parsed = path.parse(output);

  //   log('info', `File ${parsed.base} was written at ${parsed.dir}`);

if (Array.isArray(entry)) {
  const promises = entry.map((file) => {
    return processHTMLTree(file);
  });
  Promise.all(promises).then((results:any) => {
    let xpath = path.parse(output);
    const deffers = results.map((value, id, arr) => {
      return new Promise((resolve, reject) => {
        createRecursiveDir(xpath.dir)
        .then(() => {
          writeFile(path.join(xpath.dir, value.file), value.ctx)
            .then(() => {
              log('info', `File ${value.file} was written at ${xpath.dir}`);
              resolve();
            })
            .catch((error) => {
              log('info', `Error while attemping to write file ${error}`);
              reject(error);
            })
        })
        .catch((error) => {
          log('error', `Error while creating dir ${error}`);
          reject(error);
        });
      });
    });
    Promise.all(deffers).then(() => {
      log('info', `Files was written at ${xpath.dir}`);
    })
    .catch((error) => {
      log('error', `Error while attemping to write files ${error}`);
    });
  });
} else {
  console.log('test');
}
