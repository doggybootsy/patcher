Object.defineProperty(Symbol, "patcherSymbol", {
  enumerable: false,
  writable: false,
  configurable: false,
  value: Symbol("Patcher.Symbol")
})

function hookModule(module, fn) {
  let originalFunction = module[fn]
  if (!originalFunction) originalFunction = () => {}
  let hook = originalFunction[Symbol.patcherSymbol]
  if (hook) return hook
  
  Object.defineProperty(module, fn, {
    writable: true,
    configurable: true,
    value: function() {
      if (!hook) hook = module[fn][Symbol.patcherSymbol]
      for (const { callback } of module[fn].before) callback(arguments, this)
      let instead = originalFunction
      for (const { callback } of module[fn].instead) {
        const res = callback(arguments, instead, this)
        if (typeof res === "function") instead = res
      }
      const res = instead.apply(this, arguments)
      for (const { callback } of module[fn].after) callback(arguments, res, this)
      return res
    }
  })
  
  Object.defineProperty(module[fn], "toString", {
    enumerable: false,
    writable: true,
    configurable: true,
    value: () => originalFunction.toString()
  })
  Object.defineProperty(module[fn].toString, "toString", {
    enumerable: false,
    writable: true,
    configurable: true,
    value: () => originalFunction.toString.toString()
  })

  Object.assign(module[fn], originalFunction)

  return module[fn][Symbol.patcherSymbol] = {
    original: originalFunction,
    after: [],
    instead: [],
    before: []
  }
}

function patch(module, functionToPatch, callback, type) {
  const hook = hookModule(module, functionToPatch)
  const sym = Symbol()
  hook[type].push({ sym, callback })
  return () => {
    const found = hook[type].find((patches) => patches.sym === sym)
    if (!found) return
    const index = hook[type].indexOf(found)
    hook[type].splice(index, 1)
  }
}

exports.after = (module, functionToPatch, callback) => patch(module, functionToPatch, callback, "after")
exports.instead = (module, functionToPatch, callback) => patch(module, functionToPatch, callback, "instead")
exports.before = (module, functionToPatch, callback) => patch(module, functionToPatch, callback, "before")