'use strict';
const cssTokenizer = function (source) {
  let _current = 0;
  let _tokens = [];
  while(_current < source.length) {
    let char = source[_current];
    if (char === '{') {
      _tokens.push({
        type: 'lbracket',
        value: char
      });
      _current++;
      continue;
    }
    if (char === '}') {
      _tokens.push({
        type: 'rbracket',
        value: char
      });
      _current++;
      continue;
    }
    if (char === ';') {
      _tokens.push({
        type: 'semicolumn',
        value: char
      });
      _current++;
      continue;
    }
    if (char === ':') {
      _tokens.push({
        type: 'dots',
        value: char
      });
      _current++;
      continue;
    }
    if (char === ',') {
      _tokens.push({
        type: 'comma',
        value: char
      });
    }
    if (/\s/.test(char)) {
      _current++;
      continue;
    }
    const predefined = /[^{}\[\]=:;]/i;
    if (predefined.test(char)) {
      let _value = '';
      while(predefined.test(char)) {
        _value += char;
        char = source[++_current];
      }
      _tokens.push({
        type: 'property',
        value: _value
      });
      continue;
    }
    throw new TypeError('Unknown symbol' + char);
  }
  return _tokens;
};

const cssParser = function (tokens) {
  let _ast;
  let _current = 0;
  function walk() {
    let token = tokens[_current];
    console.log(token);
    if (token.type === 'property') {
      let _cache = token;
      token = tokens[++_current];
      if (token.type === 'lbracket') {
        let node = {
          type: 'SelectorStyle',
          value: _cache.value,
          content: []
        };
        token = tokens[++_current];
        while(token.type !== 'rbracket') {
          node.content.push(walk());
          token = tokens[_current];
        }
        return node;
      }
      if (token.type === 'dots') {
        token = tokens[++_current];
        if (token.type !== 'property') throw new TypeError('Uncorrect property assigment');
        let node = {
          type: 'SelectorProperty',
          value: _cache.value,
          equal: token.value
        }
        return node;
      }
    }
    if (token.type === 'rbracket') {
      _current++;
      return {
        type: 'Rbracket',
        value: token.value
      };
    }
    throw new TypeError('Invalid css syntax');
  }
  _ast = {
    type: 'CssFile',
    body: []
  };
  while(_current < tokens.length) {
    _ast.body.push(walk());
  }
  return _ast;
};

module.exports = {
  lexer: cssTokenizer,
  parser: cssParser
};
