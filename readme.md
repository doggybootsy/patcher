# Function Patcher
Allows you to alter what functions do.
## Usage
Example module, that includes functions we can patch.
```js
const myModule = {
  myFunction() {
    console.log("[Original]: ran")
    return "myReturn"
  },
  myOtherFunction() {
    console.log("[Original]: ran")
    return "myOtherReturn"
  }
}
```
### Basic
```js
patcher.type(module, function, callback)
```
### Before
Using the basic templat but for the type is `Before`.
In the callback you get 2 arguments
* `arguments` is an array of the arguments passed to the function.
* `this` is the `this` value of the function.
You dont need to return any values (will not be used at any point).
```js
patcher.before(myModule, "myFunction", (args, thisItem) => {
  console.log("[Before]: ran")
})
```
### Instead
Using the basic templat but for the type is `instead`.
In the callback you get 3 arguments
* `arguments` is an array of the arguments passed to the function.
* `original` is the original value of the function. (or a instead function)
* `this` is the `this` value of the function.
You need to return a function or nothing. (if nothing is returned the original function will be used)
```js
patcher.instead(myModule, "myFunction", (args, original, thisItem) => {
  console.log("[Instead]: ran")
  // The returned function gives the result to 'after'
  return () => {
    const result = original.apply(thisItem, args)
    console.log("[Instead]: return function ran")
    return result
  }
})
```
### After
Using the basic templat but for the type is `after`.
In the callback you get 3 arguments
* `arguments` is an array of the arguments passed to the function.
* `returnValue` is the value returned by the function.
* `this` is the `this` value of the function.
You dont need to return any values (will not be used at any point).
```js
patcher.after(myModule, "myFunction", (args, result, thisItem) => {
  console.log("[After]: ran")
})
```
### Undo
All patches return a undo value.
```js
const undo = patcher.after(myModule, "myFunction", (args, result, thisItem) => {
  console.log("[After]: ran")
})
// Later on
undo()
```
## Example
```js
const myModule = {
  myFunction() {
    console.log("[Original]: ran")
    return "myReturn"
  },
  myOtherFunction() {
    console.log("[Original]: ran")
    return "myOtherReturn"
  }
}
const undo = patcher.before(myModule, "myFunction", (args, thisItem) => {
  console.log("[Before]: ran")
})
// this will log both logs
myModule.myFunction("myArgument")
// undo
undo()
// this will log only the original log
myModule.myFunction("myArgument")
```