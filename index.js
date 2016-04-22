#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');

const meow = require('meow');
const mkdirp = require('mkdirp');
const pkg = require('./package.json');
const HTMLparser = require('posthtml-parser');
const treeRender = require('posthtml-render');

const cli = meow({
  help: [
    'Usage',
    '  $ br ./test[.sh]',
    '',
    'Options',
    '  --output  Specify output file directory',
    '  --watch   Watch for changes in required files and rebuild on the fly',
    '',
    'version: ' + pkg.version
  ],
  alias:{
    i: 'input',
    o: 'output'
  }
});

let entry = cli.flags.i;
let output = cli.flags.o || './processes.html';

if (!entry) return console.warn('Entry file should be added');

function readFileData(src) {
  try { let _content = fs.readFileSync(src, { encoding: 'utf8' }); return _content; }
  catch(error) {
     throw new Error('Could not read file: ' + JSON.stringify(error));
  }
}

const html = readFileData(entry);
let postHMTLTree = HTMLparser(html);
if (!Object.keys(postHMTLTree).length) throw new Error('Empty tree');

function walk(tree,cb) {
 if (Array.isArray(tree)) {
   tree.forEach((node, id, arr) => {
     tree[id] = walk(cb(node), cb);
   });
  }
  if (tree && ({}).toString.call(tree) === '[object Object]'
   && tree.hasOwnProperty('content')) {
     if (!Array.isArray(tree.content)) return;
     walk(tree.content, cb);
  }
  return tree;
}

let newTree = walk(postHMTLTree, function (treeNode) {
  if (treeNode.tag === 'link' && treeNode.attrs) {
    if (treeNode.attrs.rel === 'stylesheet' && treeNode.attrs.href) {
      let path = treeNode.attrs.href;
      let content = readFileData(path);
      if (!content.length) return treeNode;
      let node = { tag: 'style', content: [] };
      content.split('\n').forEach((line) => {
        node.content.push(line);
      });
      return node;
    }
  }
  return treeNode;
});

let transformedHTML = treeRender(newTree);
let xpath = path.parse(output);

mkdirp.sync(xpath.dir);
fs.writeFile(output, transformedHTML, 'utf8', (err, data) => {
   if (err) throw new Error('Error while trying write to file'+ JSON.stringify(err));
   console.log('File was written');
});

