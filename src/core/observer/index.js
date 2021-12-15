/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/*
给对象添加一对 键值
function def (obj, key, val) {
  Object.defineProperty(obj, key, {
    value: val,
    enumerable: !!enumerable,
    writable: true,
    configurable: true
  })
}
 */
export class Observer {
  value: any;
  dep: Dep;
  vmCount: number; // number of vms that have this object as root $data
// 前面已经做了判断, value 是一个对象 或者 数组
  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    this.vmCount = 0
    def(value, '__ob__', this)  // 给当前对象添加一个__ob__对象, 是当前对响应式对象,用来缓存
    /*
    arrayMethods 是一个对象, 对可以修改原数组的方法方法做一层拦截，该对象的原型是 数组真正的原型 即Array.prototype.
    1. 如果数组支持 __proto__, 直接给数组的 __proto__ 赋值为该对象
    2. 不支持__proto__, 通过definePrototype 将每个处理好的方法 直接定义到 array
    */
    if (Array.isArray(value)) {
      if (hasProto) { // 是否有__proto__ 属性
        // target.__proto__ = src
        //          target  src
        protoAugment(value, arrayMethods)
      } else {
        // 如果不支持__proto__, 将定义好的拦截方法 一个一个的 添加到 数组的原型上
        copyAugment(value, arrayMethods, arrayKeys)
      }
      this.observeArray(value)
    } else {
      this.walk(value)
    }
  }
// 将对象对所有属性转换为 getter/setter
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      defineReactive(obj, keys[i])
    }
  }

  /**
   * 如果数组中的项是对象, 将其变为响应式对象
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers  将某个对象添加到数组到原型上
function protoAugment (target, src: Object) {
  target.__proto__ = src
}

// 对不支持__proto__ 属性的对象, 将定义好的拦截方法 通过Object.definePrototype的方法 一个一个定义到对象上。
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

// 将一个对象转换为响应式对象           asRootData 作为根属性
export function observe (value: any, asRootData: ?boolean): Observer | void {
/*   function isObject (obj) {   Array / Object
    return obj !== null && typeof obj === 'object'
  } */
  // 如果不是对象 或者 是VNode 实例 则不需要做响应式处理
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 将生成的响应式对象赋值给了 __ob__属性, 有的话直接取出
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    // isPlainObject
    (Array.isArray(value) || isPlainObject(value)) &&
    // Object.isExtensible() 判断一个对象是否是可以扩展的(可以添加新的属性)
    Object.isExtensible(value) &&
    !value._isVue// Vue实例对象不需要进行响应式处理
  ) {
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    ob.vmCount++
  }
  return ob
}

/**
 * 定义一个响应式对象
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  const dep = new Dep() // 用来收集属性依赖
// 获取对象属性的属性描述符, (对象的自由属性,不需要从原型链上进行查找的属性)
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 不存在某个属性的时候 返回undefined, 并判断属性是否是可配置的
  if (property && property.configurable === false) {
    return
  }

  // 用户可能传入getter 或者 setter。
  const getter = property && property.get
  const setter = property && property.set
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 如果传入了getter函数, 则访问属性的时候 返回自定义getter 返回的值
      const value = getter ? getter.call(obj) : val
      if (Dep.target) {
        dep.depend()
        if (childOb) {
          childOb.dep.depend()
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      return value
    },
    set: function reactiveSetter (newVal) {
      // 先获取之前的值,
      const value = getter ? getter.call(obj) : val
      // 如果两者相等 或者 新旧值为NaN的时候 直接返回
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      if (getter && !setter) return
      // 如果传入了setter函数, 调用用户传入的setter。
      if (setter) {
        setter.call(obj, newVal)
      } else {
        // 否则直接给value 赋值为 newValue
        val = newVal
      }
      childOb = !shallow && observe(newVal)
      // 数据更新的时候 发送通知
      dep.notify()
    }
  })
}

/**
给一个响应式对象动态添加属性 使之成为响应式
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  // 首先判断 添加的属性 是否是一个对象上添加
  /*
  function isUndef (){
    return v === undefined || v === null
  }
  function isPrimitive () {
    return (
      typeof value === 'string' ||
      typeof value === 'number' ||
      // $flow-disable-line
      typeof value === 'symbol' ||
      typeof value === 'boolean'
    )
 */
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  /*
  function isValidArrayIndex (){  判断数组下标是不是一个合法的 数字
    const n = parseFloat(String(val))
    return n >= 0 && Math.floor(n) === n && isFinite(val)
  }
  */
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    //可能原始数组 只有3项, 但是给第100项添加了数据, 所以找数组长度和添加数据位置 的最大值
    target.length = Math.max(target.length, key)
    target.splice(key, 1, val)
    return val
  }
  // 如果属性已经在对象上 并且 不是对象原型上的属性, 直接赋值就可以了
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 不能给vm 或者 $data 添加响应式数据
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果不是给响应式对象 添加属性
  if (!ob) {
    target[key] = val
    return val
  }
  defineReactive(ob.value, key, val)
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.splice(key, 1)
    return
  }
  const ob = (target: any).__ob__
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 判断删除的属性是否存在对象上
  if (!hasOwn(target, key)) {
    return
  }
  delete target[key]
  if (!ob) {
    return
  }
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
