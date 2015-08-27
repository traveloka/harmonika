# Harmonika

![Harmonika](https://dl.dropboxusercontent.com/u/9834816/harmonika.png)

**Harmonika** parse your Closure code to ES6. Extended from existing project [xto6](https://github.com/mohebifar/xto6), with additional on-going features to support Closure.

## Install
```bash
$ npm install harmonika
```

## Run Example
```bash
$ harmonika  -s input_files/sample2.js
```

## Developing
Clone from [github](https://github.com/semmatabei/harmonika)

```bash
$ npm install
$ grunt
$ node bin/index.js --help
```

## Directory Structure
```bash
* bin /
  | - index.js (main entry)
* input_files /(sample)
* src /
  | - syntax /
      | - AST representation (reference Mozilla Parser AST)
  | - transformation / (list of parser function)
  | - utils / (string->ast && ast -> string library)
* test /
```

## Previous project existing features
* Function/Prototypes to Classes
* Callback to Arrow functions
* String concatenation to Template Strings
* Using `let` and `const` instead of `var`
* Default arguments instead of `a = a || 2`
* Function properties in objects to Object methods

## Added features
- Remove Namespace
- Convert Google Closure code (`goog.require`, `goog.provide`, `goog.inherits`, `goog.isDefinedAndNotNull`) to compatible ES6 features
- Convert Closure annotation to Flow type (Currently support : `@param`, `@type`, `@typedef`, `@return`) and Import/Export type
- Detect Inheritance (`super` call, `extend`)
- Improve constructor to support arguments
- `import` support
- `export` support
- Implicit import (import all undefined identifier)
- `static` method
- `static` properties
- Base class method call using `super`
- Improve let/const to understand object assignment
- Singleton export
 
## To-do Features
