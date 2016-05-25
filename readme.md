# inline-css
> inline your css like a pro

```shell
 inline-css -i {souce_file} -o {output/path}
```

## Example

> index.html

```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Document</title>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
  </body>
  </html>
```

> style.css

```css
 body {
  color: rebeccapurple; /* lol */
 }
 .some-class-style {
  margin: 0 0 999px 0;  
 }
 
```

will result in 

> build.html

```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Document</title>
    <style>
        body {
          color: rebeccapurple; /* lol */
        }
        .some-class-style {
          margin: 0 0 999px 0;  
        }
    </style>
  </head>
  <body>
  </body>
  </html>
```

###Install

```shell
  $ npm i inline-css-cli
  $ inline-css
```
