interface SymbolConstructor { patcherSymbol: symbol }
interface patcher {
  after: (module:any, functionToPatch:string, callback:(args:IArguments, result:any, thisObject:ThisType<typeof module>) => void) => () => void
  instead: (module:any, functionToPatch:string, callback:(args:IArguments, originalFunction:Function, thisObject:ThisType<typeof module>) => void) => () => void
  before: (module:any, functionToPatch:string, callback:(args:IArguments, thisObject:ThisType<typeof module>) => void) => () => void
}
type patchInHook = {
  sym: symbol
  callback: Function
}

Object.defineProperty(Symbol, "patcherSymbol", {
  enumerable: false,
  writable: false,
  configurable: false,
  value: Symbol("Patcher.Symbol")
})

function hookModule(module:any, functionToPatch:string) {
  let originalFunction = module[functionToPatch]
  if (!(typeof originalFunction === "function" || typeof originalFunction === "undefined"))
  if (!originalFunction) originalFunction = () => {}
  let hook = originalFunction[Symbol.patcherSymbol]
  if (hook) return hook

  Object.defineProperty(module, functionToPatch, {
    writable: true,
    configurable: true,
    value: function(this:ThisType<typeof module>) {
      if (!hook) hook = module[functionToPatch][Symbol.patcherSymbol]
      hook.before.forEach((before:patchInHook) => before.callback([ arguments, this ]))
      let insteadFunction = originalFunction
      hook.instead.forEach((instead:patchInHook) => {
        const res = instead.callback([ arguments, insteadFunction, this ])
        if (typeof res === "function") insteadFunction = res
      })
      const res = insteadFunction.apply(this, arguments)
      hook.after.forEach((after:patchInHook) => after.callback([ arguments, res, this ]))
      return res
    }
  })
  
  Object.defineProperty(module[functionToPatch], "toString", {
    enumerable: false,
    writable: true,
    configurable: true,
    value: () => originalFunction.toString()
  })
  Object.defineProperty(module[functionToPatch].toString, "toString", {
    enumerable: false,
    writable: true,
    configurable: true,
    value: () => originalFunction.toString.toString()
  })

  Object.assign(module[functionToPatch], originalFunction)

  return module[functionToPatch][Symbol.patcherSymbol] = {
    original: originalFunction,
    after: [],
    instead: [],
    before: [],
    undo: () => module[functionToPatch] = originalFunction
  }
}

function patch(module:any, functionToPatch:string, callback:Function, type:"after"|"instead"|"before"):() => void {
  const hook = hookModule(module, functionToPatch)
  const sym = Symbol()
  hook[type].push({ sym, callback })
  return () => {
    const found = hook[type].find((patches:patchInHook) => patches.sym === sym)
    if (!found) return
    const index = hook[type].indexOf(found)
    hook[type].splice(index, 1)
  }
}

// Export
const patcherModule:patcher = {
  after(module, functionToPatch, callback) { return patch(module, functionToPatch, callback, "after") },
  instead(module, functionToPatch, callback) { return patch(module, functionToPatch, callback, "instead") },
  before(module, functionToPatch, callback) { return patch(module, functionToPatch, callback, "before") }
}

module.exports = patcherModule