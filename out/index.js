#!/usr/bin/env node
'use strict';
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator.throw(value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments)).next());
    });
};
const fs = require('fs');
const path = require('path');
const meow = require('meow');
const HTMLparser = require('posthtml-parser');
const TreeRender = require('posthtml-render');
const mkdirp = require('mkdirp');
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
let entry = cli.flags.i;
let output = cli.flags.o || './_inlined.html';
if (!entry)
    console.log('Entry file should be added');
function _walk(tree, cb) {
    if (Array.isArray(tree)) {
        tree.forEach((node, id, arr) => {
            tree[id] = _walk(cb(node), cb);
        });
    }
    if (tree && ({}).toString.call(tree) === '[object Object]'
        && tree.hasOwnProperty('content')) {
        if (!Array.isArray(tree.content))
            return;
        _walk(tree.content, cb);
    }
    return tree;
}
function WriteFile(src, data) {
    return new Promise((resolve, reject) => {
        fs.writeFile(src, data, (error, data) => {
            if (error)
                return reject(error);
            resolve({ success: 'File was written!' });
        });
    });
}
function ReadFileSync(src) {
    try {
        let _content = fs.readFileSync(src, { encoding: 'utf8' });
        return _content;
    }
    catch (error) {
        throw new Error('Could not read file: ' + JSON.stringify(error));
    }
}
function ReadFile(src) {
    return new Promise((resolve, reject) => {
        fs.readFile(src, 'utf8', (error, data) => {
            if (error)
                return reject(error);
            resolve(data);
        });
    });
}
function traverser(treeNode) {
    if (treeNode.tag === 'link' && treeNode.attrs) {
        if (treeNode.attrs.rel === 'stylesheet' && treeNode.attrs.href) {
            let path = treeNode.attrs.href;
            let content = ReadFileSync(path);
            if (!content.length)
                return treeNode;
            let node = { tag: 'style', content: [] };
            content.split('\n').forEach((line) => {
                node.content.push(line);
            });
            return node;
        }
    }
    return treeNode;
}
function CreateRecursiveDir(path) {
    return new Promise((resolve, reject) => {
        mkdirp(path, (error) => {
            if (error)
                return reject(error);
            resolve();
        });
    });
}
function ProcessHTMLTree() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const html = yield ReadFile(entry);
            let HTMLTree = HTMLparser(yield html);
            if (!Object.keys(HTMLTree).length)
                throw new Error('Empty tree');
            let newTree = _walk(HTMLTree, traverser);
            let transformedHTML = TreeRender(newTree);
            let xpath = path.parse(output);
            yield CreateRecursiveDir(xpath.dir);
            yield WriteFile(output, transformedHTML);
        }
        catch (error) {
            console.log('Error while processing tree, ERROR: ' + JSON.stringify(error));
        }
    });
}
ProcessHTMLTree();