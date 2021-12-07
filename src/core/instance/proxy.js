/* not type checking this file because flow doesn't play well with Proxy */

import config from 'core/config'
import { warn, makeMap, isNative } from '../util/index'

let initProxy

if (process.env.NODE_ENV !== 'production') {
  // 定义一个白名单,允许在模版中直接使用而不用在data中 和 methods中定义的数据或方法
  const allowedGlobals = makeMap(
    'Infinity,undefined,NaN,isFinite,isNaN,' +
    'parseFloat,parseInt,decodeURI,decodeURIComponent,encodeURI,encodeURIComponent,' +
    'Math,Number,Date,Array,Object,Boolean,String,RegExp,Map,Set,JSON,Intl,BigInt,' +
    'require' // for Webpack/Browserify
  )
    // 属性或者方法 没有设置但是在 实例中使用了。
  const warnNonPresent = (target, key) => {
    warn(
      `Property or method "${key}" is not defined on the instance but ` +
      'referenced during render. Make sure that this property is reactive, ' +
      'either in the data option, or for class-based components, by ' +
      'initializing the property. ' +
      'See: https://vuejs.org/v2/guide/reactivity.html#Declaring-Reactive-Properties.',
      target
    )
  }
  const warnReservedPrefix = (target, key) => {
    warn(
      `Property "${key}" must be accessed with "$data.${key}" because ` +
      'properties starting with "$" or "_" are not proxied in the Vue instance to ' +
      'prevent conflicts with Vue internals. ' +
      'See: https://vuejs.org/v2/api/#data',
      target
    )
  }
  // 判断浏览器是否支持 Proxy
  const hasProxy = typeof Proxy !== 'undefined' && isNative(Proxy)

  if (hasProxy) {
    // 内置的事件标识符,判断是否是Vue内置提供的事件修饰符,如果是的话禁止
    const isBuiltInModifier = makeMap('stop,prevent,self,ctrl,shift,alt,meta,exact')
    config.keyCodes = new Proxy(config.keyCodes, {
      set (target, key, value) {
        if (isBuiltInModifier(key)) {
          warn(`Avoid overwriting built-in modifier in config.keyCodes: .${key}`)
          return false
        } else {
          target[key] = value
          return true
        }
      }
    })
  }

  const hasHandler = {  // 对象 in 操作符进行代理
    has (target, key) {
      const has = key in target //判断属性是属于vm实例上的属性
      // 如果属性是在白名单里 或者 是以下划线开头的字符串并且不在$data里,在编译时是可以访问到的属性(渲染函数_c _v等)
      const isAllowed = allowedGlobals(key) || (typeof key === 'string' && key.charAt(0) === '_' && !(key in target.$data))
      if (!has && !isAllowed) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return has || !isAllowed
    }
  }

  const getHandler = {  // 拦截对象的属性读取操作
    get (target, key) {
      if (typeof key === 'string' && !(key in target)) {
        if (key in target.$data) warnReservedPrefix(target, key)
        else warnNonPresent(target, key)
      }
      return target[key]
    }
  }

  initProxy = function initProxy (vm) {
    if (hasProxy) {
      const options = vm.$options // 传递给Vue构造函数的初始化选项 options。
      const handlers = options.render && options.render._withStripped
        ? getHandler
        : hasHandler
        // 将代理对象赋值给vm._renderProxy,对vm实例对象的属性访问会被拦截。
      vm._renderProxy = new Proxy(vm, handlers)
    } else {
      vm._renderProxy = vm
    }
  }
}

/*
vm.$options.render = function(){
  with(this){ this指向vm._renderProxy
    return _c('div',[_v(_s(a))])
  }
}
*/

/*
在with语句块内访问a 就相当于访问vm._renderProxy的a属性。
*/

export { initProxy }
