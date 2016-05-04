#!/usr/bin/env node
'use strict';

import * as fs from 'fs';
import * as path from 'path';

const meow = require('meow');
const HTMLparser = require('posthtml-parser');
const TreeRender = require('posthtml-render');
const mkdirp = require('mkdirp')

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
let output = cli.flags.o || './_inlined.html';

if (!entry) console.log('Entry file should be added');

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
      resolve({ success: 'File was written!' });
    });
  });
}

function readFileSync(src: string) {
  try { let _content = fs.readFileSync(src, { encoding: 'utf8' }); return _content; }
  catch(error) {
     throw new Error('Could not read file: ' + JSON.stringify(error));
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
      content.split('\n').forEach((line) => {
        node.content.push(line);
      });
      return node;
    }
  }
  return treeNode;
}

function optimizer(tree: TreeNode[]) {
  tree.forEach((node: TreeNode|string) => {
    // @todo optimize traversed tree
  });
}

function createRecursiveDir(path) {
  return new Promise((resolve, reject) => {
    mkdirp(path, (error) => {
      if (error) return reject(error);
      resolve();
    });
  });
}

async function processHTMLTree() {
  try {
    const html = await readFile(entry);
    let HTMLTree = HTMLparser(html);

    if (!Object.keys(HTMLTree).length) throw new Error('Empty tree');

    let newTree = _walk(HTMLTree, traverser);
    let transformedHTML = TreeRender(newTree);
    let xpath = path.parse(output);

    await createRecursiveDir(xpath.dir);
    await writeFile(output, transformedHTML);
  } catch (error) {
    console.log('Error while processing tree, ERROR: ' + JSON.stringify(error));
  }
}

processHTMLTree();
